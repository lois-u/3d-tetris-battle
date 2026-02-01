# 3D Tetris Battle

실시간 멀티플레이어 3D 테트리스 대전 게임

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-0.161-black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-white)

## 라이브 데모

**플레이하기**: https://3d-tetris-seven.vercel.app

## 주요 기능

### 핵심 게임플레이
- **3D 그래픽** - React Three Fiber 기반의 아름다운 3D 테트리스 보드
- **SRS 표준** - 올바른 벽차기가 적용된 Super Rotation System (JLSTZ + I 피스)
- **고스트 피스** - 피스가 착지할 위치 미리보기
- **홀드 시스템** - 나중에 사용할 피스 저장
- **다음 피스 큐** - 다음에 나올 5개의 피스 미리보기

### 멀티플레이어 대전 (2-8인)
- **실시간 PvP** - 친구 또는 랜덤 상대와 대전
- **가비지 라인** - 라인 클리어 시 상대에게 방해 라인 전송
- **실시간 상대 보드** - 상대방의 보드와 닉네임을 실시간으로 확인
- **방 시스템** - 게임 방 생성 또는 참가
- **빠른 매치** - 선호도 설정이 가능한 자동 매칭
- **대기실 채팅** - 대기 중 다른 플레이어와 채팅 (메시지 기록 유지)

### 점수 시스템
| 액션 | 점수 | 전송 가비지 |
|------|------|-------------|
| 싱글 | 100 | 0 |
| 더블 | 300 | 1 |
| 트리플 | 500 | 2 |
| 테트리스 | 800 | 4 |
| T-스핀 미니 | 100 | 0 |
| T-스핀 싱글 | 800 | 2 |
| T-스핀 더블 | 1200 | 4 |
| T-스핀 트리플 | 1600 | 6 |
| 퍼펙트 클리어 | 3000 | 10 |
| 콤보 | +50/콤보 | +1-5 |
| 백투백 | x1.5 | +1 |

### 기술적 특징
- **클라이언트 측 예측** - 입력에 즉각 반응, 입력 지연 없음
- **서버 조정** - 권위적 서버로 치팅 방지
- **락 딜레이 시스템** - 이동/회전 시 리셋되는 500ms 락 딜레이 (최대 15회 이동)
- **즉각적 하드드랍** - 로컬 보드 예측을 통한 즉각적인 시각적 피드백

## 조작법

| 키 | 동작 |
|----|------|
| `←` / `A` | 왼쪽 이동 |
| `→` / `D` | 오른쪽 이동 |
| `↓` / `S` | 소프트 드랍 |
| `Space` | 하드 드랍 (즉시 고정) |
| `↑` / `X` | 시계 방향 회전 |
| `Z` / `Ctrl` | 반시계 방향 회전 |
| `C` / `Shift` | 홀드 |

### 입력 설정
- **DAS (Delayed Auto Shift)**: 133ms
- **ARR (Auto Repeat Rate)**: 50ms
- **소프트 드랍 속도**: 중력의 20배

## 기술 스택

### 프론트엔드
| 기술 | 용도 |
|------|------|
| React 18 | UI 프레임워크 |
| TypeScript | 타입 안정성 |
| Three.js | 3D 렌더링 |
| React Three Fiber | React + Three.js 통합 |
| React Three Drei | 3D 유틸리티 및 텍스트 |
| Zustand | 전역 상태 관리 |
| Socket.IO Client | 실시간 통신 |
| Tailwind CSS | 스타일링 |
| Vite | 빌드 도구 |

### 백엔드
| 기술 | 용도 |
|------|------|
| Node.js | 런타임 |
| TypeScript | 타입 안정성 |
| Express | HTTP 서버 |
| Socket.IO | WebSocket 서버 |

### 공유 패키지
| 기술 | 용도 |
|------|------|
| TypeScript | 공유 타입 및 상수 |
| TetrisEngine | 핵심 게임 로직 |

## 프로젝트 구조

```
3d-tetris-battle/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/    # Menu, Lobby, Room, Game, GameOver
│   │   │   ├── three/      # 3D 컴포넌트 (Board, Block, Tetromino)
│   │   │   └── ui/         # HUD, ScoreBoard, NextQueue, HoldPiece
│   │   ├── hooks/
│   │   │   ├── useSocket.ts         # Socket.IO 연결
│   │   │   ├── useGameInput.ts      # DAS/ARR 포함 키보드 입력
│   │   │   └── useLocalPrediction.ts # 클라이언트 측 예측
│   │   ├── store/
│   │   │   └── gameStore.ts         # Zustand 상태 관리
│   │   └── App.tsx
│   └── package.json
├── server/                 # Node.js 백엔드
│   ├── src/
│   │   ├── index.ts        # Socket.IO 설정, 매치메이킹
│   │   └── GameRoom.ts     # 게임 루프, 방 관리
│   └── package.json
├── shared/                 # 공유 코드
│   ├── src/
│   │   ├── index.ts        # 타입, 상수, 설정
│   │   └── game/
│   │       └── TetrisEngine.ts  # 핵심 게임 물리
│   └── package.json
├── package.json            # 모노레포 루트 (pnpm workspaces)
└── pnpm-workspace.yaml
```

