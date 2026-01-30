const db = require('../config/db');

const Game = {
  // Create a new game with teams and players
  async create(deviceId, gameData) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert game
      const gameResult = await client.query(
        'INSERT INTO games (device_id, date) VALUES ($1, $2) RETURNING id, date, created_at',
        [deviceId, gameData.date]
      );
      const game = gameResult.rows[0];
      
      // Insert team 1
      const team1Result = await client.query(
        'INSERT INTO teams (game_id, name, team_number, bonus_points) VALUES ($1, $2, $3, $4) RETURNING id',
        [game.id, gameData.team1.name || '', 1, gameData.team1.bonusPoints || 0]
      );
      const team1Id = team1Result.rows[0].id;
      
      // Insert team 1 players
      for (const player of gameData.team1.players || []) {
        await client.query(
          'INSERT INTO players (team_id, name, number, points, fouls) VALUES ($1, $2, $3, $4, $5)',
          [team1Id, player.name, player.number, player.points || 0, player.fouls || 0]
        );
      }
      
      // Insert team 2
      const team2Result = await client.query(
        'INSERT INTO teams (game_id, name, team_number, bonus_points) VALUES ($1, $2, $3, $4) RETURNING id',
        [game.id, gameData.team2.name || '', 2, gameData.team2.bonusPoints || 0]
      );
      const team2Id = team2Result.rows[0].id;
      
      // Insert team 2 players
      for (const player of gameData.team2.players || []) {
        await client.query(
          'INSERT INTO players (team_id, name, number, points, fouls) VALUES ($1, $2, $3, $4, $5)',
          [team2Id, player.name, player.number, player.points || 0, player.fouls || 0]
        );
      }
      
      await client.query('COMMIT');
      
      // Return the full game data
      return await this.findById(game.id, deviceId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all games for a device
  async findAllByDevice(deviceId) {
    // Get all games for the device
    const gamesResult = await db.query(
      'SELECT id, date, created_at FROM games WHERE device_id = $1 ORDER BY created_at DESC',
      [deviceId]
    );
    
    const games = [];
    
    for (const game of gamesResult.rows) {
      const fullGame = await this.findById(game.id, deviceId);
      if (fullGame) {
        games.push(fullGame);
      }
    }
    
    return games;
  },

  // Get a single game by ID (with teams and players)
  async findById(gameId, deviceId) {
    // Get game
    const gameResult = await db.query(
      'SELECT id, date, created_at FROM games WHERE id = $1 AND device_id = $2',
      [gameId, deviceId]
    );
    
    if (gameResult.rows.length === 0) {
      return null;
    }
    
    const game = gameResult.rows[0];
    
    // Get teams
    const teamsResult = await db.query(
      'SELECT id, name, team_number, bonus_points FROM teams WHERE game_id = $1 ORDER BY team_number',
      [game.id]
    );
    
    const team1Data = teamsResult.rows.find(t => t.team_number === 1);
    const team2Data = teamsResult.rows.find(t => t.team_number === 2);
    
    // Get players for each team
    const getPlayers = async (teamId) => {
      if (!teamId) return [];
      const playersResult = await db.query(
        'SELECT id, name, number, points, fouls FROM players WHERE team_id = $1',
        [teamId]
      );
      return playersResult.rows;
    };
    
    const team1Players = team1Data ? await getPlayers(team1Data.id) : [];
    const team2Players = team2Data ? await getPlayers(team2Data.id) : [];
    
    // Calculate totals
    const calcTotal = (players, bonusPoints) => {
      const playerPoints = players.reduce((sum, p) => sum + p.points, 0);
      return playerPoints + (bonusPoints || 0);
    };
    
    return {
      id: game.id,
      date: game.date,
      team1: {
        name: team1Data?.name || '',
        bonusPoints: team1Data?.bonus_points || 0,
        total: calcTotal(team1Players, team1Data?.bonus_points),
        players: team1Players
      },
      team2: {
        name: team2Data?.name || '',
        bonusPoints: team2Data?.bonus_points || 0,
        total: calcTotal(team2Players, team2Data?.bonus_points),
        players: team2Players
      }
    };
  },

  // Delete a game
  async delete(gameId, deviceId) {
    const result = await db.query(
      'DELETE FROM games WHERE id = $1 AND device_id = $2 RETURNING id',
      [gameId, deviceId]
    );
    return result.rows.length > 0;
  }
};

module.exports = Game;
