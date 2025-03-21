import { v4 as uuidv4 } from 'uuid';

// Initialize with sample data for development mode
export const initLocalStorageData = () => {
  console.log('Initializing localStorage data for development mode...');

  // Sample Stylists
  const stylists = [
    {
      id: uuidv4(),
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      specialties: 'Haircuts, Styling',
      schedule: 'Mon-Fri, 9am-5pm',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '555-765-4321',
      specialties: 'Coloring, Perms',
      schedule: 'Tue-Sat, 10am-6pm',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      phone: '555-987-6543',
      specialties: 'Beard Trim, Shaving',
      schedule: 'Wed-Sun, 11am-7pm',
      created_at: new Date().toISOString()
    }
  ];

  // Sample Services
  const services = [
    {
      id: uuidv4(),
      name: "Men's Haircut",
      description: "Classic men's haircut with styling",
      duration: 30,
      price: 2500,
      category: "Haircuts",
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Women's Haircut",
      description: "Women's haircut with blow dry and styling",
      duration: 45,
      price: 4000,
      category: "Haircuts",
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Hair Coloring",
      description: "Full hair coloring service",
      duration: 90,
      price: 7500,
      category: "Coloring",
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Beard Trim",
      description: "Professional beard trim and shaping",
      duration: 20,
      price: 1500,
      category: "Grooming",
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Hair Treatment",
      description: "Deep conditioning hair treatment",
      duration: 45,
      price: 3500,
      category: "Treatments",
      active: true,
      created_at: new Date().toISOString()
    }
  ];

  // Sample Products
  const products = [
    {
      id: uuidv4(),
      name: "Shampoo",
      description: "Premium salon shampoo",
      price: 1200,
      category: "Hair Care",
      stock: 25,
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Conditioner",
      description: "Premium salon conditioner",
      price: 1200,
      category: "Hair Care",
      stock: 25,
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Styling Gel",
      description: "Medium hold styling gel",
      price: 800,
      category: "Styling Products",
      stock: 15,
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Hair Spray",
      description: "Strong hold hair spray",
      price: 950,
      category: "Styling Products",
      stock: 20,
      active: true,
      created_at: new Date().toISOString()
    }
  ];

  // Sample Inventory Purchases
  const purchases = [
    {
      id: uuidv4(),
      date: new Date().toISOString(),
      product_name: "Salon Shampoo - 500ml",
      hsn_code: "HSN1001",
      units: "bottles",
      purchase_invoice_number: "INV-001",
      purchase_qty: 10,
      mrp_incl_gst: 450,
      discount_on_purchase_percentage: 5,
      gst_percentage: 18,
      mrp_excl_gst: 381.36,
      purchase_taxable_value: 3622.88,
      purchase_igst: 0,
      purchase_cgst: 326.06,
      purchase_sgst: 326.06,
      purchase_invoice_value_rs: 4275
    },
    {
      id: uuidv4(),
      date: new Date().toISOString(),
      product_name: "Hair Conditioner - 400ml",
      hsn_code: "HSN1002",
      units: "bottles",
      purchase_invoice_number: "INV-002",
      purchase_qty: 8,
      mrp_incl_gst: 400,
      discount_on_purchase_percentage: 5,
      gst_percentage: 18,
      mrp_excl_gst: 338.98,
      purchase_taxable_value: 2576.27,
      purchase_igst: 0,
      purchase_cgst: 231.86,
      purchase_sgst: 231.86,
      purchase_invoice_value_rs: 3040
    },
    {
      id: uuidv4(),
      date: new Date().toISOString(),
      product_name: "Hair Styling Wax - 100g",
      hsn_code: "HSN1003",
      units: "jars",
      purchase_invoice_number: "INV-003",
      purchase_qty: 15,
      mrp_incl_gst: 350,
      discount_on_purchase_percentage: 10,
      gst_percentage: 18,
      mrp_excl_gst: 296.61,
      purchase_taxable_value: 4003.22,
      purchase_igst: 0,
      purchase_cgst: 360.29,
      purchase_sgst: 360.29,
      purchase_invoice_value_rs: 4723.80
    }
  ];

  // Sample Clients
  const clients = [
    {
      id: uuidv4(),
      full_name: "Alice Johnson",
      email: "alice.johnson@example.com",
      phone: "555-111-2222",
      address: "123 Main St",
      notes: "Prefers appointments in the afternoon",
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      full_name: "Bob Smith",
      email: "bob.smith@example.com",
      phone: "555-333-4444",
      address: "456 Oak Ave",
      notes: "Allergic to certain hair products",
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      full_name: "Carol Davis",
      email: "carol.davis@example.com",
      phone: "555-555-6666",
      address: "789 Pine St",
      notes: "Regular customer, comes in monthly",
      created_at: new Date().toISOString()
    }
  ];

  // Store data in localStorage
  localStorage.setItem('local_stylists', JSON.stringify(stylists));
  localStorage.setItem('local_services', JSON.stringify(services));
  localStorage.setItem('local_products', JSON.stringify(products));
  localStorage.setItem('local_purchases', JSON.stringify(purchases));
  localStorage.setItem('local_clients', JSON.stringify(clients));
  localStorage.setItem('products', JSON.stringify(products)); // For the older format expected by POS

  console.log('Sample data initialized in localStorage.');
  return {
    stylists,
    services,
    products,
    purchases,
    clients
  };
};

export default initLocalStorageData; 