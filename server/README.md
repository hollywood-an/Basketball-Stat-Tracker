# Basketball Stat Tracker API

Backend API for the Basketball Stat Tracker mobile app.

## Tech Stack

- Node.js + Express
- PostgreSQL
- Anonymous device authentication

## Local Development Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Or use Docker:**
```bash
docker run --name basketball-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=basketball_db -p 5432:5432 -d postgres:15
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE basketball_db;

# Exit psql
\q
```

### 3. Initialize Schema

```bash
# Run the schema file
psql -U postgres -d basketball_db -f schema.sql
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://postgres:password@localhost:5432/basketball_db
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/device` | Register device, get token | No |
| GET | `/api/games` | Get all games | Yes |
| POST | `/api/games` | Create a game | Yes |
| DELETE | `/api/games/:id` | Delete a game | Yes |
| GET | `/health` | Health check | No |

### Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <device_token>
```

### Example Requests

**Register Device:**
```bash
curl -X POST http://localhost:3000/api/auth/device
```

Response:
```json
{
  "token": "uuid-token-here",
  "deviceId": 1
}
```

**Create Game:**
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "1/29/2026",
    "team1": {
      "name": "Lakers",
      "bonusPoints": 0,
      "players": [
        {"name": "Player 1", "number": "23", "points": 20, "fouls": 2}
      ]
    },
    "team2": {
      "name": "Bulls",
      "bonusPoints": 0,
      "players": [
        {"name": "Player 2", "number": "11", "points": 15, "fouls": 1}
      ]
    }
  }'
```

**Get All Games:**
```bash
curl http://localhost:3000/api/games \
  -H "Authorization: Bearer <token>"
```

**Delete Game:**
```bash
curl -X DELETE http://localhost:3000/api/games/1 \
  -H "Authorization: Bearer <token>"
```

## Deploy to Railway

### 1. Create Railway Account
Sign up at [railway.app](https://railway.app)

### 2. Install Railway CLI (optional)
```bash
npm install -g @railway/cli
railway login
```

### 3. Deploy via GitHub

1. Push your code to GitHub
2. In Railway dashboard, click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the Node.js app

### 4. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically sets `DATABASE_URL`

### 5. Configure Root Directory

Since the server is in a subdirectory, set the root directory:

1. Go to your service settings in Railway
2. Set "Root Directory" to `server`

### 6. Initialize Database Schema

Option A - Railway CLI:
```bash
railway run psql $DATABASE_URL -f schema.sql
```

Option B - Copy schema.sql contents and run in Railway's database query console

### 7. Get Your API URL

After deployment, Railway provides a URL like:
```
https://your-app.up.railway.app
```

Update your mobile app's API_URL to this value.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PORT` | Server port (auto-set by Railway) | No |
| `NODE_ENV` | `development` or `production` | No |

## Project Structure

```
server/
├── config/
│   └── db.js           # Database connection pool
├── middleware/
│   └── auth.js         # Token authentication
├── models/
│   ├── device.js       # Device model
│   ├── game.js         # Game model (with teams/players)
│   └── index.js        # Model exports
├── routes/
│   ├── auth.js         # Auth endpoints
│   ├── games.js        # Game endpoints
│   └── index.js        # Route aggregator
├── .env.example        # Environment template
├── package.json
├── Procfile            # Railway deployment
├── schema.sql          # Database schema
└── server.js           # Express app entry
```
