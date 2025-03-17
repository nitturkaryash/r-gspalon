-- Create product_collections table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES product_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Stored in paisa (1/100 of a rupee)
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  hsn_code TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_product_collections_name ON product_collections(name);

-- Enable Row Level Security (RLS)
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow full access to authenticated users" 
ON product_collections 
FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Allow full access to authenticated users" 
ON products 
FOR ALL 
TO authenticated 
USING (true);

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