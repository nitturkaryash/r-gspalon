-- Sample data for product_collections
INSERT INTO product_collections (name, description) VALUES
('Hair Care', 'Products for hair care and styling'),
('Skin Care', 'Products for skin care and treatment'),
('Makeup', 'Makeup products and accessories'),
('Nail Care', 'Products for nail care and treatment'),
('Fragrances', 'Perfumes and body sprays')
ON CONFLICT (id) DO NOTHING;

-- Sample data for products (prices in paisa - multiply rupee value by 100)
INSERT INTO products (collection_id, name, description, price, stock_quantity, sku, hsn_code, active) 
SELECT 
  id as collection_id, 
  'Shampoo - Premium', 
  'Luxury shampoo for all hair types', 
  89900, 
  25, 
  'HC-SH-001', 
  'HSN33051010', 
  TRUE
FROM product_collections 
WHERE name = 'Hair Care'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (collection_id, name, description, price, stock_quantity, sku, hsn_code, active) 
SELECT 
  id as collection_id, 
  'Conditioner - Premium', 
  'Luxury conditioner for all hair types', 
  79900, 
  20, 
  'HC-CN-001', 
  'HSN33051020', 
  TRUE
FROM product_collections 
WHERE name = 'Hair Care'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (collection_id, name, description, price, stock_quantity, sku, hsn_code, active) 
SELECT 
  id as collection_id, 
  'Face Wash', 
  'Gentle face wash for all skin types', 
  49900, 
  30, 
  'SC-FW-001', 
  'HSN33049990', 
  TRUE
FROM product_collections 
WHERE name = 'Skin Care'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (collection_id, name, description, price, stock_quantity, sku, hsn_code, active) 
SELECT 
  id as collection_id, 
  'Moisturizer', 
  'Hydrating face moisturizer', 
  69900, 
  25, 
  'SC-MO-001', 
  'HSN33049910', 
  TRUE
FROM product_collections 
WHERE name = 'Skin Care'
LIMIT 1
ON CONFLICT (id) DO NOTHING; 