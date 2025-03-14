# R&G Salon Inventory Management System Setup

This document provides instructions for setting up the inventory management system for R&G Salon.

## Overview

The inventory management system consists of three main components:
1. **Purchases** - Manual input of purchase data
2. **Sales to Customers** - Auto-populated from POS system
3. **Salon Consumption** - Auto-populated from POS system

## Setup Instructions

### Option 1: Using the Setup Utility (Recommended)

1. Start the application and navigate to the "Inventory Setup" page from the sidebar menu
2. Click the "Set Up Inventory Tables" button
3. Wait for the setup process to complete
4. Once the tables are created, you can start using the inventory system

### Option 2: Manual Setup

If the automatic setup doesn't work, you can manually run the SQL script in the Supabase SQL Editor:

1. Log in to your Supabase dashboard at [https://app.supabase.io](https://app.supabase.io)
2. Select your project and go to the SQL Editor
3. Copy the SQL script from `src/utils/supabase/inventory_tables.sql` and paste it into the SQL Editor
4. Click "Run" to execute the script

## Troubleshooting

If you encounter errors like "relation does not exist", it means the database tables haven't been created yet. Follow the setup instructions above to create the required tables.

Common errors:
- `relation "public.inventory_purchases" does not exist`
- `relation "public.inventory_sales" does not exist`
- `relation "public.inventory_consumption" does not exist`
- `relation "public.inventory_balance_stock" does not exist`

## Database Schema

The inventory system uses the following tables:

### inventory_purchases
- Manual input of purchase data
- Fields include: product_name, hsn_code, units, purchase_invoice_number, purchase_qty, etc.

### inventory_sales
- Auto-populated from POS system
- Fields include: product_name, hsn_code, units, invoice_no, sales_qty, etc.

### inventory_consumption
- Auto-populated from POS system
- Fields include: product_name, hsn_code, units, requisition_voucher_no, consumption_qty, etc.

### inventory_balance_stock (View)
- Calculated view that shows the current balance stock
- Aggregates data from purchases, sales, and consumption tables

## Using the Inventory System

After setting up the tables, you can use the inventory system to:
1. Add purchase records manually
2. Sync sales data from your POS
3. Track salon consumption
4. Export consolidated inventory data to CSV

## Support

If you encounter any issues, please contact the development team for assistance.