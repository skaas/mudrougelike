import { GameState } from './state/GameState.js';
import { UIManager } from './UIManager.js';
import { RewardSystem } from './RewardSystem.js';
import { MESSAGE_DELAYS, ACTION_TYPES } from './constants.js';
import { EventEmitter } from './EventEmitter.js';
import { GAME_PHASES } from './constants.js';
import { MESSAGE_TYPES } from './constants.js';
import { EVENT_TYPES } from './EventTypes.js';
import { AsyncUtils } from './utils/AsyncUtils.js';
import { GameStateTransaction } from './state/GameStateTransaction.js';\r\nimport { CardRegistry } from './app/cards/index.js';

import { GameLifecycle } from './app/lifecycle/GameLifecycle.js';
import { GameStateFacade } from './app/lifecycle/GameStateFacade.js';
import { BattleController } from './app/controllers/BattleController.js';
import { LegacyBattleContextAdapter } from './app/controllers/LegacyBattleContextAdapter.js';
import { LegacyGameViewAdapter } from './app/views/LegacyGameViewAdapter.js';
import { LegacyRewardContextAdapter } from './app/reward/LegacyRewardContextAdapter.js';


export class Game {
    #eventEmitter;
    #ui;
    #state;
    #rewardSystem;
    #updateCheckTimer;
    #initialStatusSet = true;

    #viewAdapter;
    #stateFacade;
    #battleContext;
    #rewardContext;
    #battleController;
    #lifecycle;


