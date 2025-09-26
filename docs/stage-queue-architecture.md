# RNGMUD Stage Queue Architecture

## 1. Core Concepts

- **Stage**  
  - 필드: `message`, `tone`, `tags`, `delay`, `execute`  
  - `createStage({...})` 헬퍼로 생성하며, `execute` 에서 후속 Stage 또는 Stage 배열을 반환하면 자동으로 큐에 이어 붙는다.

- **Log Entry**  
  - `createLogEntry` 로 Stage와 동기화된 로그 객체 생성  
  - `processLogQueue` 실행 시 Stage의 메시지가 로그에 남고, `execute` 가 로직을 수행한다.

- **Battle Context Snapshot**  
  - `createBattleContext(state)`  
  - Stage 실행 시점에 플레이어/적/스테이지/보상/턴/버튼 상태를 캡처하여 `execute` 로 전달한다.

## 2. Queue Processing Flow

1. **enqueueStage / enqueueStages**  
   - Stage를 큐에 push  
   - 로그 지연(`delay`)이 0보다 크면 `AsyncUtils.delay` 후 처리  
   - Stage 실행 완료 시 반환된 Stage들을 다시 `enqueueStages` 로 이어 붙인다.

2. **Mirror State (`mirrorState`)**  
   - React 외부에서도 최신 상태를 즉시 참조할 수 있도록 reducer 결과를 동시에 반영  
   - `dispatchAndSync(action)`이 reducer(`gameReducer`)와 React dispatch를 동시에 호출하여 중복 큐잉을 방지한다.

3. **processLogQueue**  
   - 큐 헤드를 dequeue → 로그 작성 → `execute` 실행  
   - `enemyAttack` 태그가 있으면 `TRIGGER_PLAYER_HURT` 처리  
   - Stage가 반환하는 후속 Stage 배열을 즉시 enqueue  
   - 큐가 남아 있으면 스케줄러가 다시 호출한다.

## 3. Battle Stage Pipeline

```mermaid
flowchart TD
    A[performAction (phase:BATTLE)] -->|TURN_STATUS=RESOLVING| B[buildBattleStages(context)]
    B --> C[Player Attack Stage]
    C -->|execute| D{Enemy HP <= 0?}
    D -->|Yes| E[createEnemyDefeatStages]
    D -->|No| F[Enemy Counter Stage]
    F -->|execute| G{Player HP <= 0?}
    G -->|Yes| H[createPlayerDefeatStages]
    G -->|No| I[TURN_STATUS READY, 버튼 활성화]
    E --> J{Stage Cleared?}
    J -->|Yes| K[층 이동 Stage]
    J -->|No| L[탐험 준비 Stage]
    E --> M{Level Up?}
    M -->|Yes| N[보상 선택 Stage]
    M -->|No| L
```

### 주요 Stage 빌더
- `buildBattleStages(context)`
  - 플레이어 공격 메시지 Stage
  - 후속으로 `createEnemyDefeatStages` 또는 `createEnemyCounterStages` 반환
- `createEnemyCounterStages({ context, enemyRoll })`
  - 반격 Stage → 피해 적용 → 패배 시 `createPlayerDefeatStages` 반환
  - 생존 시 `TURN_STATUS READY`, 버튼 활성화
- `createEnemyDefeatStages({ context, enemy })`
  - 전투 종료 Stage → 경험치 → (레벨업 메시지) → (층 이동 Stage) → 보상/탐험 Stage
- `createPlayerDefeatStages({ context, enemyRoll })`
  - 패배 로그 → `GAME_OVER` 전환 Stage → READY 복귀 Stage

## 4. Reward Handling

- `selectReward(rewardId)`
  - 보상 선택 시 `TURN_STATUS RESOLVING`
  - `applyRewardEffect(reward, snapshot)` → Stage 배열 반환
    - 각 보상 타입별 Stage (능력치/회복/HP/보호막/EXP)
    - EXP 보상은 레벨업 Stage 및 추가 보상 Stage도 포함
  - 추가 보상이 없으면 탐험 복귀 Stage 추가

## 5. Action Flow Guards

- `performAction`
  - 조건: `actionButton.disabled === false`, `TURN_STATUS === READY`, `battle.queue.length === 0`
  - 페이즈별 분기:
    - `EXPLORE` → `startNextBattle`
    - `BATTLE` → `buildBattleStages`
    - `REWARD` → "먼저 보상을 선택" Stage
    - `GAME_OVER` → `initialize`
- `startNextBattle`
  - 적 생성 → `phase=BATTLE`, `TURN_STATUS READY`, 버튼 ‘공격’ 활성화
  - 등장 Stage enqueue

## 6. Initialization & Game Loop

1. `initialize()`  
   - 초기 상태 및 버튼 설정  
   - 첫 안내 Stage enqueue

2. 플레이어 입력 → `performAction`  
3. Stage 큐 처리 → 로그 출력 + 상태 전환  
4. 큐가 비고 `TURN_STATUS READY`가 되면 다음 입력을 받는다.

## 7. Key State Transitions

- `TURN_STATUS`
  - `READY` → 입력 가능
  - `RESOLVING` → 전투/보상 처리 중
  - `FINISHED` → 전투 종료 직후
- `GAME_PHASES`
  - `EXPLORE` ↔ `BATTLE` ↔ `REWARD` ↔ `GAME_OVER`
- Action Button 라벨
  - 탐험: `다음 전투`
  - 전투: `공격`
  - 보상: `강화 선택 중` (비활성)
  - 패배: `다시 시작`

## 8. Error & Logging

- `DEBUG` 플래그로 Action 레벨 로그 제어
- Stage 실행 중 오류 발생 시 `console.error` 로 보고하고 후속 Stage 중단 방지
- 잘못된 Stage enqueue 시 guard

---

이 문서를 기반으로 다음 기획을 진행하실 때, Stage 빌드 포인트(공격/반격/처치/패배/보상)에 새로운 Stage 생성 함수를 추가하거나 기존 Stage에 로직을 확장하면 됩니다.
