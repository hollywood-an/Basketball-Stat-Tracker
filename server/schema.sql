-- Basketball Stat Tracker Database Schema
-- Run this script to initialize your PostgreSQL database

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS devices CASCADE;

-- Devices table for anonymous authentication
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table linked to devices
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table linked to games (team_number: 1 or 2)
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT '',
    team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
    bonus_points INTEGER DEFAULT 0
);

-- Players table linked to teams
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    number VARCHAR(10) NOT NULL,
    points INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0
);

-- Indexes for faster queries
CREATE INDEX idx_games_device_id ON games(device_id);
CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_devices_token ON devices(device_token);
