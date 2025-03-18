import { db, Service, ServiceCollection, CollectionService } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const serviceService = {
  // Get all services
  getAll: async () => {
    return await db.services.toArray();
  },
  
  // Get service by ID
  getById: async (id: string) => {
    return await db.services.get(id);
  },
  
  // Create a new service
  create: async (service: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...service,
      id: uuidv4()
    };
    
    const id = await db.services.add(newService);
    return await db.services.get(id);
  },
  
  // Update an existing service
  update: async (id: string, updates: Partial<Service>) => {
    await db.services.update(id, updates);
    return await db.services.get(id);
  },
  
  // Delete a service
  delete: async (id: string) => {
    // You might want to check if there are related appointments first
    return await db.services.delete(id);
  },
  
  // Get all service collections
  getAllCollections: async () => {
    return await db.serviceCollections.toArray();
  },
  
  // Get collection by ID
  getCollectionById: async (id: string) => {
    return await db.serviceCollections.get(id);
  },
  
  // Create a new collection
  createCollection: async (collection: Omit<ServiceCollection, 'id'>) => {
    const newCollection: ServiceCollection = {
      ...collection,
      id: uuidv4()
    };
    
    const id = await db.serviceCollections.add(newCollection);
    return await db.serviceCollections.get(id);
  },
  
  // Update an existing collection
  updateCollection: async (id: string, updates: Partial<ServiceCollection>) => {
    await db.serviceCollections.update(id, updates);
    return await db.serviceCollections.get(id);
  },
  
  // Delete a collection
  deleteCollection: async (id: string) => {
    // First delete all service associations
    await db.collectionServices
      .where('collection_id')
      .equals(id)
      .delete();
      
    return await db.serviceCollections.delete(id);
  },
  
  // Get all services for a collection
  getServicesForCollection: async (collectionId: string) => {
    const collectionServices = await db.collectionServices
      .where('collection_id')
      .equals(collectionId)
      .toArray();
    
    const serviceIds = collectionServices.map(cs => cs.service_id);
    
    return await db.services
      .where('id')
      .anyOf(serviceIds)
      .toArray();
  },
  
  // Add a service to a collection
  addServiceToCollection: async (serviceId: string, collectionId: string) => {
    // Check if relationship already exists
    const existing = await db.collectionServices
      .where('service_id')
      .equals(serviceId)
      .and(item => item.collection_id === collectionId)
      .count();
    
    if (existing > 0) {
      return; // Relationship already exists
    }
    
    const collectionService: CollectionService = {
      id: uuidv4(),
      service_id: serviceId,
      collection_id: collectionId
    };
    
    return await db.collectionServices.add(collectionService);
  },
  
  // Remove a service from a collection
  removeServiceFromCollection: async (serviceId: string, collectionId: string) => {
    return await db.collectionServices
      .where('service_id')
      .equals(serviceId)
      .and(item => item.collection_id === collectionId)
      .delete();
  }
}; 