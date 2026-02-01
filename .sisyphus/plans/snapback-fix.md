# Snapback Bug Fix - Client-Side Prediction Enhancement

## TL;DR

> **Quick Summary**: Fix visual snapback bug by removing destructive `clearPendingActions()` calls and adding local rotation/hardDrop prediction with proper reconciliation.
> 
> **Deliverables**:
> - Modified `useLocalPrediction.ts` with rotation and hardDrop prediction
> - Enhanced `gameStore.ts` reconciliation with rotation state handling
> - Zero visual snapback during normal gameplay
> 
> **Estimated Effort**: Medium (4-6 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 3 → Task 5

---

## Context

### Original Request
Fix the "snapback" bug in multiplayer 3D Tetris where pieces visually jump back to old positions. Root cause: `clearPendingActions()` is called on rotate/hardDrop/hold actions, destroying pending movement predictions.

### Interview Summary
**Key Discussions**:
- **hardDrop prediction**: Ghost position only - don't predict locking/spawning
- **hold prediction**: No local prediction - let server handle, just don't destroy pending movements
- **reconciliation depth**: Simple extension - add rotation to existing merge logic
- **test strategy**: Playwright QA, no unit tests

**Research Findings**:
- Wall kick data (WALL_KICKS_JLSTZ, WALL_KICKS_I) already exported from shared
- TETROMINO_SHAPES provides rotation shapes for all pieces
- TetrisEngine.tryRotation() shows exact server-side wall kick algorithm
- Current reconciliation uses 200ms TTL for pending actions

### Self-Review Gap Analysis
**Identified Gaps** (addressed in plan):
1. **Rotation failure handling**: Must return false and not modify state if all wall kicks fail
2. **Rotation state divergence**: Trust server rotation but preserve local position offset
3. **Action type tracking**: Track both action type and expected state changes for better reconciliation
4. **hardDrop input blocking**: After hardDrop, ignore further inputs until server confirms piece change

---

## Work Objectives

### Core Objective
Eliminate visual snapback by properly managing client-side predictions for all action types while maintaining server authority.

### Concrete Deliverables
- `client/src/hooks/useLocalPrediction.ts` - Local rotation and hardDrop prediction
- `client/src/store/gameStore.ts` - Enhanced reconciliation with rotation handling

### Definition of Done
- [ ] No visual snapback occurs during gameplay with typical network latency (50-200ms)
- [ ] Rotation predictions match server outcomes with wall kicks
- [ ] hardDrop instantly shows piece at ghost position
- [ ] Hold action doesn't break pending movement predictions
- [ ] Client maintains 60 FPS responsiveness

### Must Have
- Remove `clearPendingActions()` from rotate/hardDrop/hold cases
- Local rotation prediction with SRS wall kicks matching server logic exactly
- Local hardDrop prediction to ghost position
- Rotation state included in reconciliation merge logic
- Piece type mismatch detection remains for cleanup

### Must NOT Have (Guardrails)
- **NO server-side changes** - constraint from requirements
- **NO local hold prediction** - too complex, decided to let server handle
- **NO piece locking/spawn prediction** - hardDrop only predicts position change
- **NO full delta-based reconciliation** - keep merge logic simple
- **NO AI-slop patterns**:
  - Don't add unnecessary abstraction layers
  - Don't create new utility files for simple operations
  - Don't add excessive logging/debugging code
  - Don't over-engineer the pending action structure

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only (Playwright QA)
- **Framework**: N/A

### Automated Verification (Playwright Browser)

Each task includes browser-based verification procedures executable by agent:

**Evidence Requirements:**
- Screenshots saved to `.sisyphus/evidence/`
- Console output captured for timing verification
- Visual confirmation of no snapback

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Remove clearPendingActions calls [no dependencies]
└── Task 2: Add rotation helper functions [no dependencies]

Wave 2 (After Wave 1):
├── Task 3: Implement local rotation prediction [depends: 1, 2]
└── Task 4: Implement local hardDrop prediction [depends: 1]

Wave 3 (After Wave 2):
├── Task 5: Enhance reconciliation logic [depends: 3, 4]
└── Task 6: Playwright QA verification [depends: 5]

Critical Path: Task 1 → Task 3 → Task 5 → Task 6
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 5 | 4 |
| 4 | 1 | 5 | 3 |
| 5 | 3, 4 | 6 | None |
| 6 | 5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Dispatch |
|------|-------|---------------------|
| 1 | 1, 2 | Two parallel agents with `run_in_background=true` |
| 2 | 3, 4 | Two parallel agents after Wave 1 completes |
| 3 | 5, 6 | Sequential after Wave 2 |

---

## TODOs

- [ ] 1. Remove clearPendingActions calls from rotate/hardDrop/hold

  **What to do**:
  - In `useLocalPrediction.ts`, remove the `clearPendingActions()` call from the rotate/hardDrop/hold case block (lines 43-49)
  - Keep the `return true` for now (will be enhanced in Task 3 and 4)
  - The case block should become a passthrough that just returns true without side effects

  **Must NOT do**:
  - Don't remove the entire switch case - we need the structure for Task 3/4
  - Don't modify the movement cases (moveLeft, moveRight, softDrop, moveDown)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple removal of one function call, minimal context needed
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not a UI task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `client/src/hooks/useLocalPrediction.ts:43-49` - The problematic code block to modify

  **API/Type References**:
  - `shared/src/index.ts:228-237` - GameAction type definition showing all action types

  **WHY Each Reference Matters**:
  - The first reference shows exactly where clearPendingActions is called incorrectly
  - The type reference shows what actions exist to understand the case structure

  **Acceptance Criteria**:

  **Automated Verification (Bash)**:
  ```bash
  # Agent runs:
  grep -n "clearPendingActions" client/src/hooks/useLocalPrediction.ts
  # Assert: No matches found (exit code 1 means no match, which is SUCCESS)
  # Note: grep returns exit code 1 when no match, use `! grep` or check output is empty
  
  # Verify file still compiles:
  cd client && npx tsc --noEmit src/hooks/useLocalPrediction.ts
  # Assert: Exit code 0, no TypeScript errors
  ```

  **Evidence to Capture:**
  - [ ] Terminal output showing grep returns no matches
  - [ ] TypeScript compilation succeeds

  **Commit**: YES
  - Message: `fix(prediction): remove destructive clearPendingActions from rotate/hardDrop/hold`
  - Files: `client/src/hooks/useLocalPrediction.ts`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 2. Add rotation helper functions with wall kick logic

  **What to do**:
  - In `useLocalPrediction.ts`, add helper functions that mirror server's wall kick logic:
    1. `getWallKicks(type, fromRotation, toRotation)` - returns wall kick offsets
    2. `tryRotation(board, piece, toRotation)` - attempts rotation with wall kicks
    3. `canPlacePiece(board, piece)` - checks if piece position is valid
  - Import wall kick data from shared: `WALL_KICKS_JLSTZ`, `WALL_KICKS_I`, `TETROMINO_SHAPES`
  - Logic must be IDENTICAL to server's `TetrisEngine.tryRotation()` to ensure client/server match

  **Must NOT do**:
  - Don't create a separate utility file - keep it in useLocalPrediction.ts
  - Don't deviate from server's wall kick algorithm
  - Don't add T-spin detection (not needed for prediction, only for scoring)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Requires understanding and replicating precise game logic
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Pure logic, no UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `shared/src/game/TetrisEngine.ts:192-270` - Server's wall kick implementation to replicate
  - `shared/src/game/TetrisEngine.ts:96-108` - `isValidPosition()` logic to replicate as `canPlacePiece()`

  **API/Type References**:
  - `shared/src/index.ts:100-121` - WALL_KICKS_JLSTZ and WALL_KICKS_I data structures
  - `shared/src/index.ts:47-94` - TETROMINO_SHAPES for rotation shapes
  - `shared/src/index.ts:22-30` - RotationState and Tetromino types

  **WHY Each Reference Matters**:
  - TetrisEngine.ts:192-270 is the SOURCE OF TRUTH - our client logic must match exactly
  - Wall kick data must be imported from shared to ensure consistency
  - TETROMINO_SHAPES provides the rotated shape arrays indexed by rotation state

  **Acceptance Criteria**:

  **Automated Verification (Bash)**:
  ```bash
  # Agent runs - verify imports exist:
  grep -E "WALL_KICKS_JLSTZ|WALL_KICKS_I|TETROMINO_SHAPES" client/src/hooks/useLocalPrediction.ts
  # Assert: All three are found in imports
  
  # Agent runs - verify helper functions exist:
  grep -E "function (getWallKicks|tryRotation|canPlacePiece)" client/src/hooks/useLocalPrediction.ts
  # Assert: All three functions are defined
  
  # Verify TypeScript compilation:
  cd client && npx tsc --noEmit src/hooks/useLocalPrediction.ts
  # Assert: Exit code 0
  ```

  **Evidence to Capture:**
  - [ ] Grep output showing imports
  - [ ] Grep output showing function definitions
  - [ ] TypeScript compilation succeeds

  **Commit**: YES
  - Message: `feat(prediction): add wall kick rotation helpers mirroring server logic`
  - Files: `client/src/hooks/useLocalPrediction.ts`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 3. Implement local rotation prediction in useLocalPrediction

  **What to do**:
  - In the rotateCW/rotateCCW/rotate180 switch cases, implement local prediction:
    1. Calculate target rotation: CW = (current + 1) % 4, CCW = (current + 3) % 4, 180 = (current + 2) % 4
    2. Call `tryRotation()` helper from Task 2
    3. If successful: update local state with new rotation and position (from wall kick), add to pending actions
    4. If failed (all wall kicks rejected): return false, don't modify state, don't add pending action
  - Add rotation actions to pending action tracking

  **Must NOT do**:
  - Don't call clearPendingActions (removed in Task 1)
  - Don't predict T-spin detection
  - Don't modify board state

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex state management with wall kick logic integration
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Logic task, not UI

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Wave 1)
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `client/src/hooks/useLocalPrediction.ts:23-42` - Existing movement prediction pattern to follow
  - `shared/src/game/TetrisEngine.ts:207-232` - Server's rotateCW/CCW/180 methods showing rotation calculation

  **API/Type References**:
  - `shared/src/index.ts:22-23` - RotationState type (0 | 1 | 2 | 3)
  - `client/src/store/gameStore.ts:153-157` - addPendingAction() usage pattern

  **WHY Each Reference Matters**:
  - Existing movement prediction shows the exact pattern: check validity → update state → add pending action
  - Server rotation methods show the modular arithmetic for rotation state transitions
  - addPendingAction integration ensures consistency with existing codebase

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173 (or dev server URL)
  2. Start a game (join/create room, wait for game start)
  3. Wait for piece to spawn
  4. Press: 'ArrowUp' or 'x' key (rotateCW)
  5. Assert: Piece visually rotates immediately (no delay)
  6. Wait: 200ms
  7. Assert: Piece does NOT snap back to previous rotation
  8. Screenshot: .sisyphus/evidence/task-3-rotation-prediction.png
  ```

  **Additional Verification (Bash)**:
  ```bash
  # Verify rotation cases have prediction logic:
  grep -A 10 "case 'rotateCW'" client/src/hooks/useLocalPrediction.ts | grep -E "tryRotation|addPendingAction"
  # Assert: Both tryRotation and addPendingAction are called
  
  cd client && npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing rotated piece
  - [ ] Terminal output from grep verification
  - [ ] TypeScript compilation succeeds

  **Commit**: YES
  - Message: `feat(prediction): implement local rotation prediction with wall kicks`
  - Files: `client/src/hooks/useLocalPrediction.ts`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 4. Implement local hardDrop prediction

  **What to do**:
  - In the hardDrop switch case, implement local prediction:
    1. Calculate ghost position (lowest valid Y for current piece)
    2. Update local piece position to ghost Y
    3. Add hardDrop to pending actions
    4. Do NOT predict piece locking or new piece spawning (server handles)
  - Reuse/adapt the ghost position logic (similar to `canMove` checking downward)

  **Must NOT do**:
  - Don't call clearPendingActions (removed in Task 1)
  - Don't predict piece locking (board modification)
  - Don't predict next piece spawning
  - Don't modify score

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simpler than rotation - just find lowest valid Y
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Logic task, not UI

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Wave 1)
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `shared/src/game/TetrisEngine.ts:538-554` - `getGhostPosition()` algorithm to replicate
  - `client/src/hooks/useLocalPrediction.ts:76-88` - Existing `canMove()` function to reuse

  **API/Type References**:
  - `shared/src/index.ts:10-13` - Position type

  **WHY Each Reference Matters**:
  - TetrisEngine.getGhostPosition() shows the algorithm: decrement Y while valid, return last valid
  - canMove already exists in the file - can be used to check downward movement validity

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173
  2. Start a game
  3. Wait for piece to spawn
  4. Move piece left/right to clear position
  5. Press: 'Space' (hardDrop)
  6. Assert: Piece INSTANTLY appears at bottom (ghost position)
  7. Assert: No visible "falling" animation - instant teleport
  8. Screenshot: .sisyphus/evidence/task-4-harddrop-prediction.png
  ```

  **Additional Verification (Bash)**:
  ```bash
  # Verify hardDrop case has prediction logic:
  grep -A 15 "case 'hardDrop'" client/src/hooks/useLocalPrediction.ts | grep -E "while|position|addPendingAction"
  # Assert: Loop logic and addPendingAction are present
  
  cd client && npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Evidence to Capture:**
  - [ ] Screenshot showing piece at ghost position
  - [ ] Terminal output from grep verification
  - [ ] TypeScript compilation succeeds

  **Commit**: YES
  - Message: `feat(prediction): implement local hardDrop prediction to ghost position`
  - Files: `client/src/hooks/useLocalPrediction.ts`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 5. Enhance setGameStateFromServer reconciliation for rotation

  **What to do**:
  - In `gameStore.ts` `setGameStateFromServer()`, enhance the merge logic:
    1. Track pending rotation actions (not just movements)
    2. If pending rotation actions exist and piece types match:
       - Trust local rotation state
       - Trust local X position (existing logic)
       - Use min(localY, serverY) for Y (existing logic)
    3. If server rotation differs AND no pending rotation actions:
       - Accept server rotation but preserve local X offset from pending movements
  - Consider adding action type tracking to `PendingAction` interface if needed

  **Must NOT do**:
  - Don't implement full delta-based reconciliation
  - Don't remove piece type mismatch detection (it's the cleanup mechanism)
  - Don't add complex state tracking

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Subtle state reconciliation logic, must not break existing behavior
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: State management, not UI

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `client/src/store/gameStore.ts:104-150` - Current `setGameStateFromServer()` implementation
  - `client/src/store/gameStore.ts:131-137` - Current merge logic for position

  **API/Type References**:
  - `client/src/store/gameStore.ts:13-16` - PendingAction interface (may need enhancement)
  - `shared/src/index.ts:228-237` - GameAction types to check for rotation actions

  **WHY Each Reference Matters**:
  - setGameStateFromServer:104-150 is the exact code to modify
  - Current merge logic shows the pattern: trust local if pending, else trust server
  - PendingAction interface may need action type for filtering rotation vs movement

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173
  2. Start a game
  3. Rapidly input: Left, Left, RotateCW, Left, RotateCCW (in quick succession)
  4. Wait: 500ms for server updates
  5. Assert: Piece position is smooth, NO snapback visible
  6. Assert: Rotation state is correct (matches visual)
  7. Screenshot: .sisyphus/evidence/task-5-reconciliation.png
  ```

  **Additional Verification (Bash)**:
  ```bash
  # Verify rotation is handled in reconciliation:
  grep -E "rotation|rotateCW|rotateCCW" client/src/store/gameStore.ts | head -10
  # Assert: Rotation-related logic exists in setGameStateFromServer
  
  cd client && npx tsc --noEmit
  # Assert: Exit code 0
  ```

  **Evidence to Capture:**
  - [ ] Screenshot after rapid inputs
  - [ ] Terminal output showing rotation handling
  - [ ] TypeScript compilation succeeds

  **Commit**: YES
  - Message: `fix(reconciliation): add rotation state handling to server state merge`
  - Files: `client/src/store/gameStore.ts`
  - Pre-commit: `cd client && npx tsc --noEmit`

---

- [ ] 6. Playwright QA: Full integration verification

  **What to do**:
  - Run comprehensive Playwright-based QA scenarios:
    1. **Basic rotation**: Rotate piece, verify no snapback
    2. **Wall kick scenario**: Rotate near wall, verify kick happens correctly
    3. **hardDrop**: Drop piece, verify instant position change
    4. **hold + movement**: Use hold, then move, verify movements aren't lost
    5. **Rapid inputs**: Spam inputs quickly, verify smooth gameplay
    6. **Latency simulation**: If possible, add artificial delay to test reconciliation
  - Document any remaining issues found

  **Must NOT do**:
  - Don't skip any scenario
  - Don't mark as passing if ANY snapback is observed

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Browser automation and visual verification
  - **Skills**: [`playwright`]
    - `playwright`: Required for browser automation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final, sequential)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - Previous task Playwright verification sections - follow same patterns

  **Documentation References**:
  - Game controls: Arrow keys for movement, Up/X for rotateCW, Z for rotateCCW, A for rotate180, Space for hardDrop, C for hold

  **WHY Each Reference Matters**:
  - Need to know game controls to automate testing
  - Previous Playwright sections establish the verification pattern

  **Acceptance Criteria**:

  **Automated Verification (Playwright browser)**:
  ```
  # Agent executes full test suite via playwright browser automation:
  
  # Scenario 1: Basic Rotation
  1. Start game, wait for piece
  2. Press RotateCW 4 times
  3. Assert: Piece returns to original rotation, no snapback
  4. Screenshot: .sisyphus/evidence/qa-rotation.png
  
  # Scenario 2: Wall Kick
  1. Move piece to left wall
  2. Rotate into wall
  3. Assert: Piece kicks away from wall (doesn't overlap)
  4. Screenshot: .sisyphus/evidence/qa-wallkick.png
  
  # Scenario 3: HardDrop
  1. Spawn new piece
  2. Press Space
  3. Assert: Piece instantly at bottom
  4. Screenshot: .sisyphus/evidence/qa-harddrop.png
  
  # Scenario 4: Hold + Movement
  1. Spawn piece, move left twice
  2. Press Hold (C)
  3. Move new piece right
  4. Assert: No position snapback on held or new piece
  5. Screenshot: .sisyphus/evidence/qa-hold.png
  
  # Scenario 5: Rapid Inputs
  1. Rapidly press: Left, Left, RotateCW, Right, HardDrop (within 200ms total)
  2. Assert: All inputs respected, no visual glitch
  3. Screenshot: .sisyphus/evidence/qa-rapid.png
  ```

  **Evidence to Capture:**
  - [ ] All 5 screenshots in .sisyphus/evidence/
  - [ ] Written summary of pass/fail for each scenario

  **Commit**: NO (QA task, no code changes)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(prediction): remove destructive clearPendingActions from rotate/hardDrop/hold` | useLocalPrediction.ts | `tsc --noEmit` |
| 2 | `feat(prediction): add wall kick rotation helpers mirroring server logic` | useLocalPrediction.ts | `tsc --noEmit` |
| 3 | `feat(prediction): implement local rotation prediction with wall kicks` | useLocalPrediction.ts | `tsc --noEmit` |
| 4 | `feat(prediction): implement local hardDrop prediction to ghost position` | useLocalPrediction.ts | `tsc --noEmit` |
| 5 | `fix(reconciliation): add rotation state handling to server state merge` | gameStore.ts | `tsc --noEmit` |
| 6 | N/A (QA only) | N/A | Playwright tests |

---

## Success Criteria

### Verification Commands
```bash
# Build verification
cd client && npm run build  # Should complete without errors

# Type checking
cd client && npx tsc --noEmit  # Should pass with no errors
```

### Final Checklist
- [ ] All "Must Have" present:
  - [ ] clearPendingActions removed from rotate/hardDrop/hold
  - [ ] Local rotation prediction with wall kicks
  - [ ] Local hardDrop prediction to ghost position
  - [ ] Rotation in reconciliation merge logic
  - [ ] Piece type mismatch detection preserved
- [ ] All "Must NOT Have" absent:
  - [ ] No server-side changes
  - [ ] No local hold prediction
  - [ ] No piece locking/spawn prediction
  - [ ] No over-engineered abstractions
- [ ] All Playwright QA scenarios pass
- [ ] No visual snapback in any tested scenario
