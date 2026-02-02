import {
  Board,
  Cell,
  Tetromino,
  TetrominoType,
  Position,
  RotationState,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BOARD_BUFFER_HEIGHT,
  TETROMINO_SHAPES,
  WALL_KICKS_JLSTZ,
  WALL_KICKS_I,
  GAME_CONFIG,
  SCORE_TABLE,
  GARBAGE_TABLE,
  LineClearResult,
  MoveResult,
  createEmptyBoard,
  createBag,
  cloneBoard,
} from '../index.js';

export class TetrisEngine {
  private board: Board;
  private currentPiece: Tetromino | null = null;
  private holdPiece: TetrominoType | null = null;
  private canHold: boolean = true;
  private nextQueue: TetrominoType[] = [];
  private bag: TetrominoType[] = [];
  private score: number = 0;
  private level: number = 1;
  private linesCleared: number = 0;
  private combo: number = -1;
  private backToBack: boolean = false;
  private isAlive: boolean = true;
  private pendingGarbage: number = 0;
  private lockMoveCount: number = 0;
  private lastMoveWasRotation: boolean = false;
  private lastWallKickUsed: Position | null = null;

  constructor() {
    this.board = createEmptyBoard();
    this.refillBag();
    this.fillNextQueue();
  }

  private refillBag(): void {
    if (this.bag.length === 0) {
      this.bag = createBag();
    }
  }

  private fillNextQueue(): void {
    while (this.nextQueue.length < GAME_CONFIG.nextQueueSize) {
      this.refillBag();
      this.nextQueue.push(this.bag.shift()!);
    }
  }

  private getNextPiece(): TetrominoType {
    const piece = this.nextQueue.shift()!;
    this.fillNextQueue();
    return piece;
  }

  spawnPiece(): boolean {
    const type = this.getNextPiece();
    return this.spawnPieceOfType(type);
  }

  private spawnPieceOfType(type: TetrominoType): boolean {
    const spawnX = Math.floor((BOARD_WIDTH - 4) / 2);
    const spawnY = BOARD_HEIGHT;

    this.currentPiece = {
      type,
      position: { x: spawnX, y: spawnY },
      rotation: 0,
      shape: TETROMINO_SHAPES[type][0],
    };

    this.lockMoveCount = 0;
    this.lastMoveWasRotation = false;
    this.lastWallKickUsed = null;
    this.canHold = true;

    if (!this.isValidPosition(this.currentPiece)) {
      this.isAlive = false;
      return false;
    }

    return true;
  }

  private isValidPosition(piece: Tetromino): boolean {
    for (const block of piece.shape) {
      const x = piece.position.x + block.x;
      const y = piece.position.y + block.y;

      if (x < 0 || x >= BOARD_WIDTH) return false;
      if (y < 0) return false;
      if (y < BOARD_HEIGHT + BOARD_BUFFER_HEIGHT && this.board[y]?.[x] !== null) {
        return false;
      }
    }
    return true;
  }

  private getAbsolutePositions(piece: Tetromino): Position[] {
    return piece.shape.map(block => ({
      x: piece.position.x + block.x,
      y: piece.position.y + block.y,
    }));
  }

  moveLeft(): MoveResult {
    if (!this.currentPiece) return { success: false };

    const newPiece = {
      ...this.currentPiece,
      position: { ...this.currentPiece.position, x: this.currentPiece.position.x - 1 },
    };

    if (this.isValidPosition(newPiece)) {
      this.currentPiece = newPiece;
      this.lastMoveWasRotation = false;
      this.incrementLockMove();
      return { success: true };
    }

    return { success: false };
  }

  moveRight(): MoveResult {
    if (!this.currentPiece) return { success: false };

    const newPiece = {
      ...this.currentPiece,
      position: { ...this.currentPiece.position, x: this.currentPiece.position.x + 1 },
    };

    if (this.isValidPosition(newPiece)) {
      this.currentPiece = newPiece;
      this.lastMoveWasRotation = false;
      this.incrementLockMove();
      return { success: true };
    }

    return { success: false };
  }

  moveDown(): MoveResult {
    if (!this.currentPiece) return { success: false };

    const newPiece = {
      ...this.currentPiece,
      position: { ...this.currentPiece.position, y: this.currentPiece.position.y - 1 },
    };

    if (this.isValidPosition(newPiece)) {
      this.currentPiece = newPiece;
      this.lastMoveWasRotation = false;
      return { success: true };
    }

    return { success: false };
  }

