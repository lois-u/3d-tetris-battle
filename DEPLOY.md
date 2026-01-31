# 배포 가이드

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│                    (Static Frontend)                         │
│              https://your-app.vercel.app                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Railway                               │
│                  (Socket.io Server)                          │
│              https://your-server.railway.app                 │
└─────────────────────────────────────────────────────────────┘
```

## 1. 서버 배포 (Railway)

### Railway 설정

1. [Railway](https://railway.app)에 가입/로그인
2. "New Project" → "Deploy from GitHub repo"
3. 이 저장소 선택
4. Settings에서 다음 설정:
   - **Root Directory**: `server`
   - **Build Command**: `cd .. && npm install -g pnpm && pnpm install && pnpm run build:server`
   - **Start Command**: `node dist/index.js`

### 환경 변수 (Railway)

```
PORT=3001
HOST=0.0.0.0
```

### 배포 확인

배포 후 `https://your-server.railway.app/health` 접속하여 `{"status":"healthy"}` 확인

## 2. 클라이언트 배포 (Vercel)

### Vercel 설정

1. [Vercel](https://vercel.com)에 가입/로그인
2. "Add New" → "Project" → GitHub repo 선택
3. 설정:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `cd .. && pnpm run build:client`
   - **Output Directory**: `dist`
   - **Install Command**: `cd .. && npm install -g pnpm && pnpm install`

### 환경 변수 (Vercel)

```
VITE_SERVER_URL=https://your-server.railway.app
```

⚠️ **중요**: Railway 서버 URL을 반드시 설정해야 합니다!

## 3. 빠른 배포 (CLI)

### Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 클라이언트 디렉토리에서 배포
cd client
vercel --prod
```

### Railway CLI

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 서버 디렉토리에서 배포
cd server
railway up
```

## 4. 로컬 개발

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (클라이언트 + 서버 동시)
pnpm run dev

# 클라이언트: http://localhost:5173
# 서버: http://localhost:3001
```

## 문제 해결

### WebSocket 연결 실패

1. Railway 서버가 정상 작동하는지 확인 (`/health` 엔드포인트)
2. Vercel 환경 변수 `VITE_SERVER_URL`이 올바르게 설정되었는지 확인
3. CORS 설정 확인 (서버에서 모든 origin 허용 중)

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
pnpm run build

# shared → server → client 순서로 빌드되는지 확인
```

## 대안 배포 옵션

### 서버 대안

- **Render**: https://render.com (무료 tier, WebSocket 지원)
- **Fly.io**: https://fly.io (무료 tier, 글로벌 엣지)
- **DigitalOcean App Platform**: WebSocket 지원

### 올인원 옵션

Vercel만으로 전체 배포하려면 Ably/Pusher 같은 managed WebSocket 서비스로 전환 필요
