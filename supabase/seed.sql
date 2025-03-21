-- Sample Data for Salon Management System

-- Insert sample stylists
INSERT INTO stylists (name, email, phone) VALUES
('Aisha Khan', 'aisha@example.com', '9876543210'),
('Rahul Sharma', 'rahul@example.com', '9876543211'),
('Priya Patel', 'priya@example.com', '9876543212');

-- Insert sample services
INSERT INTO services (name, description, price, duration, category, type) VALUES
('Haircut', 'Professional haircut with styling', 600, 45, 'Hair', 'Basic'),
('Hair Color', 'Full hair coloring service', 1800, 120, 'Hair', 'Premium'),
('Manicure', 'Basic nail care for hands', 500, 30, 'Nails', 'Basic'),
('Facial', 'Deep cleansing facial', 1200, 60, 'Skin', 'Premium'),
('Hair Spa', 'Conditioning treatment for hair', 1500, 75, 'Hair', 'Premium');

-- Insert sample clients
INSERT INTO clients (full_name, phone, email) VALUES
('Neha Singh', '9898989898', 'neha@example.com'),
('Vikram Malik', '8787878787', 'vikram@example.com'),
('Anjali Gupta', '7676767676', 'anjali@example.com');

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category) VALUES
('Shampoo', 'Professional hair shampoo', 450, 20, 'Hair Care'),
('Conditioner', 'Hair conditioner for all hair types', 400, 15, 'Hair Care'),
('Nail Polish', 'Long-lasting nail polish', 250, 30, 'Nail Care'),
('Face Mask', 'Hydrating face mask', 350, 10, 'Skin Care');

-- Insert sample inventory purchases
INSERT INTO inventory_purchases (product_name, hsn_code, units, purchase_qty, mrp_incl_gst, mrp_excl_gst, gst_percentage, purchase_taxable_value, purchase_cgst, purchase_sgst, purchase_invoice_value_rs) VALUES
('Shampoo', 'HSN3304', 'bottle', 10, 550, 466, 18, 4660, 419.4, 419.4, 5498.8),
('Conditioner', 'HSN3305', 'bottle', 8, 480, 407, 18, 3256, 293.04, 293.04, 3842.08),
('Face Mask', 'HSN3304', 'unit', 5, 400, 339, 18, 1695, 152.55, 152.55, 2000.1);

-- Insert sample admin user
INSERT INTO admin_users (email, password, is_active) VALUES
('admin@salon.com', 'password123', TRUE);

-- Insert sample product collection
INSERT INTO product_collections (name, description) VALUES
('Hair Care Essentials', 'Essential products for hair care'),
('Skin Care Collection', 'Products for skin care routine');

-- Insert sample appointments
INSERT INTO appointments (client_id, stylist_id, service_id, start_time, end_time, status) VALUES
((SELECT id FROM clients WHERE full_name = 'Neha Singh'), (SELECT id FROM stylists WHERE name = 'Aisha Khan'), (SELECT id FROM services WHERE name = 'Haircut'), '2025-03-20 10:00:00', '2025-03-20 10:45:00', 'confirmed'),
((SELECT id FROM clients WHERE full_name = 'Vikram Malik'), (SELECT id FROM stylists WHERE name = 'Rahul Sharma'), (SELECT id FROM services WHERE name = 'Hair Color'), '2025-03-20 11:00:00', '2025-03-20 13:00:00', 'confirmed'),
((SELECT id FROM clients WHERE full_name = 'Anjali Gupta'), (SELECT id FROM stylists WHERE name = 'Priya Patel'), (SELECT id FROM services WHERE name = 'Facial'), '2025-03-21 14:00:00', '2025-03-21 15:00:00', 'confirmed');

-- Insert sample transactions
INSERT INTO transactions (client_id, stylist_id, appointment_id, total, subtotal, tax, payment_method, payment_status, items) VALUES
((SELECT id FROM clients WHERE full_name = 'Neha Singh'), 
 (SELECT id FROM stylists WHERE name = 'Aisha Khan'), 
 (SELECT id FROM appointments WHERE client_id = (SELECT id FROM clients WHERE full_name = 'Neha Singh')), 
 600, 508.47, 91.53, 'cash', 'completed', 
 '[{"service_id": "' || (SELECT id FROM services WHERE name = 'Haircut') || '", "name": "Haircut", "price": 600}]');
