from flask import Flask, request, jsonify, send_file
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
import tempfile
import json

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

@app.route('/api/inventory/parse-excel', methods=['POST'])
def parse_inventory_excel():
    """Parse the STOCK DETAILS Excel file and organize data according to requirements."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'File must be an Excel file (.xlsx or .xls)'}), 400
    
    try:
        # Read the Excel file, specifying header rows
        # For a multi-header Excel, we'll read with header=None first and then process
        df = pd.read_excel(file, sheet_name="STOCK DETAILS", header=None)
        
        # Determine the structure of the file
        # Find header rows that contain our key section titles
        purchase_header_row = None
        sales_header_row = None
        consumption_header_row = None
        balance_header_row = None
        
        for idx, row in enumerate(df.values):
            row_str = ' '.join(str(cell) for cell in row if pd.notna(cell))
            if 'PURCHASE - STOCK IN' in row_str:
                purchase_header_row = idx
            elif 'SALES TO CUSTOMER - STOCK OUT' in row_str:
                sales_header_row = idx
            elif 'SALON CONSUMPTION - STOCK OUT' in row_str:
                consumption_header_row = idx
            elif 'BALANCE STOCK' in row_str:
                balance_header_row = idx
        
        if purchase_header_row is None or sales_header_row is None or consumption_header_row is None:
            return jsonify({'error': 'Invalid Excel format: Missing required sections'}), 400
        
        # Extract data from each section
        # For each section, we need to:
        # 1. Find the actual column headers (typically one row after the section title)
        # 2. Map the unnamed columns to proper names
        # 3. Extract the data rows until the next section
        
        # Process Purchase section
        purchase_cols_row = purchase_header_row + 1
        purchase_data_start = purchase_header_row + 2
        purchase_data_end = sales_header_row - 1 if sales_header_row else len(df)
        
        purchase_headers = df.iloc[purchase_cols_row].to_list()
        purchase_headers = [str(col) if pd.notna(col) else f"Unnamed_{i}" for i, col in enumerate(purchase_headers)]
        
        # Map unnamed columns to meaningful names for purchases
        purchase_col_mapping = {
            'Unnamed_0': 'Date',
            'Unnamed_1': 'Product Name',
            'Unnamed_2': 'HSN Code',
            'Unnamed_3': 'UNITS',
            'Unnamed_4': 'Invoice No.',
            'Unnamed_5': 'Qty.',
            'Unnamed_6': 'Price Incl. GST',
            'Unnamed_7': 'Price Ex. GST',
            'Unnamed_8': 'Discount %',
            'Unnamed_9': 'Purchase Cost Per Unit Ex. GST',
            'Unnamed_10': 'GST %',
            'Unnamed_11': 'Taxable Value',
            'Unnamed_12': 'IGST',
            'Unnamed_13': 'CGST',
            'Unnamed_14': 'SGST',
            'Unnamed_15': 'Invoice Value'
        }
        
        # Apply the column mapping
        mapped_purchase_headers = [purchase_col_mapping.get(col, col) for col in purchase_headers]
        
        # Extract purchase data
        purchase_data = df.iloc[purchase_data_start:purchase_data_end].copy()
        purchase_data.columns = purchase_headers
        # Rename columns using the mapping
        purchase_data = purchase_data.rename(columns=purchase_col_mapping)
        
        # Process Sales section
        sales_cols_row = sales_header_row + 1
        sales_data_start = sales_header_row + 2
        sales_data_end = consumption_header_row - 1 if consumption_header_row else len(df)
        
        sales_headers = df.iloc[sales_cols_row].to_list()
        sales_headers = [str(col) if pd.notna(col) else f"Unnamed_{i}" for i, col in enumerate(sales_headers)]
        
        # Map unnamed columns to meaningful names for sales
        sales_col_mapping = {
            'Unnamed_0': 'Date',
            'Unnamed_1': 'Product Name',
            'Unnamed_2': 'HSN Code',
            'Unnamed_3': 'UNITS',
            'Unnamed_4': 'Invoice No.',
            'Unnamed_5': 'Qty.',
            'Unnamed_6': 'Purchase Cost Per Unit Ex. GST',
            'Unnamed_7': 'Purchase GST %',
            'Unnamed_8': 'Purchase Taxable Value',
            'Unnamed_9': 'Purchase IGST',
            'Unnamed_10': 'Purchase CGST',
            'Unnamed_11': 'Purchase SGST',
            'Unnamed_12': 'Total Purchase Cost',
            'Unnamed_13': 'MRP Incl. GST',
            'Unnamed_14': 'MRP Ex. GST',
            'Unnamed_15': 'Discount %',
            'Unnamed_16': 'Discounted Sales Rate Ex. GST',
            'Unnamed_17': 'Sales GST %',
            'Unnamed_18': 'Sales Taxable Value',
            'Unnamed_19': 'Sales IGST',
            'Unnamed_20': 'Sales CGST',
            'Unnamed_21': 'Sales SGST',
            'Unnamed_22': 'Invoice Value'
        }
        
        # Apply the column mapping
        mapped_sales_headers = [sales_col_mapping.get(col, col) for col in sales_headers]
        
        # Extract sales data
        sales_data = df.iloc[sales_data_start:sales_data_end].copy()
        sales_data.columns = sales_headers
        # Rename columns using the mapping
        sales_data = sales_data.rename(columns=sales_col_mapping)
        
        # Process Consumption section
        consumption_cols_row = consumption_header_row + 1
        consumption_data_start = consumption_header_row + 2
        consumption_data_end = balance_header_row - 1 if balance_header_row else len(df)
        
        consumption_headers = df.iloc[consumption_cols_row].to_list()
        consumption_headers = [str(col) if pd.notna(col) else f"Unnamed_{i}" for i, col in enumerate(consumption_headers)]
        
        # Map unnamed columns to meaningful names for consumption
        consumption_col_mapping = {
            'Unnamed_0': 'Date',
            'Unnamed_1': 'Product Name',
            'Unnamed_2': 'HSN Code',
            'Unnamed_3': 'UNITS',
            'Unnamed_4': 'Requisition Voucher No.',
            'Unnamed_5': 'Qty.',
            'Unnamed_6': 'Purchase Cost Per Unit Ex. GST',
            'Unnamed_7': 'Purchase GST %',
            'Unnamed_8': 'Taxable Value',
            'Unnamed_9': 'IGST',
            'Unnamed_10': 'CGST',
            'Unnamed_11': 'SGST',
            'Unnamed_12': 'Total Purchase Cost',
        }
        
        # Apply the column mapping
        mapped_consumption_headers = [consumption_col_mapping.get(col, col) for col in consumption_headers]
        
        # Extract consumption data
        consumption_data = df.iloc[consumption_data_start:consumption_data_end].copy()
        consumption_data.columns = consumption_headers
        # Rename columns using the mapping
        consumption_data = consumption_data.rename(columns=consumption_col_mapping)
        
        # Process Balance Stock if available
        balance_data = None
        if balance_header_row is not None:
            balance_cols_row = balance_header_row + 1
            balance_data_start = balance_header_row + 2
            
            balance_headers = df.iloc[balance_cols_row].to_list()
            balance_headers = [str(col) if pd.notna(col) else f"Unnamed_{i}" for i, col in enumerate(balance_headers)]
            
            # Map unnamed columns to meaningful names for balance
            balance_col_mapping = {
                'Unnamed_0': 'Product Name',
                'Unnamed_1': 'HSN Code',
                'Unnamed_2': 'UNITS',
                'Unnamed_3': 'Qty.',
                'Unnamed_4': 'Taxable Value',
                'Unnamed_5': 'IGST',
                'Unnamed_6': 'CGST',
                'Unnamed_7': 'SGST',
                'Unnamed_8': 'Invoice Value',
            }
            
            # Extract balance data
            balance_data = df.iloc[balance_data_start:].copy()
            if not balance_data.empty:
                balance_data.columns = balance_headers
                # Rename columns using the mapping
                balance_data = balance_data.rename(columns=balance_col_mapping)
        
        # Clean data by removing rows with no product name
        purchase_data = purchase_data[purchase_data['Product Name'].notna()]
        sales_data = sales_data[sales_data['Product Name'].notna()]
        consumption_data = consumption_data[consumption_data['Product Name'].notna()]
        if balance_data is not None:
            balance_data = balance_data[balance_data['Product Name'].notna()]
        
        # Create a response dictionary with all data sections
        response_data = {
            'purchases': purchase_data.where(pd.notna(purchase_data), None).to_dict(orient='records'),
            'sales': sales_data.where(pd.notna(sales_data), None).to_dict(orient='records'),
            'consumption': consumption_data.where(pd.notna(consumption_data), None).to_dict(orient='records')
        }
        
        if balance_data is not None:
            response_data['balance'] = balance_data.where(pd.notna(balance_data), None).to_dict(orient='records')
            
        # Extract unique products from all sections
        unique_products = set()
        
        # Add products from purchases
        for row in purchase_data.itertuples():
            if pd.notna(row._2):  # Product Name
                product_key = (str(row._2), str(row._3) if pd.notna(row._3) else '', str(row._4) if pd.notna(row._4) else '')
                unique_products.add(product_key)
        
        # Add products from sales
        for row in sales_data.itertuples():
            if pd.notna(row._2):  # Product Name
                product_key = (str(row._2), str(row._3) if pd.notna(row._3) else '', str(row._4) if pd.notna(row._4) else '')
                unique_products.add(product_key)
        
        # Add products from consumption
        for row in consumption_data.itertuples():
            if pd.notna(row._2):  # Product Name
                product_key = (str(row._2), str(row._3) if pd.notna(row._3) else '', str(row._4) if pd.notna(row._4) else '')
                unique_products.add(product_key)
        
        # Convert unique products to list of dictionaries
        products_list = []
        for product in unique_products:
            products_list.append({
                'product_name': product[0],
                'hsn_code': product[1],
                'units': product[2]
            })
        
        response_data['products'] = products_list
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory/export-excel', methods=['POST'])
def export_inventory_excel():
    """Generate an Excel file with inventory data in the same format as the original STOCK DETAILS file."""
    try:
        # Get data from request
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Check if required keys exist
        required_keys = ['products', 'purchases', 'sales', 'consumption', 'balance_stock']
        for key in required_keys:
            if key not in data:
                return jsonify({'error': f'Missing data section: {key}'}), 400
        
        # Create a pandas ExcelWriter object
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            temp_filename = tmp.name
            
        writer = pd.ExcelWriter(temp_filename, engine='openpyxl')
        
        # Create the main sheet
        sheet_name = 'STOCK DETAILS'
        
        # Convert data sections to DataFrames
        products_df = pd.DataFrame(data['products'])
        purchases_df = pd.DataFrame(data['purchases'])
        sales_df = pd.DataFrame(data['sales'])
        consumption_df = pd.DataFrame(data['consumption'])
        balance_df = pd.DataFrame(data['balance_stock'])
        
        # Create a new DataFrame for the Excel structure
        excel_data = []
        
        # Add title row
        excel_data.append(['STOCK DETAILS'])
        excel_data.append([])  # Empty row
        
        # Add purchase section
        excel_data.append(['PURCHASE - STOCK IN'])
        
        # Add purchase header
        purchase_header = [
            'Date', 'Product Name', 'HSN Code', 'UNITS', 'Invoice No.', 'Qty.',
            'Price Incl. GST', 'Price Ex. GST', 'Discount %', 'Purchase Cost Per Unit Ex. GST', 
            'GST %', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Invoice Value'
        ]
        excel_data.append(purchase_header)
        
        # Add purchase data
        for _, row in purchases_df.iterrows():
            excel_data.append([
                row.get('date', ''),
                row.get('product_name', ''),
                row.get('hsn_code', ''),
                row.get('units', ''),
                row.get('invoice_no', ''),
                row.get('qty', 0),
                row.get('price_incl_gst', 0),
                row.get('price_ex_gst', 0),
                row.get('discount_percentage', 0),
                row.get('purchase_cost_per_unit_ex_gst', 0),
                row.get('gst_percentage', 0),
                row.get('taxable_value', 0),
                row.get('igst', 0),
                row.get('cgst', 0),
                row.get('sgst', 0),
                row.get('invoice_value', 0)
            ])
        
        excel_data.append([])  # Empty row
        
        # Add sales section
        excel_data.append(['SALES TO CUSTOMER - STOCK OUT'])
        
        # Add sales header
        sales_header = [
            'Date', 'Product Name', 'HSN Code', 'UNITS', 'Invoice No.', 'Qty.',
            'Purchase Cost Per Unit Ex. GST', 'Purchase GST %', 'Purchase Taxable Value',
            'Purchase IGST', 'Purchase CGST', 'Purchase SGST', 'Total Purchase Cost',
            'MRP Incl. GST', 'MRP Ex. GST', 'Discount %', 'Discounted Sales Rate Ex. GST',
            'Sales GST %', 'Sales Taxable Value', 'Sales IGST', 'Sales CGST', 'Sales SGST',
            'Invoice Value'
        ]
        excel_data.append(sales_header)
        
        # Add sales data
        for _, row in sales_df.iterrows():
            excel_data.append([
                row.get('date', ''),
                row.get('product_name', ''),
                row.get('hsn_code', ''),
                row.get('units', ''),
                row.get('invoice_no', ''),
                row.get('qty', 0),
                row.get('purchase_cost_per_unit_ex_gst', 0),
                row.get('purchase_gst_percentage', 0),
                row.get('purchase_taxable_value', 0),
                row.get('purchase_igst', 0),
                row.get('purchase_cgst', 0),
                row.get('purchase_sgst', 0),
                row.get('total_purchase_cost', 0),
                row.get('mrp_incl_gst', 0),
                row.get('mrp_ex_gst', 0),
                row.get('discount_percentage', 0),
                row.get('discounted_sales_rate_ex_gst', 0),
                row.get('sales_gst_percentage', 0),
                row.get('sales_taxable_value', 0),
                row.get('sales_igst', 0),
                row.get('sales_cgst', 0),
                row.get('sales_sgst', 0),
                row.get('invoice_value', 0)
            ])
        
        excel_data.append([])  # Empty row
        
        # Add consumption section
        excel_data.append(['SALON CONSUMPTION - STOCK OUT'])
        
        # Add consumption header
        consumption_header = [
            'Date', 'Product Name', 'HSN Code', 'UNITS', 'Requisition Voucher No.', 'Qty.',
            'Purchase Cost Per Unit Ex. GST', 'Purchase GST %', 'Taxable Value',
            'IGST', 'CGST', 'SGST', 'Total Purchase Cost'
        ]
        excel_data.append(consumption_header)
        
        # Add consumption data
        for _, row in consumption_df.iterrows():
            excel_data.append([
                row.get('date', ''),
                row.get('product_name', ''),
                row.get('hsn_code', ''),
                row.get('units', ''),
                row.get('requisition_voucher_no', ''),
                row.get('qty', 0),
                row.get('purchase_cost_per_unit_ex_gst', 0),
                row.get('purchase_gst_percentage', 0),
                row.get('taxable_value', 0),
                row.get('igst', 0),
                row.get('cgst', 0),
                row.get('sgst', 0),
                row.get('total_purchase_cost', 0)
            ])
        
        excel_data.append([])  # Empty row
        
        # Add balance section
        excel_data.append(['BALANCE STOCK'])
        
        # Add balance header
        balance_header = [
            'Product Name', 'HSN Code', 'UNITS', 'Qty.', 'Taxable Value',
            'IGST', 'CGST', 'SGST', 'Invoice Value'
        ]
        excel_data.append(balance_header)
        
        # Add balance data
        for _, row in balance_df.iterrows():
            excel_data.append([
                row.get('product_name', ''),
                row.get('hsn_code', ''),
                row.get('units', ''),
                row.get('qty', 0),
                row.get('taxable_value', 0),
                row.get('igst', 0),
                row.get('cgst', 0),
                row.get('sgst', 0),
                row.get('invoice_value', 0)
            ])
        
        # Create a DataFrame from the excel_data list
        df = pd.DataFrame(excel_data)
        
        # Write to Excel
        df.to_excel(writer, sheet_name=sheet_name, index=False, header=False)
        
        # Save the Excel file
        writer.close()
        
        # Return the file
        return send_file(temp_filename, as_attachment=True, download_name='STOCK_DETAILS_export.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/inventory/sync-pos', methods=['POST'])
def sync_pos_with_inventory():
    """Sync POS sales data with inventory system."""
    try:
        # Get data from request
        data = request.json
        if not data or 'pos_sales' not in data:
            return jsonify({'error': 'No POS sales data provided'}), 400
            
        pos_sales = data['pos_sales']
        
        # Connect to database
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Could not connect to database'}), 500
            
        cursor = conn.cursor(dictionary=True)
        
        # Process each POS sale
        processed_sales = []
        errors = []
        
        for sale in pos_sales:
            try:
                # Check if this is a product (not a service)
                if sale.get('type') != 'product':
                    continue
                    
                # Get product details
                product_id = sale.get('product_id')
                if not product_id:
                    errors.append(f"Missing product_id for sale: {sale}")
                    continue
                    
                # Query to get product details
                cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
                product = cursor.fetchone()
                
                if not product:
                    errors.append(f"Product not found for id: {product_id}")
                    continue
                    
                # Query to get purchase cost information
                cursor.execute("""
                    SELECT 
                        AVG(ex_gst) as avg_cost_ex_gst,
                        AVG(igst / taxable_value) as avg_gst_percentage
                    FROM purchases 
                    WHERE product_id = %s
                """, (product_id,))
                purchase_info = cursor.fetchone()
                
                # Default values if no purchase info is found
                purchase_cost_per_unit_ex_gst = purchase_info['avg_cost_ex_gst'] if purchase_info and purchase_info['avg_cost_ex_gst'] else 0
                purchase_gst_percentage = purchase_info['avg_gst_percentage'] if purchase_info and purchase_info['avg_gst_percentage'] else 0.18
                
                # Calculate values for the sale
                qty = sale.get('quantity', 1)
                mrp_incl_gst = sale.get('price', 0)
                sales_gst_percentage = sale.get('gst_percentage', 0.18)
                
                # Calculate ex GST price (formula: price_incl_gst / (1 + gst_rate))
                mrp_ex_gst = mrp_incl_gst / (1 + sales_gst_percentage)
                
                # Calculate discounted values if discount is provided
                discount_percentage = sale.get('discount_percentage', 0)
                discounted_sales_rate_ex_gst = mrp_ex_gst * (1 - discount_percentage / 100)
                
                # Calculate taxable values
                purchase_taxable_value = purchase_cost_per_unit_ex_gst * qty
                sales_taxable_value = discounted_sales_rate_ex_gst * qty
                
                # Calculate GST values
                purchase_igst = purchase_taxable_value * purchase_gst_percentage
                sales_igst = sales_taxable_value * sales_gst_percentage
                
                # Split IGST into CGST and SGST (assuming equal split)
                purchase_cgst = purchase_igst / 2
                purchase_sgst = purchase_igst / 2
                sales_cgst = sales_igst / 2
                sales_sgst = sales_igst / 2
                
                # Calculate totals
                total_purchase_cost = purchase_taxable_value + purchase_igst
                invoice_value = sales_taxable_value + sales_igst
                
                # Create a sale record
                sale_id = str(uuid.uuid4())
                sale_date = sale.get('date', datetime.now().strftime('%Y-%m-%d'))
                invoice_no = sale.get('invoice_no', f"POS-{datetime.now().strftime('%Y%m%d%H%M%S')}")
                
                # Insert sale record
                cursor.execute("""
                    INSERT INTO sales (
                        id, product_id, date, invoice_no, qty, 
                        incl_gst, ex_gst, taxable_value, igst, cgst, sgst, 
                        invoice_value, customer, payment_method, 
                        transaction_type, converted_to_consumption, created_at,
                        purchase_cost_per_unit_ex_gst, purchase_gst_percentage,
                        purchase_taxable_value, purchase_igst, purchase_cgst,
                        purchase_sgst, total_purchase_cost, mrp_incl_gst,
                        mrp_ex_gst, discount_percentage, discounted_sales_rate_ex_gst,
                        sales_gst_percentage, sales_taxable_value, sales_igst,
                        sales_cgst, sales_sgst
                    ) VALUES (
                        %s, %s, %s, %s, %s, 
                        %s, %s, %s, %s, %s, %s, 
                        %s, %s, %s, 
                        %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                """, (
                    sale_id, product_id, sale_date, invoice_no, qty,
                    mrp_incl_gst, mrp_ex_gst, sales_taxable_value, sales_igst, sales_cgst, sales_sgst,
                    invoice_value, sale.get('customer_name', 'Walk-in'), sale.get('payment_method', 'cash'),
                    'sale', False, datetime.now(),
                    purchase_cost_per_unit_ex_gst, purchase_gst_percentage,
                    purchase_taxable_value, purchase_igst, purchase_cgst,
                    purchase_sgst, total_purchase_cost, mrp_incl_gst,
                    mrp_ex_gst, discount_percentage, discounted_sales_rate_ex_gst,
                    sales_gst_percentage, sales_taxable_value, sales_igst,
                    sales_cgst, sales_sgst
                ))
                
                # Update balance stock
                cursor.execute("""
                    SELECT * FROM balance_stock WHERE product_id = %s
                """, (product_id,))
                balance = cursor.fetchone()
                
                if balance:
                    # Update existing balance
                    new_qty = balance['qty'] - qty
                    new_taxable_value = balance['taxable_value'] - purchase_taxable_value
                    new_igst = balance['igst'] - purchase_igst
                    new_cgst = balance['cgst'] - purchase_cgst
                    new_sgst = balance['sgst'] - purchase_sgst
                    new_invoice_value = balance['invoice_value'] - total_purchase_cost
                    
                    cursor.execute("""
                        UPDATE balance_stock
                        SET qty = %s, taxable_value = %s, igst = %s, cgst = %s, sgst = %s, invoice_value = %s, updated_at = %s
                        WHERE id = %s
                    """, (
                        new_qty, new_taxable_value, new_igst, new_cgst, new_sgst, new_invoice_value, datetime.now(), balance['id']
                    ))
                else:
                    # Create new balance record
                    balance_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO balance_stock (id, product_id, qty, taxable_value, igst, cgst, sgst, invoice_value, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        balance_id, product_id, -qty, -purchase_taxable_value, -purchase_igst, -purchase_cgst, -purchase_sgst, -total_purchase_cost, datetime.now()
                    ))
                
                processed_sales.append({
                    'id': sale_id,
                    'product_id': product_id,
                    'qty': qty,
                    'invoice_value': invoice_value
                })
                
            except Exception as e:
                errors.append(str(e))
                continue
        
        # Commit changes
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'processed_sales': processed_sales,
            'errors': errors
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 