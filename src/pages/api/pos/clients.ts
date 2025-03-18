// Mock POS API endpoint for client synchronization
import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  // Only handle POST requests for client creation/update
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientData = req.body;
    
    // This would normally connect to your POS system
    // For now, simulate a successful client creation/update
    
    // Validate required fields
    if (!clientData.name) {
      return res.status(400).json({ error: 'Client name is required' });
    }
    
    // Mock delay to simulate network request (200-800ms)
    setTimeout(() => {
      // Generate a POS ID if none exists
      const pos_id = clientData.pos_id || `POS_${uuidv4().substring(0, 8)}`;
      
      // Return success response with POS ID
      res.status(200).json({
        success: true,
        pos_id,
        message: 'Client synchronized with POS system',
        // Include any additional data your POS might return
        sync_timestamp: new Date().toISOString()
      });
    }, Math.random() * 600 + 200);
    
  } catch (error) {
    console.error('POS sync error:', error);
    res.status(500).json({ error: 'Failed to sync with POS system' });
  }
} 