## 설치

### 필수 요구사항
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### 설정

```bash
# 저장소 클론
git clone https://github.com/lois-u/3d-tetris-battle.git
cd 3d-tetris-battle

# 의존성 설치
pnpm install

# 공유 패키지 빌드
pnpm build:shared
```

## 개발

```bash
# 클라이언트와 서버 동시 실행
pnpm dev

# 클라이언트만 실행 (http://localhost:5173)
pnpm dev:client

# 서버만 실행 (http://localhost:3001)
pnpm dev:server
```

## 빌드

```bash
# 모든 패키지 빌드
pnpm build

# 특정 패키지 빌드
pnpm build:client
pnpm build:server
pnpm build:shared
```

## 아키텍처

### 클라이언트-서버 통신

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트                                 │
├─────────────────────────────────────────────────────────────────┤
│  입력 → 로컬 예측 → 화면 표시                                      │
│           ↓                                                      │
│  Socket.emit('gameAction') ───────────────────┐                  │
│                                                │                  │
│  Socket.on('gameUpdate') ← 서버 조정 ←─────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                          서버                                     │
├─────────────────────────────────────────────────────────────────┤
│  액션 수신 → TetrisEngine (60 FPS) → 상태 브로드캐스트             │
└─────────────────────────────────────────────────────────────────┘
```

### 클라이언트 측 예측

입력 지연을 제거하기 위해 클라이언트가 로컬에서 액션 결과를 예측합니다:

| 상태 | 권한 | 동기화 트리거 |
|------|------|---------------|
| X 위치 | 클라이언트 | 피스 타입 변경 |
| 회전 | 클라이언트 | 피스 타입 변경 |
| Y 위치 | 서버 (중력) | 매 프레임 |
| 보드 | 서버 | 보드 해시 변경 |

**하드 드랍 최적화:**
- 피스가 즉시 보드에 고정됨 (로컬 예측)
- 다음 피스가 로컬 큐에서 즉시 생성됨
- 보드 해시가 변경되면 서버가 확인

### 락 딜레이 시스템

표준 테트리스 락 딜레이 및 리셋:

- **락 딜레이**: 피스가 바닥에 닿은 후 500ms
- **락 리셋**: 성공적인 이동/회전 시 타이머 리셋
- **최대 이동 횟수**: 무한 스톨링 방지를 위해 최대 15회
- **소프트 드랍**: 락 타이머를 리셋하지 않음

## 설정

### 게임 설정 (`shared/src/index.ts`)

```typescript
export const GAME_CONFIG = {
  // 타이밍
  lockDelay: 500,        // 피스 고정 전 ms
  lockMoves: 15,         // 강제 고정 전 최대 이동 횟수
  
  // 중력
  baseGravity: 1,        // 레벨 1에서의 셀/초
  gravityIncrease: 0.1,  // 레벨당 증가
  maxGravity: 20,        // 최대값
  
  // 큐
  nextQueueSize: 5,      // 표시되는 다음 피스 수
  
  // 방
  minPlayers: 2,
  maxPlayers: 8,
  countdownSeconds: 3,
};
```

## 배포

### 클라이언트 (Vercel)

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

### 서버 (Fly.io / Render / Railway)

**환경 변수:**
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

## 소켓 이벤트

### 클라이언트 → 서버
| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `joinLobby` | `{ playerName }` | 로비 참가 |
| `createRoom` | `{ maxPlayers }` | 새 방 생성 |
| `joinRoom` | `{ roomId }` | 기존 방 참가 |
| `leaveRoom` | - | 현재 방 나가기 |
| `startGame` | - | 호스트가 게임 시작 |
| `gameAction` | `GameAction` | 게임 입력 전송 |
| `sendChat` | `{ message }` | 채팅 메시지 전송 |

### 서버 → 클라이언트
| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `connected` | `{ playerId }` | 연결 완료 |
| `lobbyUpdate` | `{ players, rooms }` | 로비 상태 |
| `roomJoined` | `{ room }` | 방 참가 완료 |
| `roomUpdate` | `{ room }` | 방 상태 변경 |
| `chatMessage` | `{ message }` | 새 채팅 메시지 |
| `chatHistory` | `{ messages }` | 참가 시 채팅 기록 |
| `gameStart` | `GameState` | 게임 시작 |
| `gameUpdate` | `GameState` | 게임 상태 (60 FPS) |
| `gameOver` | `{ winner }` | 게임 종료 |

## 기여하기

1. 저장소 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 라이선스

MIT License
