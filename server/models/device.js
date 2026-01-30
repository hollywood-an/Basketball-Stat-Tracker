const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Device = {
  // Create a new device and return its token
  async create() {
    const token = uuidv4();
    const result = await db.query(
      'INSERT INTO devices (device_token) VALUES ($1) RETURNING id, device_token, created_at',
      [token]
    );
    return result.rows[0];
  },

  // Find device by token
  async findByToken(token) {
    const result = await db.query(
      'SELECT id, device_token, created_at FROM devices WHERE device_token = $1',
      [token]
    );
    return result.rows[0] || null;
  },

  // Find device by ID
  async findById(id) {
    const result = await db.query(
      'SELECT id, device_token, created_at FROM devices WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
};

module.exports = Device;
