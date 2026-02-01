# 3D Tetris Battle

Real-time multiplayer 3D Tetris battle game with modern web technologies.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-0.161-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-white)

## Live Demo

**Play Now**: https://3d-tetris-seven.vercel.app

## Features

### Core Gameplay
- **3D Graphics** - Beautiful 3D tetris board powered by React Three Fiber
- **SRS Standard** - Super Rotation System with proper wall kicks (JLSTZ + I pieces)
- **Ghost Piece** - Preview where your piece will land
- **Hold System** - Save a piece for later use
- **Next Queue** - See the next 5 pieces coming up

### Multiplayer Battle (2-8 Players)
- **Real-time PvP** - Battle against friends or random opponents
- **Garbage Lines** - Send garbage to opponents when clearing lines
- **Live Opponent View** - Watch opponents' boards in real-time with their names displayed
- **Room System** - Create or join game rooms
- **Quick Match** - Auto-matchmaking with preference settings
- **Room Chat** - Chat with other players while waiting (with message history)

### Scoring System
| Action | Score | Garbage Sent |
|--------|-------|--------------|
| Single | 100 | 0 |
| Double | 300 | 1 |
| Triple | 500 | 2 |
| Tetris | 800 | 4 |
| T-Spin Mini | 100 | 0 |
| T-Spin Single | 800 | 2 |
| T-Spin Double | 1200 | 4 |
| T-Spin Triple | 1600 | 6 |
| Perfect Clear | 3000 | 10 |
| Combo | +50/combo | +1-5 |
| Back-to-Back | x1.5 | +1 |

### Technical Features
- **Client-Side Prediction** - Instant response to inputs, no input lag
- **Server Reconciliation** - Authoritative server prevents cheating
- **Lock Delay System** - 500ms lock delay with reset on move/rotate (max 15 moves)
- **Instant Hard Drop** - Immediate visual feedback with local board prediction

## Controls

| Key | Action |
|-----|--------|
| `←` / `A` | Move Left |
| `→` / `D` | Move Right |
| `↓` / `S` | Soft Drop |
| `Space` | Hard Drop (instant lock) |
| `↑` / `X` | Rotate Clockwise |
| `Z` / `Ctrl` | Rotate Counter-Clockwise |
| `C` / `Shift` | Hold Piece |

### Input Settings
- **DAS (Delayed Auto Shift)**: 133ms
- **ARR (Auto Repeat Rate)**: 50ms
- **Soft Drop Speed**: 20x gravity

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Three.js | 3D Rendering |
| React Three Fiber | React + Three.js Integration |
| React Three Drei | 3D Utilities & Text |
| Zustand | Global State Management |
| Socket.IO Client | Real-time Communication |
| Tailwind CSS | Styling |
| Vite | Build Tool |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| TypeScript | Type Safety |
| Express | HTTP Server |
| Socket.IO | WebSocket Server |

### Shared
| Technology | Purpose |
|------------|---------|
| TypeScript | Shared Types & Constants |
| TetrisEngine | Core Game Logic |

## Project Structure

```
3d-tetris-battle/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/    # Menu, Lobby, Room, Game, GameOver
│   │   │   ├── three/      # 3D Components (Board, Block, Tetromino)
│   │   │   └── ui/         # HUD, ScoreBoard, NextQueue, HoldPiece
│   │   ├── hooks/
│   │   │   ├── useSocket.ts         # Socket.IO connection
│   │   │   ├── useGameInput.ts      # Keyboard input with DAS/ARR
│   │   │   └── useLocalPrediction.ts # Client-side prediction
│   │   ├── store/
│   │   │   └── gameStore.ts         # Zustand state management
│   │   └── App.tsx
│   └── package.json
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── index.ts        # Socket.IO setup, matchmaking
│   │   └── GameRoom.ts     # Game loop, room management
│   └── package.json
├── shared/                 # Shared Code
│   ├── src/
│   │   ├── index.ts        # Types, Constants, Configs
│   │   └── game/
│   │       └── TetrisEngine.ts  # Core game physics
│   └── package.json
├── package.json            # Monorepo root (pnpm workspaces)
└── pnpm-workspace.yaml
```

## Installation

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# Clone repository
git clone https://github.com/lois-u/3d-tetris-battle.git
cd 3d-tetris-battle

# Install dependencies
pnpm install

# Build shared package
pnpm build:shared
```

## Development

```bash
# Run both client and server
pnpm dev

# Run only client (http://localhost:5173)
pnpm dev:client

# Run only server (http://localhost:3001)
pnpm dev:server
```

## Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:client
pnpm build:server
pnpm build:shared
```

## Architecture

### Client-Server Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
├─────────────────────────────────────────────────────────────────┤
│  Input → Local Prediction → Display                             │
│            ↓                                                     │
│  Socket.emit('gameAction') ───────────────────┐                 │
│                                                │                 │
│  Socket.on('gameUpdate') ← Reconciliation ←───┘                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                          SERVER                                  │
├─────────────────────────────────────────────────────────────────┤
│  Receive Actions → TetrisEngine (60 FPS) → Broadcast State      │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side Prediction

To eliminate input lag, the client predicts action results locally:

| State | Authority | Sync Trigger |
|-------|-----------|--------------|
| X Position | Client | Piece type change |
| Rotation | Client | Piece type change |
| Y Position | Server (gravity) | Every frame |
| Board | Server | Board hash change |

**Hard Drop Optimization:**
- Piece locks to board instantly (local prediction)
- Next piece spawns immediately from local queue
- Server confirms when board hash changes

### Lock Delay System

Standard Tetris lock delay with reset:

- **Lock Delay**: 500ms after piece touches ground
- **Lock Reset**: Timer resets on successful move/rotate
- **Max Moves**: 15 moves maximum to prevent infinite stalling
- **Soft Drop**: Does not reset lock timer

## Configuration

### Game Config (`shared/src/index.ts`)

```typescript
export const GAME_CONFIG = {
  // Timing
  lockDelay: 500,        // ms before piece locks
  lockMoves: 15,         // max moves before force lock
  
  // Gravity
  baseGravity: 1,        // cells/second at level 1
  gravityIncrease: 0.1,  // per level
  maxGravity: 20,        // cap
  
  // Queue
  nextQueueSize: 5,      // visible next pieces
  
  // Room
  minPlayers: 2,
  maxPlayers: 8,
  countdownSeconds: 3,
};
```

## Deployment

### Client (Vercel)

```bash
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "npm run build:client",
  "outputDirectory": "client/dist"
}
```

### Server (Fly.io / Render / Railway)

**Environment Variables:**
```
PORT=3001
NODE_ENV=production
```

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build:server
CMD ["npm", "start"]
```

## Socket Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `joinLobby` | `{ playerName }` | Join lobby |
| `createRoom` | `{ maxPlayers }` | Create new room |
| `joinRoom` | `{ roomId }` | Join existing room |
| `leaveRoom` | - | Leave current room |
| `startGame` | - | Host starts game |
| `gameAction` | `GameAction` | Send game input |
| `sendChat` | `{ message }` | Send chat message |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `connected` | `{ playerId }` | Connection established |
| `lobbyUpdate` | `{ players, rooms }` | Lobby state |
| `roomJoined` | `{ room }` | Joined room |
| `roomUpdate` | `{ room }` | Room state changed |
| `chatMessage` | `{ message }` | New chat message |
| `chatHistory` | `{ messages }` | Chat history on join |
| `gameStart` | `GameState` | Game started |
| `gameUpdate` | `GameState` | Game state (60 FPS) |
| `gameOver` | `{ winner }` | Game ended |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License
