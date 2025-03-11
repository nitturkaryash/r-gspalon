# Salon Stock Management System

This backend system enables salon managers to extract data from Excel-based stock records and manage product inventory efficiently. It also includes a feature to reclassify cash sales as salon consumption.

## Features

### 1. Stock Data Extraction

- Automatically processes Excel files containing stock details
- Handles complex multi-header structures 
- Processes four main sections: Purchases, Sales, Consumption, and Balance Stock
- Standardizes unit codes (e.g., BTL-BOTTLES → BTL)
- Fixes floating-point errors in numeric calculations

### 2. Cash-to-Consumption Conversion

- Allows reclassification of cash sales transactions as salon consumption
- Maintains inventory accuracy while providing tax optimization (where legally permitted)
- Tracks original transaction data for audit purposes
- Handles batch conversion of multiple transactions

## Database Schema

The system uses a MySQL database with the following structure:

- **Products**: Core product information (name, HSN code, unit)
- **Purchases**: Records of stock acquired by the salon
- **Sales**: Records of products sold to customers
- **Consumption**: Records of products used internally by the salon
- **Balance Stock**: Current inventory levels

## API Endpoints

### `/api/extract-stock` (POST)

Extracts data from uploaded Excel file and stores in the database.

**Request**: 
- Form data with `file` field containing the Excel spreadsheet

**Response**:
```json
{
  "success": true,
  "message": "Stock data extracted and stored successfully",
  "stats": {
    "products": 12,
    "purchases": 25,
    "sales": 40,
    "consumption": 18
  }
}
```

### `/api/cash-sales` (GET)

Retrieves all cash sales that haven't been converted to consumption.

**Response**:
```json
{
  "success": true,
  "cash_sales": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "date": "2023-05-15",
      "product_name": "Conditioning Shampoo",
      "hsn_code": "3305",
      "unit": "BTL",
      "qty": 2,
      "invoice_no": "INV-001",
      "customer": "John Doe",
      "incl_gst": 590,
      "igst": 0,
      "cgst": 45,
      "sgst": 45,
      "invoice_value": 590
    }
  ]
}
```

### `/api/convert-transaction` (POST)

Converts selected cash sales to salon consumption.

**Request**:
```json
{
  "transactionIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174001"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully converted 2 transactions",
  "convertedCount": 2
}
```

## Setup and Installation

### Prerequisites

- Python 3.7+
- MySQL 5.7+
- Flask, pandas, and other dependencies from requirements.txt

### Database Setup

1. Create a database named `salon_inventory`
2. Execute the `schema.sql` file to create the necessary tables

```bash
mysql -u username -p salon_inventory < schema.sql
```

### Environment Configuration

Create a `.env` file with the following variables:

```
DB_HOST=localhost
DB_NAME=salon_inventory
DB_USER=your_username
DB_PASSWORD=your_password
```

### Running the Backend

1. Install dependencies: `pip install -r requirements.txt`
2. Start the Flask server: `python app.py`
3. The server will run on http://localhost:5000 by default

## Security Considerations

- Implement proper authentication before deploying in production
- Validate all file uploads to prevent security vulnerabilities
- Add rate limiting to prevent abuse
- Ensure proper error handling to avoid exposing sensitive information

## Legal Note

The cash-to-consumption conversion feature assumes compliance with local tax laws. Converting sales to consumption to avoid tax should only be done if legally permitted in your jurisdiction. Consult with a tax professional before using this feature. 