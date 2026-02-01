# 3D Tetris Battle

실시간 멀티플레이어 3D 테트리스 대전 게임

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-0.161-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-white)

## Demo

**Live Demo**: https://3d-tetris-seven.vercel.app

## Features

### Game Features
- **3D Graphics**: React Three Fiber 기반 3D 테트리스 보드
- **Multiplayer**: Socket.IO 실시간 대전 (2-8인)
- **SRS Standard**: 표준 Super Rotation System 벽차기
- **Ghost Piece**: 하드드랍 위치 미리보기
- **Hold System**: 피스 홀드 기능
- **Next Queue**: 다음 5개 피스 미리보기

### Scoring System
- **Line Clear**: Single, Double, Triple, Tetris
- **T-Spin**: T-Spin Mini, T-Spin Single/Double/Triple
- **Back-to-Back**: 연속 어려운 클리어 보너스
- **Combo**: 연속 라인 클리어 보너스
- **Perfect Clear**: 보드 완전 클리어 보너스

### Multiplayer Features
- **Garbage Lines**: 라인 클리어 시 상대에게 가비지 전송
- **Matchmaking**: 자동 매칭 시스템
- **Room System**: 방 생성/참가
- **Real-time Sync**: 클라이언트 예측 + 서버 권한 동기화

## Tech Stack

### Frontend (Client)
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Three.js | 3D Rendering |
| React Three Fiber | React + Three.js |
| React Three Drei | 3D Helpers |
| Zustand | State Management |
| Socket.IO Client | Real-time Communication |
| Tailwind CSS | Styling |
| Vite | Build Tool |

### Backend (Server)
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| TypeScript | Type Safety |
| Express | HTTP Server |
| Socket.IO | WebSocket Server |

### Shared
| Technology | Purpose |
|------------|---------|
| TypeScript | Shared Types & Logic |
| TetrisEngine | Game Physics |

## Project Structure

```
3d-tetris-battle/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/    # Menu, Lobby, Room, Game, GameOver
│   │   │   ├── three/      # 3D Components (Board, Block, Tetromino)
│   │   │   └── ui/         # HUD, ScoreBoard, NextQueue, HoldPiece
│   │   ├── hooks/          # useSocket, useGameInput, useLocalPrediction
│   │   ├── store/          # Zustand Store (gameStore)
│   │   └── App.tsx
│   └── package.json
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── index.ts        # Entry Point, Socket.IO Setup
│   │   └── GameRoom.ts     # Game Logic, State Management
│   └── package.json
├── shared/                 # Shared Code
│   ├── src/
│   │   ├── index.ts        # Types, Constants, Configs
│   │   └── game/
│   │       └── TetrisEngine.ts  # Game Physics
│   └── package.json
├── package.json            # Monorepo Root
└── pnpm-workspace.yaml
```

## Installation

### Prerequisites
- Node.js 18+
- pnpm

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
# Run both client and server in development mode
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

## Game Controls

| Key | Action |
|-----|--------|
| `←` / `A` | Move Left |
| `→` / `D` | Move Right |
| `↓` / `S` | Soft Drop |
| `Space` | Hard Drop |
| `↑` / `X` | Rotate CW |
| `Z` / `Ctrl` | Rotate CCW |
| `C` / `Shift` | Hold |

### DAS/ARR Settings
- **DAS (Delayed Auto Shift)**: 133ms
- **ARR (Auto Repeat Rate)**: 50ms

## Architecture

### Client-Server Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                    │
├─────────────────────────────────────────────────────────────────┤
│  Input → Local Prediction → Socket.emit('gameAction')          │
│                                                                  │
│  Socket.on('gameUpdate') → Reconciliation → Render              │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                         WebSocket
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER                                    │
├─────────────────────────────────────────────────────────────────┤
│  TetrisEngine (60 FPS) → Game State → broadcast('gameUpdate')  │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Authoritative Display

스냅백 방지를 위한 클라이언트 권한 디스플레이 시스템:

| State | Owner | Description |
|-------|-------|-------------|
| X Position | Client | 로컬 예측 완전 신뢰 |
| Rotation | Client | 로컬 예측 완전 신뢰 |
| Y Position | Server | 중력은 서버 권한 |
| Board | Server | 락된 피스는 서버 권한 |

**동기화 지점 (Reset Triggers)**:
- 피스 타입 변경 (새 피스 스폰)
- 보드 해시 변경 (피스 락, 가비지 수신)

### Game Loop

```
Server (60 FPS):
  1. Process player actions (gameAction events)
  2. Apply gravity
  3. Check piece locking
  4. Clear lines, send garbage
  5. Broadcast game state

Client:
  1. Capture input
  2. Apply local prediction (immediate feedback)
  3. Send action to server
  4. Receive server state
  5. Reconcile (sync on piece/board changes only)
  6. Render displayPiece
```

## Deployment

### Client (Vercel)

```bash
vercel --prod
```

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build:client",
  "outputDirectory": "client/dist"
}
```

### Server (Fly.io / Render)

**Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build:server
CMD ["npm", "start"]
```

**Environment Variables**:
```
PORT=3001
NODE_ENV=production
```

## Configuration

### Game Config (`shared/src/index.ts`)

```typescript
export const GAME_CONFIG = {
  lockDelay: 500,        // Lock delay in ms
  lockMoves: 15,         // Max moves before force lock
  baseGravity: 1,        // Cells per second at level 1
  gravityIncrease: 0.1,  // Gravity increase per level
  maxGravity: 20,        // Maximum gravity
  nextQueueSize: 5,      // Next pieces to show
  countdownSeconds: 3,   // Pre-game countdown
  minPlayers: 2,         // Minimum players to start
  maxPlayers: 8,         // Maximum players per room
};
```

### Scoring Table

| Action | Score | Garbage |
|--------|-------|---------|
| Single | 100 | 0 |
| Double | 300 | 1 |
| Triple | 500 | 2 |
| Tetris | 800 | 4 |
| T-Spin Mini | 100 | 0 |
| T-Spin Single | 800 | 2 |
| T-Spin Double | 1200 | 4 |
| T-Spin Triple | 1600 | 6 |
| Perfect Clear | 3000 | 10 |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License
