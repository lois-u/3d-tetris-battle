import { Server } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  LobbyPlayer,
  GameState,
  PlayerState,
  GameAction,
  TetrisEngine,
  GAME_CONFIG,
  RoomInfo,
} from '@3d-tetris/shared';

interface PlayerData {
  info: LobbyPlayer;
  engine: TetrisEngine;
  ready: boolean;
  lastGravityTime: number;
  lastLockTime: number | null;
}

export class GameRoom {
  private id: string;
  private players: Map<string, PlayerData> = new Map();
  private maxPlayers: number;
  private status: 'waiting' | 'countdown' | 'playing' | 'finished' = 'waiting';
  private countdown: number = 0;
  private winner: string | null = null;
  private startTime: number | null = null;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    id: string,
    initialPlayers: LobbyPlayer[],
    maxPlayers: number,
    io: Server<ClientToServerEvents, ServerToClientEvents>
  ) {
    this.id = id;
    this.maxPlayers = maxPlayers;
    this.io = io;

    for (const player of initialPlayers) {
      this.addPlayer(player);
    }
  }

  getId(): string {
    return this.id;
  }

  getStatus(): 'waiting' | 'countdown' | 'playing' | 'finished' {
    return this.status;
  }

  getMaxPlayers(): number {
    return this.maxPlayers;
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  addPlayer(player: LobbyPlayer): boolean {
    if (this.isFull() || this.status !== 'waiting') {
      return false;
    }

    this.players.set(player.id, {
      info: player,
      engine: new TetrisEngine(),
      ready: false,
      lastGravityTime: 0,
      lastLockTime: null,
    });

    return true;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  getPlayers(): LobbyPlayer[] {
    return Array.from(this.players.values()).map(p => p.info);
  }

  getRoomInfo(): RoomInfo {
    return {
      id: this.id,
      players: this.getPlayers(),
      maxPlayers: this.maxPlayers,
      status: this.status,
    };
  }

  canStart(): boolean {
    return this.players.size >= GAME_CONFIG.minPlayers && this.status === 'waiting';
  }

  startCountdown(): void {
    if (!this.canStart()) return;

    this.status = 'countdown';
    this.countdown = GAME_CONFIG.countdownSeconds;
    this.broadcastState();

    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        this.startGame();
      } else {
        this.broadcastState();
      }
    }, 1000);
  }

  private startGame(): void {
    this.status = 'playing';
    this.startTime = Date.now();

    for (const player of this.players.values()) {
      player.engine.spawnPiece();
      player.lastGravityTime = Date.now();
    }

    this.io.to(this.id).emit('gameStart', this.getGameState());

    this.gameLoopInterval = setInterval(() => {
      this.gameLoop();
    }, 1000 / 60);
  }

  private gameLoop(): void {
    if (this.status !== 'playing') return;

    const now = Date.now();

    for (const [playerId, player] of this.players.entries()) {
      if (!player.engine.getState().isAlive) continue;

      const gravity = player.engine.getGravity();
      const gravityInterval = 1000 / gravity;

      if (now - player.lastGravityTime >= gravityInterval) {
        const moved = player.engine.moveDown();
        player.lastGravityTime = now;

        if (!moved.success) {
          if (player.lastLockTime === null) {
            player.lastLockTime = now;
          } else if (now - player.lastLockTime >= GAME_CONFIG.lockDelay || player.engine.shouldLock()) {
            const result = player.engine.lockPiece();

            if (result && result.garbageToSend > 0) {
              this.sendGarbage(playerId, result.garbageToSend);
            }

            player.engine.receiveGarbage();
            player.engine.spawnPiece();
            player.lastLockTime = null;

            if (player.engine.isGameOver()) {
              this.handlePlayerDeath(playerId);
              return;
            }
          }
        } else {
          player.lastLockTime = null;
        }
      }
    }

    this.broadcastState();
  }

  handleAction(playerId: string, action: GameAction): void {
    if (this.status !== 'playing') return;

    const player = this.players.get(playerId);
    if (!player || !player.engine.getState().isAlive) return;

    let actionPerformed = false;

    switch (action.type) {
      case 'moveLeft':
        actionPerformed = player.engine.moveLeft().success;
        break;
      case 'moveRight':
        actionPerformed = player.engine.moveRight().success;
        break;
      case 'moveDown':
        actionPerformed = player.engine.moveDown().success;
        break;
      case 'softDrop':
        actionPerformed = player.engine.softDrop().success;
        break;
      case 'hardDrop': {
        const result = player.engine.hardDrop();
        actionPerformed = true;

        if (result.lineClearResult && result.lineClearResult.garbageToSend > 0) {
          this.sendGarbage(playerId, result.lineClearResult.garbageToSend);
        }

        player.engine.receiveGarbage();
        player.engine.spawnPiece();
        player.lastLockTime = null;

        if (player.engine.isGameOver()) {
          this.handlePlayerDeath(playerId);
          return;
        }
        break;
      }
      case 'rotateCW':
        actionPerformed = player.engine.rotateCW().success;
        break;
      case 'rotateCCW':
        actionPerformed = player.engine.rotateCCW().success;
        break;
      case 'rotate180':
        actionPerformed = player.engine.rotate180().success;
        break;
      case 'hold':
        actionPerformed = player.engine.hold();
        break;
    }

    if (actionPerformed && player.engine.isOnGround()) {
      player.lastLockTime = player.lastLockTime || Date.now();
    }

    this.broadcastState();
  }

  private sendGarbage(fromPlayerId: string, lines: number): void {
    const aliveOpponents = this.getAliveOpponents(fromPlayerId);
    if (aliveOpponents.length === 0) return;

    const targetId = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
    const target = this.players.get(targetId);
    if (!target) return;

    const cancelled = target.engine.cancelGarbage(lines);
    if (cancelled > 0) {
      target.engine.addGarbage(cancelled);

      const fromPlayer = this.players.get(fromPlayerId);
      this.io.to(targetId).emit('garbageIncoming', {
        lines: cancelled,
        fromPlayer: fromPlayer?.info.name || 'Opponent',
      });
    }
  }

  private getAliveOpponents(playerId: string): string[] {
    const opponents: string[] = [];
    for (const [id, player] of this.players.entries()) {
      if (id !== playerId && player.engine.getState().isAlive) {
        opponents.push(id);
      }
    }
    return opponents;
  }

  private getAlivePlayers(): string[] {
    const alive: string[] = [];
    for (const [id, player] of this.players.entries()) {
      if (player.engine.getState().isAlive) {
        alive.push(id);
      }
    }
    return alive;
  }

  private handlePlayerDeath(playerId: string): void {
    const alivePlayers = this.getAlivePlayers();

    if (alivePlayers.length === 1) {
      this.endGame(alivePlayers[0]);
    } else if (alivePlayers.length === 0) {
      this.endGame(null);
    }

    this.broadcastState();
  }

  setPlayerReady(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.ready = true;
    }
  }

  handleSurrender(playerId: string): void {
    if (this.status !== 'playing') return;

    const player = this.players.get(playerId);
    if (player) {
      player.engine.getState().isAlive = false;
      this.handlePlayerDeath(playerId);
    }
  }

  handleDisconnect(playerId: string): void {
    if (this.status === 'playing') {
      const player = this.players.get(playerId);
      if (player && player.engine.getState().isAlive) {
        player.engine.getState().isAlive = false;
        this.handlePlayerDeath(playerId);
      }
    }
    this.players.delete(playerId);
  }

  private endGame(winnerId: string | null): void {
    this.status = 'finished';
    this.winner = winnerId;

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    const winnerPlayer = winnerId ? this.players.get(winnerId) : null;

    this.io.to(this.id).emit('gameOver', {
      winner: winnerPlayer?.info.name || 'No Winner',
      reason: 'Game Over',
    });
  }

  private getPlayerState(playerId: string): PlayerState {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const state = player.engine.getState();

    return {
      id: playerId,
      name: player.info.name,
      board: state.board,
      currentPiece: state.currentPiece,
      holdPiece: state.holdPiece,
      canHold: state.canHold,
      nextPieces: state.nextPieces,
      score: state.score,
      level: state.level,
      linesCleared: state.linesCleared,
      combo: state.combo,
      backToBack: state.backToBack,
      isAlive: state.isAlive,
      pendingGarbage: state.pendingGarbage,
    };
  }

  private getGameState(): GameState {
    const players: PlayerState[] = [];

    for (const playerId of this.players.keys()) {
      players.push(this.getPlayerState(playerId));
    }

    return {
      id: this.id,
      players,
      status: this.status,
      countdown: this.countdown,
      winner: this.winner,
      startTime: this.startTime,
    };
  }

  private broadcastState(): void {
    this.io.to(this.id).emit('gameUpdate', this.getGameState());
  }

  cleanup(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
