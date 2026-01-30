const { Device } = require('../models');

// Middleware to authenticate device token
const authenticateDevice = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }
    
    // Find device by token
    const device = await Device.findByToken(token);
    
    if (!device) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Attach device to request object
    req.device = device;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateDevice
};
