const express = require('express');
const router = express.Router();
const { Device } = require('../models');

// POST /api/auth/device - Register a new device and get token
router.post('/device', async (req, res) => {
  try {
    const device = await Device.create();
    res.status(201).json({
      token: device.device_token,
      deviceId: device.id
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

module.exports = router;