  softDrop(): { success: boolean; cellsDropped: number } {
    let cellsDropped = 0;
    while (this.moveDown().success) {
      cellsDropped++;
    }
    this.score += cellsDropped * SCORE_TABLE.softDropPerCell;
    return { success: cellsDropped > 0, cellsDropped };
  }

  hardDrop(): { cellsDropped: number; lineClearResult: LineClearResult | null } {
    if (!this.currentPiece) return { cellsDropped: 0, lineClearResult: null };

    let cellsDropped = 0;
    while (this.moveDown().success) {
      cellsDropped++;
    }
    this.score += cellsDropped * SCORE_TABLE.hardDropPerCell;

    const lineClearResult = this.lockPiece();
    return { cellsDropped, lineClearResult };
  }

  trySetPiecePosition(x: number, rotation: RotationState): boolean {
    if (!this.currentPiece) return false;

    const type = this.currentPiece.type;
    const newShape = TETROMINO_SHAPES[type][rotation];

    const testPiece: Tetromino = {
      ...this.currentPiece,
      position: { x, y: this.currentPiece.position.y },
      rotation,
      shape: newShape,
    };

    if (this.isValidPosition(testPiece)) {
      this.currentPiece = testPiece;
      return true;
    }

    return false;
  }

  private getWallKicks(
    type: TetrominoType,
    fromRotation: RotationState,
    toRotation: RotationState
  ): Position[] {
    const key = `${fromRotation}->${toRotation}`;
    if (type === 'I') {
      return WALL_KICKS_I[key] || [{ x: 0, y: 0 }];
    }
    if (type === 'O') {
      return [{ x: 0, y: 0 }];
    }
    return WALL_KICKS_JLSTZ[key] || [{ x: 0, y: 0 }];
  }

  rotateCW(): MoveResult {
    if (!this.currentPiece) return { success: false };

    const fromRotation = this.currentPiece.rotation;
    const toRotation = ((fromRotation + 1) % 4) as RotationState;

    return this.tryRotation(toRotation, fromRotation);
  }

  rotateCCW(): MoveResult {
    if (!this.currentPiece) return { success: false };

    const fromRotation = this.currentPiece.rotation;
    const toRotation = ((fromRotation + 3) % 4) as RotationState;

    return this.tryRotation(toRotation, fromRotation);
  }

  rotate180(): MoveResult {
    if (!this.currentPiece) return { success: false };

    const fromRotation = this.currentPiece.rotation;
    const toRotation = ((fromRotation + 2) % 4) as RotationState;

    return this.tryRotation(toRotation, fromRotation);
  }

  private tryRotation(toRotation: RotationState, fromRotation: RotationState): MoveResult {
    if (!this.currentPiece) return { success: false };

    const type = this.currentPiece.type;
    const kicks = this.getWallKicks(type, fromRotation, toRotation);
    const newShape = TETROMINO_SHAPES[type][toRotation];

    for (const kick of kicks) {
      const newPiece: Tetromino = {
        ...this.currentPiece,
        rotation: toRotation,
        shape: newShape,
        position: {
          x: this.currentPiece.position.x + kick.x,
          y: this.currentPiece.position.y + kick.y,
        },
      };

      if (this.isValidPosition(newPiece)) {
        this.currentPiece = newPiece;
        this.lastMoveWasRotation = true;
        this.lastWallKickUsed = kick.x !== 0 || kick.y !== 0 ? kick : null;
        this.incrementLockMove();

        const tSpinResult = this.detectTSpin();

        return {
          success: true,
          wallKickUsed: this.lastWallKickUsed || undefined,
          isTSpin: tSpinResult.isTSpin,
          isTSpinMini: tSpinResult.isTSpinMini,
        };
      }
    }

    return { success: false };
  }

  private detectTSpin(): { isTSpin: boolean; isTSpinMini: boolean } {
    if (!this.currentPiece || this.currentPiece.type !== 'T' || !this.lastMoveWasRotation) {
      return { isTSpin: false, isTSpinMini: false };
    }

    const corners = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
    ];

    let filledCorners = 0;
    const filledPositions: boolean[] = [];

    for (const corner of corners) {
      const x = this.currentPiece.position.x + corner.x;
      const y = this.currentPiece.position.y + corner.y;

      const isFilled =
        x < 0 || x >= BOARD_WIDTH || y < 0 || (y < this.board.length && this.board[y][x] !== null);

      filledPositions.push(isFilled);
      if (isFilled) filledCorners++;
    }

