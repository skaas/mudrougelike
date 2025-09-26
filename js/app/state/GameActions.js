import { ACTION_TYPES, GAME_PHASES, TURN_STATUS, gameReducer } from './gameReducer.js';
import { createPlayerTemplate } from '../utils/playerFactory.js';
import { createEnemyTemplate } from '../utils/enemyFactory.js';
import { rollDamage, applyDamageToPlayer } from '../utils/combat.js';
import { pickRewards, findRewardById } from '../utils/rewardFactory.js';
import { grantExperience } from '../utils/experience.js';
import { AsyncUtils } from '../../utils/AsyncUtils.js';

const DEFAULT_LOG_DELAY = 300;
const START_MESSAGE = 'A new adventure begins. Brace yourself for battle!';
const BUTTON_LABEL_ATTACK = 'Attack';
const BUTTON_LABEL_NEXT = 'Next Battle';
const BUTTON_LABEL_RESTART = 'Restart';

const debugLog = (...args) => {
    if (typeof console !== 'undefined') {
        console.debug('[GameActions]', ...args);
    }
};

const ensureArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const createLogEntry = (message, tone = 'narrative', tags = {}) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    message,
    tone,
    tags,
    timestamp: Date.now()
});

const createStage = ({ message, tone = 'narrative', tags = {}, delay = DEFAULT_LOG_DELAY, execute = () => null }) => ({
    message,
    tone,
    tags,
    delay,
    execute
});

const createBattleContext = (state) => ({
    player: state.player ? { ...state.player } : null,
    enemy: state.battle.enemy ? { ...state.battle.enemy } : null,
    stage: { ...state.stage },
    reward: { ...state.reward },
    phase: state.phase,
    turnStatus: state.battle.turnStatus,
    actionButton: { ...state.actionButton }
});

const buildPlayerAttackMessage = (player, roll) => {
    const name = player?.name ?? 'Hero';
    let message = `${name} strikes for ${roll.damage} damage!`;
    if (roll.isCritical) {
        message += ' (Critical hit!)';
    }
    return message;
};

const buildEnemyAttackMessage = (enemy, roll) => {
    const name = enemy?.name ?? 'Enemy';
    let message = `${name} attacks for ${roll.damage} damage!`;
    if (roll.isCritical) {
        message += ' (Critical hit!)';
    }
    return message;
};

const statLabel = (statKey) => {
    switch (statKey) {
        case 'attack':
            return 'Attack';
        case 'luck':
            return 'Luck';
        case 'thornsCoeff':
            return 'Thorns';
        default:
            return statKey;
    }
}

