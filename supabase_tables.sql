-- Create product_collections table
CREATE TABLE product_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
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
CREATE INDEX idx_products_collection_id ON products(collection_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_product_collections_name ON product_collections(name);

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
('Fragrances', 'Perfumes and body sprays');

-- Sample data for products (prices in paisa - multiply rupee value by 100)
INSERT INTO products (collection_id, name, description, price, stock_quantity, sku, hsn_code, active) VALUES
((SELECT id FROM product_collections WHERE name = 'Hair Care'), 'Shampoo - Premium', 'Luxury shampoo for all hair types', 89900, 25, 'HC-SH-001', 'HSN33051010', TRUE),
((SELECT id FROM product_collections WHERE name = 'Hair Care'), 'Conditioner - Premium', 'Luxury conditioner for all hair types', 79900, 20, 'HC-CN-001', 'HSN33051020', TRUE),
((SELECT id FROM product_collections WHERE name = 'Hair Care'), 'Hair Serum', 'Anti-frizz hair serum', 59900, 15, 'HC-SR-001', 'HSN33059011', TRUE),

((SELECT id FROM product_collections WHERE name = 'Skin Care'), 'Face Wash', 'Gentle face wash for all skin types', 49900, 30, 'SC-FW-001', 'HSN33049990', TRUE),
((SELECT id FROM product_collections WHERE name = 'Skin Care'), 'Moisturizer', 'Hydrating face moisturizer', 69900, 25, 'SC-MO-001', 'HSN33049910', TRUE),
((SELECT id FROM product_collections WHERE name = 'Skin Care'), 'Face Mask', 'Rejuvenating face mask', 39900, 20, 'SC-FM-001', 'HSN33049930', TRUE),

((SELECT id FROM product_collections WHERE name = 'Makeup'), 'Foundation', 'Long-lasting foundation', 99900, 15, 'MU-FN-001', 'HSN33049120', TRUE),
((SELECT id FROM product_collections WHERE name = 'Makeup'), 'Lipstick', 'Matte finish lipstick', 59900, 25, 'MU-LS-001', 'HSN33041000', TRUE),
((SELECT id FROM product_collections WHERE name = 'Makeup'), 'Mascara', 'Volumizing mascara', 69900, 20, 'MU-MS-001', 'HSN33042000', TRUE),

((SELECT id FROM product_collections WHERE name = 'Nail Care'), 'Nail Polish', 'Long-lasting nail polish', 39900, 30, 'NC-NP-001', 'HSN33043000', TRUE),
((SELECT id FROM product_collections WHERE name = 'Nail Care'), 'Nail Remover', 'Acetone-free nail polish remover', 29900, 25, 'NC-NR-001', 'HSN33049950', TRUE),
((SELECT id FROM product_collections WHERE name = 'Nail Care'), 'Cuticle Oil', 'Nourishing cuticle oil', 34900, 20, 'NC-CO-001', 'HSN33049960', TRUE),

((SELECT id FROM product_collections WHERE name = 'Fragrances'), 'Perfume - Women', 'Luxury perfume for women', 199900, 10, 'FR-PW-001', 'HSN33030020', TRUE),
((SELECT id FROM product_collections WHERE name = 'Fragrances'), 'Perfume - Men', 'Luxury perfume for men', 189900, 10, 'FR-PM-001', 'HSN33030010', TRUE),
((SELECT id FROM product_collections WHERE name = 'Fragrances'), 'Body Mist', 'Refreshing body mist', 79900, 15, 'FR-BM-001', 'HSN33030030', TRUE); 