    if (filledCorners < 3) {
      return { isTSpin: false, isTSpinMini: false };
    }

    const frontCorners: number[][] = [
      [0, 1],
      [1, 3],
      [2, 3],
      [0, 2],
    ];

    const rotation = this.currentPiece.rotation;
    const [front1, front2] = frontCorners[rotation];

    if (filledPositions[front1] && filledPositions[front2]) {
      return { isTSpin: true, isTSpinMini: false };
    }

    if (this.lastWallKickUsed && (Math.abs(this.lastWallKickUsed.x) > 1 || Math.abs(this.lastWallKickUsed.y) > 1)) {
      return { isTSpin: true, isTSpinMini: false };
    }

    return { isTSpin: false, isTSpinMini: true };
  }

  private incrementLockMove(): void {
    if (this.isOnGround()) {
      this.lockMoveCount++;
    }
  }

  isOnGround(): boolean {
    if (!this.currentPiece) return false;

    const testPiece = {
      ...this.currentPiece,
      position: { ...this.currentPiece.position, y: this.currentPiece.position.y - 1 },
    };

    return !this.isValidPosition(testPiece);
  }

  shouldLock(): boolean {
    return this.lockMoveCount >= GAME_CONFIG.lockMoves;
  }

  hold(): boolean {
    if (!this.currentPiece || !this.canHold) return false;

    const currentType = this.currentPiece.type;

    if (this.holdPiece) {
      const holdType = this.holdPiece;
      this.holdPiece = currentType;
      this.spawnPieceOfType(holdType);
    } else {
      this.holdPiece = currentType;
      this.spawnPiece();
    }

    this.canHold = false;
    return true;
  }

  lockPiece(): LineClearResult | null {
    if (!this.currentPiece) return null;

    const tSpinResult = this.detectTSpin();

    for (const block of this.currentPiece.shape) {
      const x = this.currentPiece.position.x + block.x;
      const y = this.currentPiece.position.y + block.y;

      if (y >= 0 && y < this.board.length && x >= 0 && x < BOARD_WIDTH) {
        this.board[y][x] = this.currentPiece.type;
      }
    }

    this.currentPiece = null;

    const clearedLines = this.clearLines();
    const result = this.calculateLineClearResult(clearedLines, tSpinResult.isTSpin, tSpinResult.isTSpinMini);

    if (result) {
      this.applyLineClearResult(result);
    }

    return result;
  }

  private clearLines(): number[] {
    const linesToClear: number[] = [];

    for (let y = 0; y < this.board.length; y++) {
      if (this.board[y].every(cell => cell !== null)) {
        linesToClear.push(y);
      }
    }

    for (let i = linesToClear.length - 1; i >= 0; i--) {
      this.board.splice(linesToClear[i], 1);
    }

    while (this.board.length < BOARD_HEIGHT + BOARD_BUFFER_HEIGHT) {
      this.board.push(Array(BOARD_WIDTH).fill(null));
    }

    return linesToClear;
  }

  private calculateLineClearResult(
    clearedLines: number[],
    isTSpin: boolean,
    isTSpinMini: boolean
  ): LineClearResult | null {
    const linesCleared = clearedLines.length;

    if (linesCleared === 0 && !isTSpin && !isTSpinMini) {
      this.combo = -1;
      return null;
    }

    this.combo++;

    const isPerfectClear = this.board.every(row => row.every(cell => cell === null));
    const isTetris = linesCleared === 4;
    const isDifficultClear = isTetris || isTSpin || isTSpinMini;

    let scoreGained = 0;
    let garbageToSend = 0;

    if (isTSpin) {
      if (linesCleared === 0) {
        scoreGained = SCORE_TABLE.tSpin;
      } else if (linesCleared === 1) {
        scoreGained = SCORE_TABLE.tSpinSingle;
        garbageToSend = GARBAGE_TABLE.tSpinSingle;
      } else if (linesCleared === 2) {
        scoreGained = SCORE_TABLE.tSpinDouble;
        garbageToSend = GARBAGE_TABLE.tSpinDouble;
      } else if (linesCleared === 3) {
        scoreGained = SCORE_TABLE.tSpinTriple;
        garbageToSend = GARBAGE_TABLE.tSpinTriple;
      }
    } else if (isTSpinMini) {
      if (linesCleared === 0) {
        scoreGained = SCORE_TABLE.tSpinMini;
      } else if (linesCleared === 1) {
        scoreGained = SCORE_TABLE.tSpinMiniSingle;
        garbageToSend = GARBAGE_TABLE.tSpinMiniSingle;
      }
    } else {
      if (linesCleared === 1) {
        scoreGained = SCORE_TABLE.single;
        garbageToSend = GARBAGE_TABLE.single;
      } else if (linesCleared === 2) {
        scoreGained = SCORE_TABLE.double;
        garbageToSend = GARBAGE_TABLE.double;
      } else if (linesCleared === 3) {
        scoreGained = SCORE_TABLE.triple;
        garbageToSend = GARBAGE_TABLE.triple;
      } else if (linesCleared === 4) {
        scoreGained = SCORE_TABLE.tetris;
        garbageToSend = GARBAGE_TABLE.tetris;
      }
    }

    if (this.backToBack && isDifficultClear && linesCleared > 0) {
      scoreGained = Math.floor(scoreGained * SCORE_TABLE.backToBackMultiplier);
      garbageToSend += GARBAGE_TABLE.backToBackBonus;
    }

    if (linesCleared > 0) {
      this.backToBack = isDifficultClear;
    }

    const comboIndex = Math.min(this.combo, GARBAGE_TABLE.comboTable.length - 1);
    garbageToSend += GARBAGE_TABLE.comboTable[comboIndex];
    scoreGained += this.combo * SCORE_TABLE.comboBonus;

    if (isPerfectClear) {
      scoreGained += SCORE_TABLE.perfectClear;
      garbageToSend = GARBAGE_TABLE.perfectClear;
    }

    scoreGained *= this.level;

    return {
      linesCleared,
      isTetris,
      isTSpin,
      isTSpinMini,
      isPerfectClear,
      garbageToSend,
      scoreGained,
    };
  }

  private applyLineClearResult(result: LineClearResult): void {
    this.score += result.scoreGained;
    this.linesCleared += result.linesCleared;
    this.level = Math.floor(this.linesCleared / 10) + 1;
  }

  addGarbage(lines: number): void {
    this.pendingGarbage += lines;
  }

  receiveGarbage(): boolean {
    if (this.pendingGarbage === 0) return true;

    const garbageToAdd = this.pendingGarbage;
    this.pendingGarbage = 0;

    const holePosition = Math.floor(Math.random() * BOARD_WIDTH);

    for (let i = 0; i < garbageToAdd; i++) {
      this.board.pop();

      const garbageLine: Cell[] = Array(BOARD_WIDTH).fill('Z' as TetrominoType);
      garbageLine[holePosition] = null;
      this.board.unshift(garbageLine);
    }

    for (let y = BOARD_HEIGHT; y < this.board.length; y++) {
      if (this.board[y].some(cell => cell !== null)) {
        this.isAlive = false;
        return false;
      }
    }

    return true;
  }

  cancelGarbage(amount: number): number {
    const cancelled = Math.min(amount, this.pendingGarbage);
    this.pendingGarbage -= cancelled;
    return amount - cancelled;
  }

  getGhostPosition(): Position | null {
    if (!this.currentPiece) return null;

    let ghostY = this.currentPiece.position.y;

    while (true) {
      const testPiece = {
        ...this.currentPiece,
        position: { ...this.currentPiece.position, y: ghostY - 1 },
      };

      if (!this.isValidPosition(testPiece)) break;
      ghostY--;
    }

    return { x: this.currentPiece.position.x, y: ghostY };
  }

  getState() {
    return {
      board: cloneBoard(this.board),
      currentPiece: this.currentPiece ? { ...this.currentPiece } : null,
      holdPiece: this.holdPiece,
      canHold: this.canHold,
      nextPieces: [...this.nextQueue],
      score: this.score,
      level: this.level,
      linesCleared: this.linesCleared,
      combo: this.combo,
      backToBack: this.backToBack,
      isAlive: this.isAlive,
      pendingGarbage: this.pendingGarbage,
      ghostPosition: this.getGhostPosition(),
    };
  }

  getGravity(): number {
    const gravity = GAME_CONFIG.baseGravity + (this.level - 1) * GAME_CONFIG.gravityIncrease;
    return Math.min(gravity, GAME_CONFIG.maxGravity);
  }

  isGameOver(): boolean {
    return !this.isAlive;
  }
}