export function createGameActions(getState, dispatch) {
    let isProcessingLogs = false;
    let processScheduled = false;
    let mirrorState = getState();

    const getLatestState = () => mirrorState;
    const dispatchAndSync = (action) => {
        mirrorState = gameReducer(mirrorState, action);
        dispatch(action);
    };

    const enqueueStage = (stage) => {
        if (!stage || typeof stage !== 'object') return;
        const entry = createLogEntry(stage.message, stage.tone, stage.tags);
        const payload = { ...stage, entry };
        dispatchAndSync({ type: ACTION_TYPES.INCREMENT_PENDING_LOGS });
        dispatchAndSync({ type: ACTION_TYPES.ENQUEUE_LOG_ENTRY, payload });
        scheduleQueueProcessing();
    };

    const enqueueStages = (stages) => {
        ensureArray(stages).forEach(enqueueStage);
    };

    const scheduleQueueProcessing = () => {
        if (processScheduled) return;
        processScheduled = true;
        setTimeout(() => {
            processScheduled = false;
            processLogQueue();
        }, 0);
    };

    const processLogQueue = async () => {
        if (isProcessingLogs) return;
        if (getLatestState().battle.queue.length === 0) return;

        isProcessingLogs = true;
        dispatchAndSync({ type: ACTION_TYPES.SET_QUEUE_PROCESSING, payload: true });

        try {
            while (true) {
                const stateBefore = getLatestState();
                const queue = stateBefore.battle.queue;
                if (!queue.length) {
                    break;
                }

                const nextStage = queue[0];
                const delayDuration = typeof nextStage.delay === 'number' ? nextStage.delay : DEFAULT_LOG_DELAY;
                if (delayDuration > 0) {
                    await AsyncUtils.delay(delayDuration);
                }

                dispatchAndSync({ type: ACTION_TYPES.DEQUEUE_LOG_ENTRY });
                dispatchAndSync({ type: ACTION_TYPES.DECREMENT_PENDING_LOGS });

                if (nextStage.entry?.tags?.enemyAttack) {
                    dispatchAndSync({ type: ACTION_TYPES.TRIGGER_PLAYER_HURT });
                }

                let followUps = null;
                if (typeof nextStage.execute === 'function') {
                    try {
                        followUps = nextStage.execute({
                            dispatch: dispatchAndSync,
                            getState: getLatestState,
                            stage: nextStage,
                            snapshot: createBattleContext(stateBefore)
                        });
                    } catch (error) {
                        console.error('[GameActions] stage execution error', error);
                    }
                }

                if (followUps) {
                    enqueueStages(followUps);
                }
            }
        } catch (error) {
            console.error('[GameActions] log queue error', error);
        } finally {
            isProcessingLogs = false;
            dispatchAndSync({ type: ACTION_TYPES.SET_QUEUE_PROCESSING, payload: false });
            if (getLatestState().battle.queue.length > 0) {
                scheduleQueueProcessing();
            }
        }
    };

    const setActionButton = (label, disabled) => {
        dispatchAndSync({
            type: ACTION_TYPES.SET_ACTION_BUTTON,
            payload: { label, disabled }
        });
    };

    const initialize = () => {
        const player = createPlayerTemplate();

        dispatchAndSync({
            type: ACTION_TYPES.INITIALIZE,
            payload: {
                phase: GAME_PHASES.EXPLORE,
                stage: {
                    level: 1,
                    encountersCleared: 0,
                    encountersPerStage: 10
                },
                player,
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
                    label: BUTTON_LABEL_NEXT,
                    disabled: false
                },
                ui: {
                    playerHurtToken: 0
                }
            }
        });

        dispatchAndSync({ type: ACTION_TYPES.RESET_PENDING_LOGS });

        enqueueStage(createStage({
            message: START_MESSAGE,
            tone: 'system'
        }));
    };

    const startNextBattle = () => {
        const state = getLatestState();
        const encounterIndex = state.stage.encountersCleared + 1;
        const enemy = createEnemyTemplate({
            stage: state.stage.level,
            encounterIndex,
            isBoss: encounterIndex >= state.stage.encountersPerStage
        });

        dispatchAndSync({ type: ACTION_TYPES.SET_ENEMY, payload: enemy });
        dispatchAndSync({ type: ACTION_TYPES.SET_PHASE, payload: GAME_PHASES.BATTLE });
        dispatchAndSync({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.READY });
        dispatchAndSync({ type: ACTION_TYPES.SET_REWARD_STATE, payload: { open: false, options: [], reason: null } });
        setActionButton(BUTTON_LABEL_ATTACK, false);

        const tone = enemy.isBoss ? 'battle' : 'narrative';
        enqueueStage(createStage({ message: `${enemy.name} appears!`, tone }));
    };

    const createPlayerDefeatStages = ({ context, enemyRoll }) => {
        const playerName = context.player?.name ?? 'Hero';
        const stage = createStage({
            message: `${playerName} has fallen... (Damage received: ${enemyRoll.damage})`,
            tone: 'system-error',
            tags: { enemyAttack: true },
            execute: ({ dispatch }) => {
                dispatch({ type: ACTION_TYPES.SET_PHASE, payload: GAME_PHASES.GAME_OVER });
                dispatch({ type: ACTION_TYPES.SET_REWARD_STATE, payload: { open: false, options: [], reason: null } });
                dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: BUTTON_LABEL_RESTART, disabled: false } });
                dispatch({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.FINISHED });
            }
        });

        return [stage];
    };

    const createThornsCounterStages = ({ context, damage }) => {
        if (!context || !context.player || !context.enemy) {
            return [];
        }

        const applied = Math.max(0, Math.floor(damage ?? 0));
        if (applied <= 0) {
            return [];
        }

        const { player, enemy } = context;

        return [createStage({
            message: `${player.name}의 반격! ${enemy.name}에게 ${applied} 피해!`,
            tone: 'player',
            tags: { playerThorns: true },
            delay: 0,
            execute: ({ dispatch, getState }) => {
                const currentEnemy = getState().battle.enemy ?? enemy;
                const remainingHp = Math.max(0, (currentEnemy?.hp ?? enemy.hp ?? 0) - applied);
                dispatch({ type: ACTION_TYPES.UPDATE_ENEMY, payload: { hp: remainingHp } });

                if (remainingHp <= 0) {
                    const defeatContext = createBattleContext(getState());
                    return createEnemyDefeatStages({ context: defeatContext, enemy: { ...currentEnemy, hp: 0 } });
                }

                dispatch({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.READY });
                dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: BUTTON_LABEL_ATTACK, disabled: false } });
                return null;
            }
        })];
    };

    const createEnemyCounterStages = ({ context, enemyRoll }) => {
        if (!enemyRoll) {
            return [];
        }

        const attackStage = createStage({
            message: buildEnemyAttackMessage(context.enemy, enemyRoll),
            tone: 'enemy',
            tags: { enemyAttack: true },
            execute: ({ dispatch, getState }) => {
                const currentPlayer = getState().player;
                if (!currentPlayer) {
                    return null;
                }

                const updatedPlayer = applyDamageToPlayer(currentPlayer, enemyRoll.damage);
                dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: updatedPlayer });

                const stateAfterDamage = getState();
                const playerAfterDamage = stateAfterDamage.player;

                if (playerAfterDamage?.hp <= 0) {
                    const defeatContext = createBattleContext(stateAfterDamage);
                    return createPlayerDefeatStages({ context: defeatContext, enemyRoll });
                }

                const thornsDamage = Math.max(0, Math.floor(playerAfterDamage?.thornsCoeff ?? 0));
                if (thornsDamage > 0) {
                    const thornsStages = createThornsCounterStages({
                        context: createBattleContext(stateAfterDamage),
                        damage: thornsDamage
                    });

                    if (thornsStages.length > 0) {
                        return thornsStages;
                    }
                }

                dispatch({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.READY });
                dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: BUTTON_LABEL_ATTACK, disabled: false } });
                return null;
            }
        });

        return [attackStage];
    };

    const createEnemyDefeatStages = ({ context, enemy }) => {
        const encountersCleared = Math.min(context.stage.encountersCleared + 1, context.stage.encountersPerStage);
        const stageCleared = encountersCleared >= context.stage.encountersPerStage;
        const rewards = pickRewards(enemy.isBoss ? 4 : 3);

        const expMultiplier = import.meta.env.DEV ? 10 : 1;
        const scaledExp = enemy.exp * expMultiplier;
        const { player: finalPlayer, levelUps } = grantExperience(context.player, scaledExp);
        const lastPlayerState = levelUps.length > 0 ? levelUps[levelUps.length - 1].playerState : finalPlayer;

        const stages = [];

        stages.push(createStage({
            message: `${enemy.name} has been defeated!`,
            tone: 'system',
            execute: ({ dispatch }) => {
                dispatch({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.FINISHED });
                dispatch({ type: ACTION_TYPES.UPDATE_PROGRESS, payload: encountersCleared });
                dispatch({ type: ACTION_TYPES.SET_ENEMY, payload: null });
                dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: 'Processing...', disabled: true } });
            }
        }));

        stages.push(createStage({
            message: `Gained ${scaledExp} experience.`,
            tone: 'system',
            execute: ({ dispatch }) => {
                if (levelUps.length === 0) {
                    dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: finalPlayer });
                }
            }
        }));

        levelUps.forEach((levelInfo) => {
            stages.push(createStage({
                message: `Level up! Lv.${levelInfo.level} (Attack ${levelInfo.attack}, HP ${levelInfo.maxHp})`,
                tone: 'player',
                execute: ({ dispatch }) => {
                    dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: levelInfo.playerState });
                }
            }));
        });

        if (stageCleared) {
            const nextStageLevel = context.stage.level + 1;
            const healAmount = Math.floor(lastPlayerState.maxHp * 0.25);
            const healedHp = Math.min(lastPlayerState.maxHp, lastPlayerState.hp + healAmount);

            stages.push(createStage({
                message: `Stage cleared! Moving to stage ${nextStageLevel}. Restored ${healAmount} HP.`,
                tone: 'system',
                execute: ({ dispatch }) => {
                    dispatch({ type: ACTION_TYPES.SET_STAGE, payload: { level: nextStageLevel, encountersCleared: 0 } });
                    dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: { hp: healedHp } });
                }
            }));
        }

        stages.push(createStage({
            message: 'Choose your reward.',
            tone: 'system',
            execute: ({ dispatch }) => {
                dispatch({ type: ACTION_TYPES.SET_PHASE, payload: GAME_PHASES.REWARD });
                dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: 'Select reward', disabled: true } });
                dispatch({
                    type: ACTION_TYPES.SET_REWARD_STATE,
                    payload: { open: true, options: rewards, reason: 'battle' }
                });
                dispatch({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.READY });
            }
        }));

        return stages;
    };

    const buildBattleStages = (context) => {
        const { player, enemy } = context;
        if (!player || !enemy) {
            return [];
        }

        const playerRoll = rollDamage(player, enemy);
        const remainingEnemyHp = Math.max(0, enemy.hp - playerRoll.damage);

        const playerAttackStage = createStage({
            message: buildPlayerAttackMessage(player, playerRoll),
            tone: 'player',
            execute: ({ dispatch, getState }) => {
                dispatch({ type: ACTION_TYPES.UPDATE_ENEMY, payload: { hp: remainingEnemyHp } });

                const updatedContext = createBattleContext(getState());

                if (remainingEnemyHp <= 0) {
                    return createEnemyDefeatStages({ context: updatedContext, enemy: { ...enemy, hp: 0 } });
                }

                const enemyRoll = rollDamage(updatedContext.enemy, updatedContext.player);
                return createEnemyCounterStages({ context: updatedContext, enemyRoll });
            }
        });

        return [playerAttackStage];
    };

    const applyRewardEffect = (reward, snapshot) => {
        const player = snapshot.player;
        if (!player) {
            return { stages: [], openedExtraReward: false };
        }

        const stages = [];
        let openedExtraReward = false;

        switch (reward.type) {
            case 'STAT': {
                const statName = reward.stat;
                const newValue = (player[statName] || 0) + reward.amount;
                stages.push(createStage({
                    message: `${reward.title}: ${statLabel(statName)} +${reward.amount}`,
                    tone: 'system',
                    execute: ({ dispatch }) => {
                        dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: { [statName]: newValue } });
                    }
                }));
                break;
            }
            case 'HEAL_PERCENT': {
                const healAmount = Math.floor(player.maxHp * reward.amount);
                const healedHp = Math.min(player.maxHp, player.hp + healAmount);
                stages.push(createStage({
                    message: `${reward.title}: Restored ${healAmount} HP`,
                    tone: 'system',
                    execute: ({ dispatch }) => {
                        dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: { hp: healedHp } });
                    }
                }));
                break;
            }
            case 'MAX_HP': {
                const newMax = player.maxHp + reward.amount;
                const newHp = Math.min(newMax, player.hp + reward.amount);
                stages.push(createStage({
                    message: `${reward.title}: Max HP +${reward.amount}`,
                    tone: 'system',
                    execute: ({ dispatch }) => {
                        dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: { maxHp: newMax, hp: newHp } });
                    }
                }));
                break;
            }
            case 'ARMOR_FLAT': {
                const newArmor = (player.armor || 0) + reward.amount;
                stages.push(createStage({
                    message: `${reward.title}: Armor +${reward.amount}`,
                    tone: 'system',
                    execute: ({ dispatch }) => {
                        dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: { armor: newArmor } });
                    }
                }));
                break;
            }
            case 'EXP': {
                const rewardExp = reward.amount * (import.meta.env.DEV ? 10 : 1);
                const { player: finalPlayer, levelUps } = grantExperience(player, rewardExp);

                stages.push(createStage({
                    message: `${reward.title}: Gained ${rewardExp} experience`,
                    tone: 'system',
                    execute: ({ dispatch }) => {
                        if (levelUps.length === 0) {
                            dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: finalPlayer });
                        }
                    }
                }));

                levelUps.forEach((levelInfo) => {
                    stages.push(createStage({
                        message: `Level up! Lv.${levelInfo.level} (Attack ${levelInfo.attack}, HP ${levelInfo.maxHp})`,
                        tone: 'player',
                        execute: ({ dispatch }) => {
                            dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: levelInfo.playerState });
                        }
                    }));
                });

                if (levelUps.length > 0) {
                    const extraRewards = pickRewards(3);
                    stages.push(createStage({
                        message: 'Bonus reward unlocked.',
                        tone: 'system',
                        execute: ({ dispatch }) => {
                            dispatch({ type: ACTION_TYPES.SET_PHASE, payload: GAME_PHASES.REWARD });
                            dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: 'Select reward', disabled: true } });
                            dispatch({
                                type: ACTION_TYPES.SET_REWARD_STATE,
                                payload: { open: true, options: extraRewards, reason: 'bonus' }
                            });
                        }
                    }));
                    openedExtraReward = true;
                }
                break;
            }
            default:
                stages.push(createStage({
                    message: `${reward.title}: effect applied.`,
                    tone: 'system'
                }));
        }

        return { stages, openedExtraReward };
    };

    const selectReward = (rewardId) => {
        const state = getLatestState();
        if (state.phase !== GAME_PHASES.REWARD) {
            return;
        }

        const reward = findRewardById(rewardId, state.reward.options);
        if (!reward) {
            console.warn('[GameActions] reward not found', rewardId);
            return;
        }

        if (state.battle.queue.length > 0) {
            return;
        }

        dispatchAndSync({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.RESOLVING });

        const { stages: rewardStages, openedExtraReward } = applyRewardEffect(reward, createBattleContext(state));
        const stagesToEnqueue = [...rewardStages];

        if (!openedExtraReward) {
            stagesToEnqueue.push(createStage({
                message: 'Preparation complete. Ready to explore.',
                tone: 'narrative',
                execute: ({ dispatch }) => {
                    dispatch({ type: ACTION_TYPES.SET_REWARD_STATE, payload: { open: false, options: [], reason: null } });
                    dispatch({ type: ACTION_TYPES.SET_PHASE, payload: GAME_PHASES.EXPLORE });
                    dispatch({ type: ACTION_TYPES.SET_ACTION_BUTTON, payload: { label: BUTTON_LABEL_NEXT, disabled: false } });
                    dispatch({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.READY });
                }
            }));
        }

        enqueueStages(stagesToEnqueue);
    };

    const performAction = () => {
        const state = getLatestState();

        if (state.actionButton?.disabled) {
            return;
        }

        if (state.battle.turnStatus !== TURN_STATUS.READY) {
            return;
        }

        if (state.battle.queue.length > 0) {
            return;
        }

        switch (state.phase) {
            case GAME_PHASES.EXPLORE:
                startNextBattle();
                break;
            case GAME_PHASES.BATTLE:
                dispatchAndSync({ type: ACTION_TYPES.SET_TURN_STATUS, payload: TURN_STATUS.RESOLVING });
                setActionButton(BUTTON_LABEL_ATTACK, true);
                enqueueStages(buildBattleStages(createBattleContext(state)));
                break;
            case GAME_PHASES.GAME_OVER:
                initialize();
                break;
            case GAME_PHASES.REWARD:
                enqueueStage(createStage({ message: 'Choose a reward first.', tone: 'system', delay: 0 }));
                break;
            default:
                initialize();
        }
    };

    return {
        initialize,
        performAction,
        selectReward
    };
}
