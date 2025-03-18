import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Define the interfaces for our tables
export interface Appointment {
  id?: string;
  stylist_id: string;
  service_id: string;
  client_id?: string;
  client_name: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  mobile_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Stylist {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  breaks?: StylistBreak[];
  working_hours?: {
    start: string;
    end: string;
    days: number[];
  };
  avatar_url?: string;
}

export interface StylistBreak {
  id: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface Service {
  id?: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  image_url?: string;
}

export interface ServiceCollection {
  id?: string;
  name: string;
  description?: string;
}

export interface CollectionService {
  id?: string;
  collection_id: string;
  service_id: string;
}

export interface Client {
  id: string;
  name: string;
  mobile_number?: string;
  email?: string;
  pos_id?: string;
  sync_failed?: boolean;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

// Extend Dexie with our tables
class AppDatabase extends Dexie {
  appointments!: Dexie.Table<Appointment, string>;
  stylists!: Dexie.Table<Stylist, string>;
  services!: Dexie.Table<Service, string>;
  serviceCollections!: Dexie.Table<ServiceCollection, string>;
  collectionServices!: Dexie.Table<CollectionService, string>;
  clients!: Dexie.Table<Client, string>;

  constructor() {
    super('SalonDatabase');
    
    // Define tables with more explicit schema
    this.version(1).stores({
      appointments: '++id, stylist_id, service_id, client_id, status, start_time, end_time',
      stylists: '++id, name, email',
      services: '++id, name, price, duration',
      serviceCollections: '++id, name',
      collectionServices: '++id, collection_id, service_id',
      clients: 'id, name, mobile_number, email, pos_id, sync_failed'
    });
    
    // Map tables to class properties
    this.appointments = this.table('appointments');
    this.stylists = this.table('stylists');
    this.services = this.table('services');
    this.serviceCollections = this.table('serviceCollections');
    this.collectionServices = this.table('collectionServices');
    this.clients = this.table('clients');
  }
}

// Initialize database
export const db = new AppDatabase();

// Helper function to add IDs if not provided
function addIdsToItems<T extends { id?: string }>(items: T[]): T[] {
  return items.map(item => ({
    ...item,
    id: item.id || uuidv4()
  }));
}

// Function to seed initial data
export async function seedDatabase() {
  try {
    const appointmentsCount = await db.appointments.count();
    const stylistsCount = await db.stylists.count();
    const servicesCount = await db.services.count();
    const collectionsCount = await db.serviceCollections.count();
    
    // Only seed if tables are empty
    if (stylistsCount === 0) {
      console.log('Seeding stylists...');
      // Prepare stylists with explicit IDs
      const stylists = addIdsToItems([
        {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '555-123-4567',
          specialties: ['Haircut', 'Coloring'],
          breaks: [],
          working_hours: {
            start: '09:00',
            end: '17:00',
            days: [1, 2, 3, 4, 5]
          },
          avatar_url: 'https://randomuser.me/api/portraits/women/32.jpg'
        },
        {
          name: 'Michael Chen',
          email: 'michael@example.com',
          phone: '555-987-6543',
          specialties: ['Styling', 'Treatment'],
          breaks: [],
          working_hours: {
            start: '10:00',
            end: '18:00',
            days: [1, 2, 3, 4, 5, 6]
          },
          avatar_url: 'https://randomuser.me/api/portraits/men/44.jpg'
        },
        {
          name: 'Emily Rodriguez',
          email: 'emily@example.com',
          phone: '555-456-7890',
          specialties: ['Coloring', 'Extensions'],
          breaks: [],
          working_hours: {
            start: '08:00',
            end: '16:00',
            days: [2, 3, 4, 5, 6]
          },
          avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg'
        }
      ]);
      
      // Add each stylist individually with error handling
      for (const stylist of stylists) {
        try {
          await db.stylists.add(stylist);
        } catch (e) {
          console.error(`Error adding stylist ${stylist.name}:`, e);
        }
      }
      console.log('Stylists seeded successfully');
    }
    
    if (servicesCount === 0) {
      console.log('Seeding services...');
      // Prepare services with explicit IDs
      const services = addIdsToItems([
        {
          name: 'Women\'s Haircut',
          description: 'Professional haircut for women including wash and blow dry',
          price: 60,
          duration: 60,
          image_url: '/images/services/womens-haircut.jpg'
        },
        {
          name: 'Men\'s Haircut',
          description: 'Professional haircut for men including wash',
          price: 40,
          duration: 30,
          image_url: '/images/services/mens-haircut.jpg'
        },
        {
          name: 'Hair Coloring',
          description: 'Full hair coloring service with premium products',
          price: 120,
          duration: 120,
          image_url: '/images/services/hair-coloring.jpg'
        },
        {
          name: 'Highlights',
          description: 'Partial or full highlights to enhance your natural color',
          price: 150,
          duration: 150,
          image_url: '/images/services/highlights.jpg'
        },
        {
          name: 'Styling',
          description: 'Professional styling for special occasions',
          price: 55,
          duration: 45,
          image_url: '/images/services/styling.jpg'
        },
        {
          name: 'Treatment',
          description: 'Deep conditioning treatment for damaged hair',
          price: 70,
          duration: 60,
          image_url: '/images/services/treatment.jpg'
        }
      ]);
      
      // Add each service individually with error handling
      for (const service of services) {
        try {
          await db.services.add(service);
        } catch (e) {
          console.error(`Error adding service ${service.name}:`, e);
        }
      }
      console.log('Services seeded successfully');
    }
    
    if (collectionsCount === 0) {
      console.log('Seeding service collections...');
      // Prepare collections with explicit IDs
      const collections = addIdsToItems([
        {
          name: 'Haircuts',
          description: 'Professional haircut services'
        },
        {
          name: 'Color Services',
          description: 'All coloring and highlighting services'
        },
        {
          name: 'Treatments',
          description: 'Hair treatments and therapies'
        }
      ]);
      
      // Add each collection individually with error handling
      for (const collection of collections) {
        try {
          await db.serviceCollections.add(collection);
        } catch (e) {
          console.error(`Error adding collection ${collection.name}:`, e);
        }
      }
      
      // Get actual collections and services
      const savedCollections = await db.serviceCollections.toArray();
      const savedServices = await db.services.toArray();
      
      if (savedCollections.length > 0 && savedServices.length > 0) {
        // Map services to collections
        const haircutsCollection = savedCollections.find(c => c.name === 'Haircuts');
        const colorCollection = savedCollections.find(c => c.name === 'Color Services');
        const treatmentsCollection = savedCollections.find(c => c.name === 'Treatments');
        
        // Add collection-service mappings
        if (haircutsCollection && colorCollection && treatmentsCollection) {
          const collectionServices = addIdsToItems([
            {
              collection_id: haircutsCollection.id!,
              service_id: savedServices.find(s => s.name === 'Women\'s Haircut')?.id || ''
            },
            {
              collection_id: haircutsCollection.id!,
              service_id: savedServices.find(s => s.name === 'Men\'s Haircut')?.id || ''
            },
            {
              collection_id: colorCollection.id!,
              service_id: savedServices.find(s => s.name === 'Hair Coloring')?.id || ''
            },
            {
              collection_id: colorCollection.id!,
              service_id: savedServices.find(s => s.name === 'Highlights')?.id || ''
            },
            {
              collection_id: treatmentsCollection.id!,
              service_id: savedServices.find(s => s.name === 'Treatment')?.id || ''
            }
          ]).filter(item => item.service_id !== ''); // Filter out any mappings with missing service IDs
          
          // Add mappings individually with error handling
          for (const mapping of collectionServices) {
            try {
              await db.collectionServices.add(mapping);
            } catch (e) {
              console.error(`Error adding collection-service mapping:`, e);
            }
          }
        }
      }
      console.log('Service collections seeded successfully');
    }
    
    if (appointmentsCount === 0) {
      console.log('Seeding appointments...');
      // Get the first stylist and service
      const stylist = await db.stylists.toCollection().first();
      const service = await db.services.toCollection().first();
      
      if (stylist && service) {
        // Create sample appointments
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const appointments = addIdsToItems([
          {
            stylist_id: stylist.id!,
            service_id: service.id!,
            client_name: 'John Doe',
            start_time: new Date(new Date(today).setHours(10, 0, 0, 0)).toISOString(),
            end_time: new Date(new Date(today).setHours(11, 0, 0, 0)).toISOString(),
            status: 'scheduled' as const,
            notes: 'First-time client',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            stylist_id: stylist.id!,
            service_id: service.id!,
            client_name: 'Jane Smith',
            start_time: new Date(new Date(today).setHours(14, 0, 0, 0)).toISOString(),
            end_time: new Date(new Date(today).setHours(15, 0, 0, 0)).toISOString(),
            status: 'scheduled' as const,
            mobile_number: '555-555-5555',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            stylist_id: stylist.id!,
            service_id: service.id!,
            client_name: 'Alice Johnson',
            start_time: new Date(new Date(tomorrow).setHours(11, 30, 0, 0)).toISOString(),
            end_time: new Date(new Date(tomorrow).setHours(12, 30, 0, 0)).toISOString(),
            status: 'scheduled' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
        // Add appointments individually with error handling
        for (const appointment of appointments) {
          try {
            await db.appointments.add(appointment);
          } catch (e) {
            console.error(`Error adding appointment for ${appointment.client_name}:`, e);
          }
        }
      }
      console.log('Appointments seeded successfully');
    }
  } catch (error) {
    console.error('Error in seedDatabase:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Export a function to initialize the database
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      throw new Error('Your browser doesn\'t support IndexedDB. The application may not work correctly.');
    }

    // Try to delete any existing database first for a fresh start
    try {
      await Dexie.delete('SalonDatabase');
      console.log('Existing database deleted for fresh initialization');
    } catch (deleteError) {
      console.warn('No existing database to delete or could not delete:', deleteError);
    }

    // Open database connection
    await db.open();
    console.log('Database opened successfully');

    // Seed database
    await seedDatabase();
    console.log('Database initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Manual reset attempt
    try {
      console.log('Attempting to delete and reset database...');
      await Dexie.delete('SalonDatabase');
      
      // Create a new instance 
      const newDb = new AppDatabase();
      await newDb.open();
      console.log('Database reset successful');
      
      // Reassign the global db variable
      (window as any).db = newDb;
      
      return true;
    } catch (resetError) {
      console.error('Failed to reset database:', resetError);
      throw error;
    }
  }
} 