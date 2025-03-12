-- Create the database
CREATE DATABASE IF NOT EXISTS salon_inventory;
USE salon_inventory;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(50) NOT NULL,
    unit VARCHAR(20) DEFAULT '',
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY name_hsn_unique (name, hsn_code)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    qty DECIMAL(10, 2) NOT NULL DEFAULT 0,
    incl_gst DECIMAL(10, 2) DEFAULT 0,
    ex_gst DECIMAL(10, 2) DEFAULT 0,
    taxable_value DECIMAL(10, 2) DEFAULT 0,
    igst DECIMAL(10, 2) DEFAULT 0,
    cgst DECIMAL(10, 2) DEFAULT 0,
    sgst DECIMAL(10, 2) DEFAULT 0,
    invoice_value DECIMAL(10, 2) DEFAULT 0,
    supplier VARCHAR(255) DEFAULT '',
    transaction_type ENUM('purchase') DEFAULT 'purchase',
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    qty DECIMAL(10, 2) NOT NULL DEFAULT 0,
    incl_gst DECIMAL(10, 2) DEFAULT 0,
    ex_gst DECIMAL(10, 2) DEFAULT 0,
    taxable_value DECIMAL(10, 2) DEFAULT 0,
    igst DECIMAL(10, 2) DEFAULT 0,
    cgst DECIMAL(10, 2) DEFAULT 0,
    sgst DECIMAL(10, 2) DEFAULT 0,
    invoice_value DECIMAL(10, 2) DEFAULT 0,
    customer VARCHAR(255) DEFAULT '',
    payment_method ENUM('cash', 'card', 'online', 'other') DEFAULT 'cash',
    transaction_type ENUM('sale') DEFAULT 'sale',
    converted_to_consumption BOOLEAN DEFAULT FALSE,
    converted_at DATETIME DEFAULT NULL,
    consumption_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Consumption table
CREATE TABLE IF NOT EXISTS consumption (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    qty DECIMAL(10, 2) NOT NULL DEFAULT 0,
    purpose VARCHAR(255) DEFAULT '',
    transaction_type ENUM('consumption') DEFAULT 'consumption',
    original_sale_id VARCHAR(36) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Balance Stock table
CREATE TABLE IF NOT EXISTS balance_stock (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    qty DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY product_id_unique (product_id)
);

-- User roles table for authorization
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
    created_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create an index on the payment_method and converted_to_consumption columns for faster queries
CREATE INDEX idx_sales_payment_conversion ON sales(payment_method, converted_to_consumption);

-- Create an index on the transaction_type column for faster queries
CREATE INDEX idx_consumption_transaction ON consumption(transaction_type);

-- Add constraints to ensure referential integrity
ALTER TABLE sales
ADD CONSTRAINT fk_sales_consumption
FOREIGN KEY (consumption_id) REFERENCES consumption(id) ON DELETE SET NULL;

-- Create a view for easy retrieval of cash sales that haven't been converted
CREATE OR REPLACE VIEW cash_sales_for_conversion AS
SELECT 
    s.id, 
    s.date, 
    p.name AS product_name, 
    p.hsn_code, 
    p.unit, 
    s.qty, 
    s.invoice_no, 
    s.customer, 
    s.incl_gst, 
    s.igst, 
    s.cgst, 
    s.sgst,
    s.invoice_value
FROM 
    sales s
JOIN 
    products p ON s.product_id = p.id
WHERE 
    s.payment_method = 'cash' 
    AND (s.converted_to_consumption = 0 OR s.converted_to_consumption IS NULL)
ORDER BY 
    s.date DESC; 