    constructor() {
        this.#eventEmitter = new EventEmitter();
        this.#state = new GameState(this.#eventEmitter);
        
        this.#ui = new UIManager(this.#eventEmitter);
        
        this.#rewardSystem = new RewardSystem(this.#eventEmitter, this.#state);

        this.#cardRegistry = new CardRegistry(this.#eventEmitter, {
            battleManager: this.#state.battleManager,
            rewardManager: this.#state.rewardManager
        });
        this.#rewardContext = new LegacyRewardContextAdapter({
            rewardSystem: this.#rewardSystem,
            state: this.#state
        });

        this.#viewAdapter = new LegacyGameViewAdapter({
            uiManager: this.#ui,
            eventEmitter: this.#eventEmitter,
            rewardContext: this.#rewardContext,
            onRewardSelected: async (payload) => {
                await this.onRewardSelected(payload);
            }
        });

        this.#stateFacade = new GameStateFacade(this.#state);
        this.#battleContext = new LegacyBattleContextAdapter({
            battleManager: this.#state.battleManager,
            playerManager: this.#state.playerManager,
            enemyManager: this.#state.enemyManager
        });

        this.#battleController = new BattleController({
            battleContext: this.#battleContext,
            view: this.#viewAdapter,
            eventBus: this.#eventEmitter
        });

        this.#lifecycle = new GameLifecycle({
            state: this.#stateFacade,
            battleController: this.#battleController,
            rewardContext: this.#rewardContext,
            view: this.#viewAdapter,
            hooks: this.createLifecycleHooks()
        });


        this.#eventEmitter.on(EVENT_TYPES.PLAYER.LEVEL_UP, ({ player }) => {
            const options = this.#cardRegistry.offerLevelUpCards(player);
            if (!options.length) {
                return;
            }

            if (typeof this.#ui.presentCardChoices === 'function') {
                this.#ui.presentCardChoices(options, (selectedKey) => {
                    try {
                        this.#cardRegistry.applyCard(selectedKey, { player });
                    } catch (error) {
                        console.error('[Card] Failed to apply selected upgrade:', error);
                    }
                });
            } else {
                const selected = options[0];
                try {
                    this.#cardRegistry.applyCard(selected.key, { player });
                    this.#eventEmitter.emit('ui:log-message', {
                        message: '[Card] Automatically picked ' + selected.name + '.',
                        type: 'system'
                    });
                } catch (error) {
                    console.error('[Card] Automatic upgrade application failed:', error);
                }
            }
        });

        this.#eventEmitter.on(EVENT_TYPES.PLAYER.LEVEL_UP, ({ player }) => {
            const options = this.#cardRegistry.offerLevelUpCards(player);
            if (!options.length) {
                return;
            }

            if (typeof this.#ui.presentCardChoices === 'function') {
                this.#ui.presentCardChoices(options, (selectedKey) => {
                    try {
                        this.#cardRegistry.applyCard(selectedKey, { player });
                    } catch (error) {
                        console.error('[카드] ?????????', error);
                    }
                });
            } else {
                const selected = options[0];
                try {
                    this.#cardRegistry.applyCard(selected.key, { player });
                    this.#eventEmitter.emit('ui:log-message', {
                        message: [카드] ????????????,
                        type: 'system'
                    });
                } catch (error) {
                    console.error('[카드] ?????????', error);
                }
            }
        });
        
        this.#eventEmitter.on('state:initialized', () => {
            this.#ui.updateAll();
            this.#eventEmitter.emit('game:ready');
        });
        
        this.setupEventListeners(this);
        this.initialize();
        
        this.#eventEmitter.on('ui:action-button-clicked', () => {
                this.performAction();
        });
    }

    createLifecycleHooks() {
        return {
            prepareBattle: async () => {
                await this.prepareNextBattle({ silent: true });
                this.#ui.setActionButtonEnabled?.(false);
            },
            enterExplore: async ({ fromReward } = {}) => {
                this.#ui.setActionButtonEnabled?.(true);
                if (fromReward) {
                    await this.prepareNextBattle({ silent: false });
                }
            },
            enterReward: async () => {
                this.#ui.setActionButtonEnabled?.(false);
            },
            enterGameOver: async () => {
                this.#ui.setActionButtonEnabled?.(false);
                this.#ui.showGameOver?.();
            }
        };
    }

    async onRewardSelected({ reward, result }) {
        try {
            this.#rewardContext.clear();
            this.#ui.hideRewards?.();
            await this.#lifecycle.transitionTo(GAME_PHASES.EXPLORE, {
                fromReward: true,
                reward,
                rewardResult: result
            });
        } catch (error) {
            console.error('[Game] reward selection error:', error);
            this.handleError(error, 'reward selection');
        }
    }

    async providePlayerAction() {
        return null;
    }

    async provideEnemyStrategy() {
        return undefined;
    }

    async addGameMessage(message, type, delay = MESSAGE_DELAYS.DEFAULT) {
        try {
            await this.#eventEmitter.emit('game:message', {
                type,
                message,
                delay
            });
        } catch (error) {
            console.error('硫붿?? 泥섎??????諛쒖?', error);
            // ???蹂듦??濡쒖?
        }
    }

    async initialize() {
        console.log('寃뚯??????????);
        
        try {
            this.#eventEmitter.emit('game:initialize');
            
            // 濡쒓?????????????뺤씤
            this.#ui.ensureLogContainerExists();
            
            // 紐낆??곸쑝?????硫붿?? ??
            const initialMessage = document.createElement('div');
            initialMessage.textContent = '寃뚯???????????..';
            initialMessage.className = 'log-entry narrative';
            this.#ui.elements.logContainer.appendChild(initialMessage);
            
            console.log('寃뚯???곹깭 ??????);
            this.#state.initialize();
            console.log('寃뚯???곹깭 ?????꾨즺');
            
            // ?붾쾭源낆??- ?꾩옱 ??????? ???곹깭 ?뺤씤
            console.log('?꾩옱 ??????', this.#state.getPlayer());
            console.log('?꾩옱 ??', this.#state.getEnemy());

            // ?踰덉??硫붿?? 吏곸???? (??????????고쉶)
            try {
                const message = `${this.#state.getCurrentStage()}痢듭???먰뿕???????..`;
                const logEntry = document.createElement('div');
                logEntry.textContent = message;
                logEntry.className = 'log-entry narrative';
                this.#ui.elements.logContainer.appendChild(logEntry);
                console.log('?硫붿?? 吏곸????:', message);
            } catch (msgError) {
                console.error('?硫붿?? 吏곸???? ????', msgError);
            }
            
            // ????吏?????꾪닾 以??????
            await AsyncUtils.delay(500);
            
            // ??????????踰덈?updateNarrative ?몄텧
            // ?곹깭??????以묐??硫붿?? 諛⑹? ????
            this.#initialStatusSet = true;
            await this.updateNarrative("???꾨뱾????????痢≪????좎엯????", "init", true);
            await this.updateNarrative("???????????????????꾩빞 ????", "init", true);
            
            console.log('?꾪닾 以?????????..');
            await this.prepareNextBattle();
        } catch (error) {
            console.error('寃뚯??????????諛쒖?', error);
            // ???硫붿?? ????
            this.#ui.addLogMessage('寃뚯?????????쪟媛? 諛쒖??????? ???吏?????????몄슂.', 'system-error');
        }
    }

    async startBattle() {
        const transaction = new GameStateTransaction(this.#state);
        console.log('[?붾쾭? startBattle ?몄텧??- ?꾩옱 寃뚯?????', this.#state.getGamePhase());
        
        try {
            // ?몃옖???????곹깭 蹂?以??
            transaction
                .set('gamePhase', GAME_PHASES.BATTLE)
                .set('turns', 0);
            
            // ?꾪닾 ????硫붿??
            await this.#ui.addLogMessage(
                "=== ?꾪닾 ????===",
                MESSAGE_TYPES.NARRATIVE
            );
            
            // ?곹깭 蹂??뺤젙
            transaction.commit();
            console.log('[?붾쾭? 寃뚯?????媛? BATTLE?蹂寃쎈?- 蹂???', this.#state.getGamePhase());
            
            // BattleManager???꾩슂??李몄??????
            // ??린媛? ??????????- BattleManager???꾩슂??李몄?? ??????????
            if (!this.#state.battleManager) {
                console.error('[??? BattleManager媛 ???????');
                return;
            }
            
            // BattleManager??李몄??????(?꾩슂??寃쎌??
            if (!this.#state.battleManager.gameState) {
                console.log('[?붾쾭? BattleManager??gameState 李몄??????);
                this.#state.battleManager.gameState = this.#state;
            }
            
            if (!this.#state.battleManager.playerManager) {
                console.log('[?붾쾭? BattleManager??playerManager 李몄??????);
                this.#state.battleManager.playerManager = this.#state.playerManager;
            }
            
            if (!this.#state.battleManager.enemyManager) {
                console.log('[?붾쾭? BattleManager??enemyManager 李몄??????);
                this.#state.battleManager.enemyManager = this.#state.enemyManager;
            }
            
            // battle:start ????諛쒖???濡쒓??
            console.log('[?붾쾭? battle:start ????諛쒖?以??);
            
            // battle:start ????諛쒖???
            await this.#eventEmitter.emit('battle:start', {
                player: this.#state.getPlayer(),
                enemy: this.#state.getEnemy(),
                stage: this.#state.getCurrentStage()
            });
            
            // ?꾪닾 ?????????踰꾪??????- 紐낆????뺤씤 ??
            console.log('[?붾쾭? ?꾪닾 ???? ???踰꾪???????..');
            this.#ui.setActionButtonEnabled(true);
            
            // ?붾쾭?- ???踰꾪???뺤씤
            if (this.#ui.elements.actionButton) {
                console.log('[?붾쾭? ???踰꾪???곹깭: ', {
                    disabled: this.#ui.elements.actionButton.disabled,
                    innerText: this.#ui.elements.actionButton.innerText
                });
            } else {
                console.error('[??? ???踰꾪???붿냼媛 ???????');
            }
            
            // ????吏??????????????????
            setTimeout(() => {
                console.log('[?붾쾭? ???踰꾪???????????);
                this.#ui.setActionButtonEnabled(true);
            }, 500);
            
            // 3?몄묶 ????곕툕 ??
            const enemy = this.#state.getEnemy();
            const narrativeText = `????湲곗????린???????伊먭??${enemy.name}?????꾪닾????????? ????????뼸寃???궇吏???????좊뱾留뚯???????????`;
            await this.updateNarrative(narrativeText, 'battle-start', true);
        } catch (error) {
            // ???諛쒖????몃옖????濡ㅻ?
            transaction.rollback();
            console.error('?꾪닾 ????????', error);
            this.handleError(error, '?꾪닾 ????);
        }
    }

    async performAction() {
        try {
            const gamePhase = this.#state.getGamePhase();

            switch (gamePhase) {
                case GAME_PHASES.EXPLORE: {
                    const battleOutcome = await this.#lifecycle.transitionTo(GAME_PHASES.BATTLE, {
                        playerActionProvider: this.providePlayerAction.bind(this),
                        enemyStrategyProvider: this.provideEnemyStrategy.bind(this)
                    });

                    if (battleOutcome?.outcome === 'victory') {
                        const victoryData = await this.handleVictory(battleOutcome);
                        await this.#lifecycle.transitionTo(GAME_PHASES.REWARD, {
                            battleOutcome,
                            victoryData
                        });
                    } else if (battleOutcome?.outcome === 'defeat') {
                        await this.handleDefeat();
                        await this.#lifecycle.transitionTo(GAME_PHASES.GAME_OVER, { battleOutcome });
                    } else {
                        await this.#lifecycle.transitionTo(GAME_PHASES.EXPLORE, { outcome: battleOutcome });
                    }
                    break;
                }
                case GAME_PHASES.REWARD: {
                    console.warn('보상 선택 중에는 추가 행동을 수행할 수 없습니다.');
                    break;
                }
                case GAME_PHASES.GAME_OVER: {
                    console.warn('게임 오버 상태에서는 행동을 수행할 수 없습니다.');
                    break;
                }
                default: {
                    console.warn('지원되지 않는 페이즈에서 performAction이 호출되었습니다:', gamePhase);
                }
            }
        } catch (error) {
            console.error('액션 수행 오류 발생:', error);
            this.handleError(error, 'perform action');
            this.#ui.setActionButtonEnabled?.(true);
        }
    }

    async executeBattlePhase(selectedAction, result) {
        // 1. ????????????諛쒖?
        await this.executePlayerTurn(selectedAction, result);
        
        // 2. ?곹깭 ???????
        await this.updateGameState();
        
        // 3. ?꾪닾 寃곌???뺤씤
        if (this.#state.enemy.hp <= 0) {
            await this.handleVictory();
            return;
        }
        
        // 4. ???????
        await this.executeEnemyTurn();
    }

    async executePlayerTurn(selectedAction, result) {
        return AsyncUtils.safePromise(
            this.#eventEmitter.emit(EVENT_TYPES.BATTLE.PLAYER_TURN, {
                actionType: selectedAction.type,
                actor: 'player',
                result: result,
                messages: this.generateActionMessages(selectedAction, result)
            }),
            '????????泥섎??????
        );
    }

    async updateGameState() {
        return AsyncUtils.safePromise(
            this.#eventEmitter.emit(EVENT_TYPES.STATE.UPDATE, {
                player: this.#state.player,
                enemy: this.#state.enemy,
                gamePhase: this.#state.gamePhase,
                stage: this.#state.stage,
                isBossBattle: this.#state.isBossStage()
            }),
            '寃뚯???곹깭 ???????????
        );
    }

    async executeEnemyTurn() {
        const enemyAction = this.#state.selectEnemyAction();
        const result = this.#state.executeAction(
            enemyAction, 
            this.#state.enemy, 
            this.#state.player
        );

        if (!result) return;
        
        try {
            await this.#eventEmitter.emit('battle:action', {
                actionType: enemyAction.type,
                actor: 'enemy',
                result: result,
                messages: this.generateActionMessages(enemyAction, result)
            });
            
            await this.updateGameState();
            
            if (this.#state.player.hp <= 0) {
                this.#eventEmitter.emit('battle:end', { victory: false });
            }
        } catch (error) {
            console.error('????泥섎??????諛쒖?', error);
            // ???蹂듦??濡쒖?
        }
    }

    async handleBattleError(error) {
        // ???濡쒓??湲곕?
        console.error('?꾪닾 ???', error);
        
        // ?????????硫붿?? ????
        await this.addGameMessage(
            '?꾪닾 ???쪟媛? 諛쒖???????',
            MESSAGE_TYPES.ERROR
        );
        
        // ?꾩슂??寃쎌??寃뚯???곹깭 蹂듦??
        this.recoverGameState();
    }

    recoverGameState() {
        // 媛??理쒓???좏슚 ?곹깭?蹂듭??
        // ?? ?????湲곕??믪쑝?????
    }

    generateActionMessages(action, result) {
        const messages = [];
        const totalDamage = result?.damage ?? 0;

        if (result?.skipped) {
            messages.push('????곹깭! ???????????????');
            return messages;
        }

        if (result?.isCritical) {
            messages.push(`移섎??! ${action.name}??媛뺣?????곸쨷???? (??? ${totalDamage})`);
        } else if (action?.type === ACTION_TYPES.DEFENSE) {
            messages.push(`${action.name} ?????????????????`);
        } else {
            messages.push(`${action.name} ??? (??? ${totalDamage})`);
        }

        if (result?.armorGain > 0) {
            messages.push(`諛⑹???? (諛⑹??+${result.armorGain})`);
        }

        if (result?.lifeSteal?.applied > 0) {
            messages.push(`????????諛쒕? ???${result.lifeSteal.applied} ???.`);
        }

        if (result?.thorns?.applied > 0) {
            messages.push(`媛??諛섍? ???? ${result.thorns.applied} ???諛섏?`);
        }

        if (result?.freezeApplied) {
            messages.push('????깃났! ?곸씠 1???????????.');
        }

        return messages;
    }

    setupEventListeners(component) {
        this.#eventEmitter.on('game:initialize', () => {
            this.#ui.setActionButtonEnabled(false);
        });

        this.#eventEmitter.on('game:ready', () => {
            this.#ui.setActionButtonEnabled(true);
        });

        this.#eventEmitter.on('battle:end', (result) => {
            if (!result.victory) {
                this.handleDefeat();
            }
        });

        this.#eventEmitter.on('game:prepare-next-battle', () => {
            // ?????꾪닾 以??
            const wasInBattle = this.#state.visitedStages.has(this.#state.stage);
            if (wasInBattle) {
                this.#state.increaseStage();
                this.#state.increaseLevel();
            }
            
            const statModifier = this.#state.calculateRandomStatModifier();
            this.#state.resetEnemyWithLevel(this.#state.level, statModifier);
            
            // UI ???????
            this.#eventEmitter.emit('state:update', {
                player: this.#state.player,
                enemy: this.#state.enemy,
                gamePhase: this.#state.gamePhase,
                stage: this.#state.stage,
                isBossBattle: this.#state.isBossStage()
            });

            // ???踰꾪??????????
            this.#ui.setActionButtonEnabled(true);
        });
    }

    async handleDefeat() {

        await this.#eventEmitter.emit('game:message', {

            type: 'narrative-emphasis',

            message: 'You have fallen...'

        });



        this.#ui.showGameOver?.();

        this.#ui.setActionButtonEnabled?.(false);

    }



    async handleVictory(battleOutcome = {}) {
        try {
            const player = this.#state.getPlayer();
            const enemy = battleOutcome.enemy ?? this.#state.getEnemy();

            if (!player || !enemy) {
                throw new Error('Missing player or enemy when handling victory.');
            }

            this.#state.enemyManager.handleEnemyDefeat();

            await this.#eventEmitter.emit('state:update', {
                enemy,
                player,
                gamePhase: 'victory'
            });

            await this.#eventEmitter.emit('game:message', {
                type: 'narrative-emphasis',
                message: 'The enemy has been defeated!'
            });

            const expGained = enemy?.exp || 0;
            let expResult = null;

            try {
                expResult = this.#state.addExperience(expGained);
                const appliedExp = typeof expResult?.gainedExp === 'number' ? expResult.gainedExp : expGained;
                const messages = [
                    '=== Battle Result ===',
                    `Experience gained: +${appliedExp}`
                ];
                if (expResult && typeof expResult.currentExp === 'number' && typeof expResult.maxExp === 'number') {
                    messages.push(`Current EXP: ${expResult.currentExp}/${expResult.maxExp}`);
                }
                if (expResult?.leveledUp) {
                    messages.push('Level up!');
                }
                await this.#eventEmitter.emit('status:update', {
                    messages,
                    append: true
                });
            } catch (experienceError) {
                console.error('[Game] Experience handling error:', experienceError);
                this.handleError(experienceError, 'experience handling');
            }

            this.#state.enemyManager.clearDefeatedEnemy();

            return {
                expGained,
                expResult,
                enemy
            };
        } catch (error) {
            console.error('[Game] handleVictory error:', error);
            this.handleError(error, 'victory handling');
            return { error };
        }
    }


    // 寃뚯???????? 硫붿????
    pauseGame() {
        try {
            // ???踰꾪??????깊솕
            this.#ui.setActionButtonEnabled(false);
            
            // 寃뚯???곹깭?????????蹂?
            this.#state.setGamePhase('paused');
            
            // ?????????
            this.#eventEmitter.emit('game:message', {
                type: 'system-error',
                message: '寃뚯?????쪟媛? 諛쒖????????????????? ???吏?????????몄슂.'
            });
        } catch (error) {
            console.error('寃뚯???????? ????', error);
        }
    }

    // 寃뚯????????뺣━
    shutdown() {
        // 紐⑤????????????뺣━
        this.#eventEmitter.removeAllListeners(this);
        this.#ui.cleanup();
        
        // DOM ?????뺣━ ???? ?묒뾽...
    }

    handleError(error, context = '') {
        console.error(`寃뚯?????(${context}):`, error);
        
        // UI?????????
        this.#ui.addLogMessage(`??쪟媛? 諛쒖???????(${context}). 寃뚯????????????`, 'system-error');
        
        // ?꾩슂??寃뚯???곹깭 蹂듦?????
        try {
            // ?????뼱媛? ???????????
            if (!this.#state.getPlayer()) {
                this.#state.playerManager.createPlayer();
            }
            
            // ?곸씠 ???????????
            if (!this.#state.getEnemy()) {
                this.#state.enemyManager.createEnemy(1); // ???1????
            }
            
            // UI 媛뺤?????????
            this.#ui.updateAll();
            
            // 1????????????
            setTimeout(() => this.prepareNextBattle(), 1000);
        } catch (recoveryError) {
            console.error('???蹂듦??????', recoveryError);
            // 蹂듦???????????吏? ?????좊룄
            this.#ui.addLogMessage('寃뚯???蹂듦???????????? ???吏?????????몄슂.', 'system-error');
        }
    }

    async prepareNextBattle({ silent = false } = {}) {

        try {

            if (!silent) {

                if (this.#initialStatusSet) {

                    this.#initialStatusSet = false;

                } else {

                    await this.updateNarrative(`The knight arrives on floor ${this.#state.getCurrentStage()}. Every step grows cautious and the resolve in his eyes hardens.`, 'battle-prepare', true);

                }

            }



            const level = this.#state.getCurrentLevel();

            const isBoss = this.#state.isBossStage();

            const currentEnemy = this.#state.getEnemy();



            if (!currentEnemy || currentEnemy.isDead()) {

                this.#state.enemyManager.createEnemy(level, isBoss);

            }



            const enemy = this.#state.getEnemy();



            if (!silent && enemy) {

                await this.addGameMessage(`${enemy.name} stands in the way!`, MESSAGE_TYPES.ENEMY_EMPHASIS);

                await this.addGameMessage({

                    text: 'Start Battle',

                    onClick: () => {

                        this.performAction();

                    }

                }, MESSAGE_TYPES.BUTTON);

            }



            this.#ui.setActionButtonEnabled?.(false);



            if (!silent && enemy) {

                const narrativeText = `The knight faces ${enemy.name}. Every step grows cautious and the resolve in his eyes hardens.`;

                await this.updateNarrative(narrativeText, 'battle-prepare', true);

            }



            return enemy;

        } catch (error) {

            console.error('Failed to prepare next battle:', error);

            this.handleError(error, 'prepare next battle');

            return null;

        }

    }



    async updateNarrative(message, context = null, append = false) {
        try {
            console.log('????곕툕 硫붿?? ???????????(?몄텧 ???:', new Error().stack);
            
            // ?곹깭李쎌??????????
            if (!this.#ui?.elements?.statusNarrative) {
                console.warn('?곹깭李쎌?????????? ???????);
                this.#ui.initializeStatusContainer([]);
            }
            
            // ?????以묒???????뺤씤 ?묒뾽 ????
            if (this.#updateCheckTimer) {
                clearTimeout(this.#updateCheckTimer);
            }
            
            // ????諛쒖?
            const emitResult = await this.#eventEmitter.emit('narrative:update', {
                message, context, append
            });
            
            console.log('narrative:update ????諛쒖?寃곌??', emitResult);
            
            // ????????媛? 吏꾪?以묒?? ?뺤씤 ??寃?濡쒖????
            this.#updateCheckTimer = setTimeout(() => {
                // ?????以묒???뺤씤 ?곌린
                if (this.#ui.isTypingInProgress) {
                    console.log('?????吏꾪?? ?뺤씤 ?곌린...');
                    // ????????????吏 湲곕???(理쒕? 2??
                    let checkAttempts = 0;
                    const checkInterval = setInterval(() => {
                        checkAttempts++;
                        if (!this.#ui.isTypingInProgress || checkAttempts > 20) {
                            clearInterval(checkInterval);
                            validateContent();
                        }
                    }, 100);
                } else {
                    validateContent();
                }
            }, 500);
            
            // ????寃?????
            const validateContent = () => {
                try {
                    if (this.#ui.isTypingInProgress) {
                        console.log('???????꾩쭅 吏꾪?以묒???寃利앹????곷땲??);
                        return;
                    }
                    
                    const statusContent = this.#ui.elements.statusNarrative?.textContent;
                    const statusOk = statusContent && statusContent.includes(message.substring(0, 20));
                    
                    console.log('?곹깭?????????뺤씤:', { 
                        isDisplayed: statusOk,
                        contentLength: statusContent?.length || 0
                    });
                    
                    if (!statusOk) {
                        console.warn('??????꾨즺 ?꾩뿉??硫붿??媛 ??????? ?????????);
                        this.#ui.refreshNarrativeStatus();
                    }
                } catch (error) {
                    console.error('?곹깭??뺤씤 ????', error);
                }
            };
        } catch (error) {
            console.error('????곕툕 硫붿?? 泥섎??????諛쒖?', error);
        }
    }

    testEventEmitter() {
        console.log("=== ?????????吏꾨??????===");
        this.#eventEmitter.logEventHandlers();
        
        console.log("=== ????諛쒖??????===");
        this.#eventEmitter.emit('narrative:update', {
            message: "???? ?????硫붿???????",
            context: "test",
            append: false
        });
        
        // 2?????????뺤씤
        setTimeout(() => {
            console.log("=== ????泥섎?????곹깭 ===");
            console.log("?곹깭?????", this.#ui.elements.statusNarrative?.textContent);
        }, 2000);
    }

    executeBattleAction() {
        this.executeBattleActionAsync();
    }

    async executeBattleActionAsync() {
        try {
            console.log('[?? executeBattleAction ???);

            if (this.#state.getGamePhase() !== GAME_PHASES.BATTLE) {
                console.warn('[경고] ?????? ???????????????????????', this.#state.getGamePhase());
                this.#state.setGamePhase(GAME_PHASES.BATTLE);
                if (this.#state.getGamePhase() !== GAME_PHASES.BATTLE) {
                    console.error('[치명] ?????????????????');
                    return;
                }
            }

            if (!this.#state.battleManager) {
                console.error('[치명] BattleManager가 ?????');
                return;
            }

            if (!this.#state.battleManager.gameState) {
                this.#state.battleManager.gameState = this.#state;
            }
            if (!this.#state.battleManager.playerManager) {
                this.#state.battleManager.playerManager = this.#state.playerManager;
            }
            if (!this.#state.battleManager.enemyManager) {
                this.#state.battleManager.enemyManager = this.#state.enemyManager;
            }

            this.#ui.setActionButtonEnabled(false);

            const player = this.#state.getPlayer();
            const enemy = this.#state.getEnemy();
            if (!player || !enemy) {
                console.error('[치명] ????????바르? ?????', { player, enemy });
                this.#ui.setActionButtonEnabled(true);
                return;
            }

            this.#state.battleManager.beginRound();

            const initiative = this.#state.battleManager.determineInitiative(player, enemy);

            if (initiative === 'enemy') {
                await this.#state.battleManager.performEnemyAttack({ preemptive: true });
                if (player.hp <= 0) {
                    this.handleDefeat();
                    return;
                }
            }

            await this.#state.battleManager.performPlayerAttack();
            this.checkBattleState();
        } catch (error) {
            console.error('[??? ????????????', error);
            this.handleError(error, '??????);
            this.#ui.setActionButtonEnabled(true);
        }
    }

    // ??: ?꾪닾 ?곹깭 ?뺤씤 硫붿??
    checkBattleState() {
        try {
            const player = this.#state.getPlayer();
            const enemy = this.#state.getEnemy();

            if (!player || !enemy) {
                console.error('[??? ??????????????보? ?????', { player, enemy });
                this.#ui.setActionButtonEnabled(true);
                return;
            }

            if (enemy.hp <= 0) {
                this.handleVictory();
                return;
            }

            if (player.hp <= 0) {
                this.handleDefeat();
                return;
            }

            const enemyAlreadyActed = this.#state.battleManager?.hasEnemyActedThisRound?.() ?? false;
            if (enemyAlreadyActed) {
                this.#ui.setActionButtonEnabled(true);
                return;
            }

            this.handleEnemyTurn();
        } catch (error) {
            console.error('[??? ???????????', error);
            this.handleError(error, '?????????);
            this.#ui.setActionButtonEnabled(true);
        }
    }

    // ??: ????泥섎??硫붿??
    handleEnemyTurn() {
        try {
            const battleManager = this.#state.battleManager;
            if (!battleManager) {
                console.error('[치명] BattleManager가 ????????진행?????????');
                this.#ui.setActionButtonEnabled(true);
                return;
            }

            if (battleManager.hasEnemyActedThisRound?.()) {
                this.#ui.setActionButtonEnabled(true);
                return;
            }

            setTimeout(() => {
                battleManager.performEnemyAttack()
                    .then(() => {
                        if (this.#state.getPlayer().hp > 0) {
                            this.#ui.setActionButtonEnabled(true);
                        } else {
                            this.handleDefeat();
                        }
                    })
                    .catch(error => {
                        console.error('[??? ????처리 ???', error);
                        this.handleError(error, '????);
                        this.#ui.setActionButtonEnabled(true);
                    });
            }, 350);
        } catch (error) {
            console.error('[??? ??????줄링 ??', error);
            this.handleError(error, '??????줄링');
            this.#ui.setActionButtonEnabled(true);
        }
    }
}



