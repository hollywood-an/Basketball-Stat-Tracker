const express = require('express');
const router = express.Router();
const { Game } = require('../models');
const { authenticateDevice } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateDevice);

// GET /api/games - Get all games for the authenticated device
router.get('/', async (req, res) => {
  try {
    const games = await Game.findAllByDevice(req.device.id);
    res.json(games);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// POST /api/games - Create a new game
router.post('/', async (req, res) => {
  try {
    const { date, team1, team2 } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    if (!team1 || !team2) {
      return res.status(400).json({ error: 'Both teams are required' });
    }
    
    const game = await Game.create(req.device.id, {
      date,
      team1,
      team2
    });
    
    res.status(201).json(game);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// DELETE /api/games/:id - Delete a game
router.delete('/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    
    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }
    
    const deleted = await Game.delete(gameId, req.device.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
