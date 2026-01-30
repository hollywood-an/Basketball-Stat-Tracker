const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const gamesRoutes = require('./games');

router.use('/auth', authRoutes);
router.use('/games', gamesRoutes);

module.exports = router;
