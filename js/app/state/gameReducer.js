export const GAME_PHASES = {
    INIT: 'INIT',
    EXPLORE: 'EXPLORE',
    BATTLE: 'BATTLE',
    REWARD: 'REWARD',
    GAME_OVER: 'GAME_OVER'
};

export const TURN_STATUS = {
    IDLE: 'IDLE',
    READY: 'READY',
    RESOLVING: 'RESOLVING',
    FINISHED: 'FINISHED'
};

export const ACTION_TYPES = {
    INITIALIZE: 'INITIALIZE',
    SET_PHASE: 'SET_PHASE',
    SET_STAGE: 'SET_STAGE',
    UPDATE_PROGRESS: 'UPDATE_PROGRESS',
    SET_ACTION_BUTTON: 'SET_ACTION_BUTTON',
    UPDATE_PLAYER: 'UPDATE_PLAYER',
    SET_ENEMY: 'SET_ENEMY',
    UPDATE_ENEMY: 'UPDATE_ENEMY',
    ENQUEUE_LOG_ENTRY: 'ENQUEUE_LOG_ENTRY',
    DEQUEUE_LOG_ENTRY: 'DEQUEUE_LOG_ENTRY',
    SET_QUEUE_PROCESSING: 'SET_QUEUE_PROCESSING',
    INCREMENT_PENDING_LOGS: 'INCREMENT_PENDING_LOGS',
    DECREMENT_PENDING_LOGS: 'DECREMENT_PENDING_LOGS',
    RESET_PENDING_LOGS: 'RESET_PENDING_LOGS',
    SET_TURN_STATUS: 'SET_TURN_STATUS',
    SET_REWARD_STATE: 'SET_REWARD_STATE',
    TRIGGER_PLAYER_HURT: 'TRIGGER_PLAYER_HURT'
};

export function createInitialState() {
    return {
        phase: GAME_PHASES.INIT,
        stage: {
            level: 1,
            encountersCleared: 0,
            encountersPerStage: 10
        },
        player: null,
        battle: {
            enemy: null,
            queue: [],
            pendingLogs: 0,
            isProcessingQueue: false,
            turnStatus: TURN_STATUS.READY
        },
        reward: {
            open: false,
            options: [],
            reason: null
        },
        logs: [],
        actionButton: {
            label: '?ㅼ쓬 ?꾪닾',
            disabled: false
        },
        ui: {
            playerHurtToken: 0
        }
    };
}

function updateStage(state, updates) {
    return { ...state.stage, ...updates };
}

function updateBattle(state, updates) {
    return { ...state.battle, ...updates };
}

function updateReward(state, updates) {
    return { ...state.reward, ...updates };
}

export function gameReducer(state, action) {
    switch (action.type) {
        case ACTION_TYPES.INITIALIZE:
            return { ...state, ...action.payload };
        case ACTION_TYPES.SET_PHASE:
            return { ...state, phase: action.payload };
        case ACTION_TYPES.SET_STAGE:
            return { ...state, stage: updateStage(state, action.payload) };
        case ACTION_TYPES.UPDATE_PROGRESS:
            return { ...state, stage: updateStage(state, { encountersCleared: action.payload }) };
        case ACTION_TYPES.SET_ACTION_BUTTON:
            return { ...state, actionButton: { ...state.actionButton, ...action.payload } };
        case ACTION_TYPES.UPDATE_PLAYER:
            console.log('[gameReducer] UPDATE_PLAYER', action.payload);
            return { ...state, player: { ...state.player, ...action.payload } };
        case ACTION_TYPES.SET_ENEMY:
            return { ...state, battle: updateBattle(state, { enemy: action.payload }) };
        case ACTION_TYPES.UPDATE_ENEMY:
            return {
                ...state,
                battle: updateBattle(state, {
                    enemy: state.battle.enemy ? { ...state.battle.enemy, ...action.payload } : action.payload
                })
            };
        case ACTION_TYPES.ENQUEUE_LOG_ENTRY:
            return {
                ...state,
                battle: updateBattle(state, {
                    queue: [...state.battle.queue, action.payload]
                })
            };
        case ACTION_TYPES.DEQUEUE_LOG_ENTRY: {
            if (state.battle.queue.length === 0) {
                return state;
            }
            const [nextItem, ...rest] = state.battle.queue;
            return {
                ...state,
                battle: updateBattle(state, { queue: rest }),
                logs: [...state.logs, nextItem.entry]
            };
        }
        case ACTION_TYPES.SET_QUEUE_PROCESSING:
            return { ...state, battle: updateBattle(state, { isProcessingQueue: action.payload }) };
        case ACTION_TYPES.SET_TURN_STATUS:
            return { ...state, battle: updateBattle(state, { turnStatus: action.payload }) };
        case ACTION_TYPES.INCREMENT_PENDING_LOGS:
            return {
                ...state,
                battle: updateBattle(state, { pendingLogs: state.battle.pendingLogs + 1 })
            };
        case ACTION_TYPES.DECREMENT_PENDING_LOGS:
            return {
                ...state,
                battle: updateBattle(state, { pendingLogs: Math.max(0, state.battle.pendingLogs - 1) })
            };
        case ACTION_TYPES.RESET_PENDING_LOGS:
            return { ...state, battle: updateBattle(state, { pendingLogs: 0 }) };
        case ACTION_TYPES.SET_REWARD_STATE:
            return { ...state, reward: updateReward(state, action.payload) };
        case ACTION_TYPES.TRIGGER_PLAYER_HURT:
            return { ...state, ui: { ...state.ui, playerHurtToken: state.ui.playerHurtToken + 1 } };
        default:
            console.warn('Unknown action type', action.type);
            return state;
    }
}





