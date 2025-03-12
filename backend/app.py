from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import re

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'salon_inventory'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
}

def get_db_connection():
    """Create a connection to the MySQL database."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

def standardize_unit(unit_str):
    """Convert unit strings to standardized format."""
    unit_mappings = {
        'BTL-BOTTLES': 'BTL',
        'PCS-PIECES': 'PCS',
        'BOX-BOXES': 'BOX',
        'JAR-JARS': 'JAR',
        'PKT-PACKETS': 'PKT'
    }
    
    for key, value in unit_mappings.items():
        if key in unit_str:
            return value
    return unit_str

def extract_and_standardize_headers(df):
    """Extract and standardize column headers from Excel files with complex headers."""
    header_mappings = {
        # Purchase section
        r'Unnamed: \d+': 'Purchase_Date',
        'Invoice No.': 'Purchase_Invoice_No',
        'Qty.': 'Purchase_Qty',
        'Incl. GST': 'Purchase_Incl_GST',
        'Ex. GST': 'Purchase_Ex_GST',
        'Taxable Value': 'Purchase_Taxable_Value',
        'IGST': 'Purchase_IGST',
        'CGST': 'Purchase_CGST',
        'SGST': 'Purchase_SGST',
        'Invoice Value': 'Purchase_Invoice_Value',
        
        # Sales section
        r'Unnamed: \d+': 'Sales_Date',
        'Invoice No.': 'Sales_Invoice_No',
        'Qty.': 'Sales_Qty',
        'Incl. GST': 'Sales_Incl_GST',
        'Ex. GST': 'Sales_Ex_GST',
        'Taxable Value': 'Sales_Taxable_Value',
        'IGST': 'Sales_IGST',
        'CGST': 'Sales_CGST',
        'SGST': 'Sales_SGST',
        'Invoice Value': 'Sales_Invoice_Value',
        
        # Consumption section
        r'Unnamed: \d+': 'Consumption_Date',
        'Invoice No.': 'Consumption_Invoice_No',
        'Qty.': 'Consumption_Qty',
        'Incl. GST': 'Consumption_Incl_GST',
        'Ex. GST': 'Consumption_Ex_GST',
        'Taxable Value': 'Consumption_Taxable_Value',
        'IGST': 'Consumption_IGST',
        'CGST': 'Consumption_CGST',
        'SGST': 'Consumption_SGST',
        'Invoice Value': 'Consumption_Invoice_Value',
        
        # Balance section
        r'Unnamed: \d+': 'Balance_Qty',
    }
    
    standardized_columns = []
    for col in df.columns:
        matched = False
        for pattern, replacement in header_mappings.items():
            if re.match(pattern, col) or col == pattern:
                standardized_columns.append(replacement)
                matched = True
                break
        if not matched:
            standardized_columns.append(col)
    
    return standardized_columns

def fix_floating_point_errors(value):
    """Fix floating point errors in numeric values."""
    if isinstance(value, (int, float)):
        if abs(value) < 1e-10:  # If very close to zero
            return 0.0
        return round(value, 2)
    return value

@app.route('/api/extract-stock', methods=['POST'])
def extract_stock():
    """
    Extract stock data from uploaded Excel file and store in database.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'File must be an Excel spreadsheet'}), 400
    
    try:
        # Read the Excel file
        df = pd.read_excel(file, sheet_name="STOCK DETAILS")
        
        # Clean and transform the data
        df.columns = extract_and_standardize_headers(df)
        
        # Process each section of the Excel file
        purchases = process_purchase_section(df)
        sales = process_sales_section(df)
        consumption = process_consumption_section(df)
        balance = process_balance_section(df)
        
        # Store data in the database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Insert products
        for product in extract_unique_products(purchases + sales + consumption + balance):
            insert_product(cursor, product)
        
        # Insert purchases
        for purchase in purchases:
            insert_purchase(cursor, purchase)
        
        # Insert sales
        for sale in sales:
            insert_sale(cursor, sale)
        
        # Insert consumption
        for cons in consumption:
            insert_consumption(cursor, cons)
        
        # Update balance stock
        for bal in balance:
            update_balance_stock(cursor, bal)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Stock data extracted and stored successfully',
            'stats': {
                'products': len(extract_unique_products(purchases + sales + consumption + balance)),
                'purchases': len(purchases),
                'sales': len(sales),
                'consumption': len(consumption)
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_purchase_section(df):
    """Process the PURCHASE - STOCK IN section of the Excel file."""
    purchase_section = df[df.iloc[:, 0] == "PURCHASE - STOCK IN"]
    if purchase_section.empty:
        return []
    
    # Find the section start and end indices
    start_idx = purchase_section.index[0] + 1  # +1 to skip the header row
    end_idx = None
    
    for idx in range(start_idx + 1, len(df)):
        if df.iloc[idx, 0] in ["SALES TO CUSTOMER - STOCK OUT", "SALON CONSUMPTION - STOCK OUT", "BALANCE STOCK"]:
            end_idx = idx - 1
            break
    
    if end_idx is None:
        end_idx = len(df) - 1
    
    # Extract the purchase data
    purchase_data = df.iloc[start_idx:end_idx+1]
    
    # Filter out rows without any product name
    purchase_data = purchase_data[purchase_data['Product Name'].notna()]
    
    purchases = []
    for _, row in purchase_data.iterrows():
        purchases.append({
            'id': str(uuid.uuid4()),
            'date': row.get('Purchase_Date', None),
            'product_name': row.get('Product Name', ''),
            'hsn_code': row.get('HSN Code', ''),
            'unit': standardize_unit(str(row.get('UNITS', ''))),
            'invoice_no': row.get('Purchase_Invoice_No', ''),
            'qty': fix_floating_point_errors(row.get('Purchase_Qty', 0)),
            'incl_gst': fix_floating_point_errors(row.get('Purchase_Incl_GST', 0)),
            'ex_gst': fix_floating_point_errors(row.get('Purchase_Ex_GST', 0)),
            'taxable_value': fix_floating_point_errors(row.get('Purchase_Taxable_Value', 0)),
            'igst': fix_floating_point_errors(row.get('Purchase_IGST', 0)),
            'cgst': fix_floating_point_errors(row.get('Purchase_CGST', 0)),
            'sgst': fix_floating_point_errors(row.get('Purchase_SGST', 0)),
            'invoice_value': fix_floating_point_errors(row.get('Purchase_Invoice_Value', 0)),
            'transaction_type': 'purchase',
            'supplier': row.get('Supplier', '') if 'Supplier' in row else ''
        })
    
    return purchases

def process_sales_section(df):
    """Process the SALES TO CUSTOMER - STOCK OUT section of the Excel file."""
    sales_section = df[df.iloc[:, 0] == "SALES TO CUSTOMER - STOCK OUT"]
    if sales_section.empty:
        return []
    
    # Find the section start and end indices
    start_idx = sales_section.index[0] + 1  # +1 to skip the header row
    end_idx = None
    
    for idx in range(start_idx + 1, len(df)):
        if df.iloc[idx, 0] in ["SALON CONSUMPTION - STOCK OUT", "BALANCE STOCK"]:
            end_idx = idx - 1
            break
    
    if end_idx is None:
        end_idx = len(df) - 1
    
    # Extract the sales data
    sales_data = df.iloc[start_idx:end_idx+1]
    
    # Filter out rows without any product name
    sales_data = sales_data[sales_data['Product Name'].notna()]
    
    sales = []
    for _, row in sales_data.iterrows():
        # Determine payment method if available
        payment_method = row.get('Payment Method', 'cash') if 'Payment Method' in row else 'cash'
        
        sales.append({
            'id': str(uuid.uuid4()),
            'date': row.get('Sales_Date', None),
            'product_name': row.get('Product Name', ''),
            'hsn_code': row.get('HSN Code', ''),
            'unit': standardize_unit(str(row.get('UNITS', ''))),
            'invoice_no': row.get('Sales_Invoice_No', ''),
            'qty': fix_floating_point_errors(row.get('Sales_Qty', 0)),
            'incl_gst': fix_floating_point_errors(row.get('Sales_Incl_GST', 0)),
            'ex_gst': fix_floating_point_errors(row.get('Sales_Ex_GST', 0)),
            'taxable_value': fix_floating_point_errors(row.get('Sales_Taxable_Value', 0)),
            'igst': fix_floating_point_errors(row.get('Sales_IGST', 0)),
            'cgst': fix_floating_point_errors(row.get('Sales_CGST', 0)),
            'sgst': fix_floating_point_errors(row.get('Sales_SGST', 0)),
            'invoice_value': fix_floating_point_errors(row.get('Sales_Invoice_Value', 0)),
            'transaction_type': 'sale',
            'payment_method': payment_method,
            'customer': row.get('Customer', '') if 'Customer' in row else ''
        })
    
    return sales

def process_consumption_section(df):
    """Process the SALON CONSUMPTION - STOCK OUT section of the Excel file."""
    consumption_section = df[df.iloc[:, 0] == "SALON CONSUMPTION - STOCK OUT"]
    if consumption_section.empty:
        return []
    
    # Find the section start and end indices
    start_idx = consumption_section.index[0] + 1  # +1 to skip the header row
    end_idx = None
    
    for idx in range(start_idx + 1, len(df)):
        if df.iloc[idx, 0] in ["BALANCE STOCK"]:
            end_idx = idx - 1
            break
    
    if end_idx is None:
        end_idx = len(df) - 1
    
    # Extract the consumption data
    consumption_data = df.iloc[start_idx:end_idx+1]
    
    # Filter out rows without any product name
    consumption_data = consumption_data[consumption_data['Product Name'].notna()]
    
    consumption = []
    for _, row in consumption_data.iterrows():
        consumption.append({
            'id': str(uuid.uuid4()),
            'date': row.get('Consumption_Date', None),
            'product_name': row.get('Product Name', ''),
            'hsn_code': row.get('HSN Code', ''),
            'unit': standardize_unit(str(row.get('UNITS', ''))),
            'qty': fix_floating_point_errors(row.get('Consumption_Qty', 0)),
            'transaction_type': 'consumption',
            'purpose': row.get('Purpose', '') if 'Purpose' in row else ''
        })
    
    return consumption

def process_balance_section(df):
    """Process the BALANCE STOCK section of the Excel file."""
    balance_section = df[df.iloc[:, 0] == "BALANCE STOCK"]
    if balance_section.empty:
        return []
    
    # Find the section start index
    start_idx = balance_section.index[0] + 1  # +1 to skip the header row
    
    # Extract the balance data
    balance_data = df.iloc[start_idx:]
    
    # Filter out rows without any product name
    balance_data = balance_data[balance_data['Product Name'].notna()]
    
    balance = []
    for _, row in balance_data.iterrows():
        balance.append({
            'product_name': row.get('Product Name', ''),
            'hsn_code': row.get('HSN Code', ''),
            'unit': standardize_unit(str(row.get('UNITS', ''))),
            'qty': fix_floating_point_errors(row.get('Balance_Qty', 0))
        })
    
    return balance

def extract_unique_products(transactions):
    """Extract unique products from all transactions."""
    products = {}
    for transaction in transactions:
        key = (transaction['product_name'], transaction['hsn_code'])
        if key not in products:
            products[key] = {
                'id': str(uuid.uuid4()),
                'name': transaction['product_name'],
                'hsn_code': transaction['hsn_code'],
                'unit': transaction['unit'] if 'unit' in transaction else ''
            }
    
    return list(products.values())

def insert_product(cursor, product):
    """Insert a product into the database."""
    try:
        # Check if the product already exists
        cursor.execute(
            "SELECT id FROM products WHERE name = %s AND hsn_code = %s",
            (product['name'], product['hsn_code'])
        )
        existing = cursor.fetchone()
        
        if existing:
            # Product exists, update it
            cursor.execute(
                """
                UPDATE products 
                SET unit = %s
                WHERE id = %s
                """,
                (product['unit'], existing[0])
            )
        else:
            # Product doesn't exist, insert it
            cursor.execute(
                """
                INSERT INTO products (id, name, hsn_code, unit, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    product['id'],
                    product['name'],
                    product['hsn_code'],
                    product['unit'],
                    datetime.now()
                )
            )
    except Error as e:
        print(f"Error inserting/updating product: {e}")
        raise

def insert_purchase(cursor, purchase):
    """Insert a purchase record into the database."""
    try:
        # Get product_id
        cursor.execute(
            "SELECT id FROM products WHERE name = %s AND hsn_code = %s",
            (purchase['product_name'], purchase['hsn_code'])
        )
        product = cursor.fetchone()
        
        if not product:
            raise ValueError(f"Product not found: {purchase['product_name']}")
        
        product_id = product[0]
        
        # Insert the purchase
        cursor.execute(
            """
            INSERT INTO purchases (
                id, product_id, date, invoice_no, qty, incl_gst, ex_gst,
                taxable_value, igst, cgst, sgst, invoice_value, supplier,
                transaction_type, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                purchase['id'],
                product_id,
                purchase['date'] if purchase['date'] else datetime.now(),
                purchase['invoice_no'],
                purchase['qty'],
                purchase['incl_gst'],
                purchase['ex_gst'],
                purchase['taxable_value'],
                purchase['igst'],
                purchase['cgst'],
                purchase['sgst'],
                purchase['invoice_value'],
                purchase['supplier'],
                purchase['transaction_type'],
                datetime.now()
            )
        )
    except Error as e:
        print(f"Error inserting purchase: {e}")
        raise

def insert_sale(cursor, sale):
    """Insert a sale record into the database."""
    try:
        # Get product_id
        cursor.execute(
            "SELECT id FROM products WHERE name = %s AND hsn_code = %s",
            (sale['product_name'], sale['hsn_code'])
        )
        product = cursor.fetchone()
        
        if not product:
            raise ValueError(f"Product not found: {sale['product_name']}")
        
        product_id = product[0]
        
        # Insert the sale
        cursor.execute(
            """
            INSERT INTO sales (
                id, product_id, date, invoice_no, qty, incl_gst, ex_gst,
                taxable_value, igst, cgst, sgst, invoice_value, customer,
                payment_method, transaction_type, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                sale['id'],
                product_id,
                sale['date'] if sale['date'] else datetime.now(),
                sale['invoice_no'],
                sale['qty'],
                sale['incl_gst'],
                sale['ex_gst'],
                sale['taxable_value'],
                sale['igst'],
                sale['cgst'],
                sale['sgst'],
                sale['invoice_value'],
                sale['customer'],
                sale['payment_method'],
                sale['transaction_type'],
                datetime.now()
            )
        )
    except Error as e:
        print(f"Error inserting sale: {e}")
        raise

def insert_consumption(cursor, consumption):
    """Insert a consumption record into the database."""
    try:
        # Get product_id
        cursor.execute(
            "SELECT id FROM products WHERE name = %s AND hsn_code = %s",
            (consumption['product_name'], consumption['hsn_code'])
        )
        product = cursor.fetchone()
        
        if not product:
            raise ValueError(f"Product not found: {consumption['product_name']}")
        
        product_id = product[0]
        
        # Insert the consumption
        cursor.execute(
            """
            INSERT INTO consumption (
                id, product_id, date, qty, purpose, transaction_type, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                consumption['id'],
                product_id,
                consumption['date'] if consumption['date'] else datetime.now(),
                consumption['qty'],
                consumption['purpose'],
                consumption['transaction_type'],
                datetime.now()
            )
        )
    except Error as e:
        print(f"Error inserting consumption: {e}")
        raise

def update_balance_stock(cursor, balance):
    """Update the balance stock record in the database."""
    try:
        # Get product_id
        cursor.execute(
            "SELECT id FROM products WHERE name = %s AND hsn_code = %s",
            (balance['product_name'], balance['hsn_code'])
        )
        product = cursor.fetchone()
        
        if not product:
            raise ValueError(f"Product not found: {balance['product_name']}")
        
        product_id = product[0]
        
        # Check if a balance stock record already exists
        cursor.execute(
            "SELECT id FROM balance_stock WHERE product_id = %s",
            (product_id,)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Update existing record
            cursor.execute(
                """
                UPDATE balance_stock 
                SET qty = %s, updated_at = %s
                WHERE product_id = %s
                """,
                (balance['qty'], datetime.now(), product_id)
            )
        else:
            # Insert new record
            cursor.execute(
                """
                INSERT INTO balance_stock (
                    id, product_id, qty, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    str(uuid.uuid4()),
                    product_id,
                    balance['qty'],
                    datetime.now(),
                    datetime.now()
                )
            )
    except Error as e:
        print(f"Error updating balance stock: {e}")
        raise

@app.route('/api/convert-transaction', methods=['POST'])
def convert_transaction():
    """
    Convert selected cash sales transactions to salon consumption.
    """
    data = request.json
    if not data or 'transactionIds' not in data:
        return jsonify({'error': 'No transaction IDs provided'}), 400
    
    transaction_ids = data['transactionIds']
    if not transaction_ids:
        return jsonify({'error': 'Empty transaction IDs list'}), 400
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Fetch the sales transactions
        placeholders = ', '.join(['%s'] * len(transaction_ids))
        cursor.execute(
            f"""
            SELECT s.*, p.name as product_name, p.hsn_code, p.unit 
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.id IN ({placeholders}) AND s.payment_method = 'cash'
            """,
            transaction_ids
        )
        
        sales_to_convert = cursor.fetchall()
        
        if not sales_to_convert:
            return jsonify({'error': 'No valid cash transactions found with the provided IDs'}), 404
        
        # Begin transaction
        conn.start_transaction()
        
        converted_count = 0
        for sale in sales_to_convert:
            # Insert into consumption table
            consumption_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO consumption (
                    id, product_id, date, qty, purpose, transaction_type, 
                    original_sale_id, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    consumption_id,
                    sale['product_id'],
                    sale['date'],
                    sale['qty'],
                    'Converted from cash sale',
                    'consumption',
                    sale['id'],
                    datetime.now()
                )
            )
            
            # Mark the original sale as converted
            cursor.execute(
                """
                UPDATE sales
                SET converted_to_consumption = 1, 
                    converted_at = %s,
                    consumption_id = %s
                WHERE id = %s
                """,
                (datetime.now(), consumption_id, sale['id'])
            )
            
            converted_count += 1
        
        # Commit the transaction
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully converted {converted_count} transactions',
            'convertedCount': converted_count
        })
    
    except Exception as e:
        # Rollback in case of error
        if conn and conn.is_connected():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/cash-sales', methods=['GET'])
def get_cash_sales():
    """
    Get all cash sales transactions that haven't been converted to consumption.
    """
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT s.*, p.name as product_name, p.hsn_code, p.unit 
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.payment_method = 'cash' AND (s.converted_to_consumption = 0 OR s.converted_to_consumption IS NULL)
            ORDER BY s.date DESC
            """
        )
        
        cash_sales = cursor.fetchall()
        conn.close()
        
        # Convert datetime objects to strings for JSON serialization
        for sale in cash_sales:
            if isinstance(sale['date'], datetime):
                sale['date'] = sale['date'].strftime('%Y-%m-%d')
            if isinstance(sale['created_at'], datetime):
                sale['created_at'] = sale['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify({
            'success': True,
            'cash_sales': cash_sales
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 