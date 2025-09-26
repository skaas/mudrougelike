import { GameState } from './state/GameState.js';
import { UIManager } from './UIManager.js';
import { RewardSystem } from './RewardSystem.js';
import { MESSAGE_DELAYS, ACTION_TYPES } from './constants.js';
import { EventEmitter } from './EventEmitter.js';
import { GAME_PHASES } from './constants.js';
import { MESSAGE_TYPES } from './constants.js';
import { EVENT_TYPES } from './EventTypes.js';
import { AsyncUtils } from './utils/AsyncUtils.js';
import { GameStateTransaction } from './state/GameStateTransaction.js';\nimport { CardRegistry } from './app/cards/index.js';

export class Game {
    #eventEmitter;
    #ui;
    #state;
    #rewardSystem;
    #updateCheckTimer;
    #initialStatusSet = true;

    constructor() {
        this.#eventEmitter = new EventEmitter();
        this.#state = new GameState(this.#eventEmitter);
        
        this.#ui = new UIManager(this.#eventEmitter);
        
        this.#rewardSystem = new RewardSystem(this.#eventEmitter, this.#state);

        this.#cardRegistry = new CardRegistry(this.#eventEmitter, {
            battleManager: this.#state.battleManager,
            rewardManager: this.#state.rewardManager
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
                        console.error('[카드] 선택 적용 중 오류:', error);
                    }
                });
            } else {
                const selected = options[0];
                try {
                    this.#cardRegistry.applyCard(selected.key, { player });
                    this.#eventEmitter.emit('ui:log-message', {
                        message: [카드] 를 자동으로 선택했습니다.,
                        type: 'system'
                    });
                } catch (error) {
                    console.error('[카드] 자동 적용 실패:', error);
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

    async addGameMessage(message, type, delay = MESSAGE_DELAYS.DEFAULT) {
        try {
            await this.#eventEmitter.emit('game:message', {
                type,
                message,
                delay
            });
        } catch (error) {
            console.error('硫붿떆吏 泥섎━ 以??ㅻ쪟 諛쒖깮:', error);
            // ?ㅻ쪟 蹂듦뎄 濡쒖쭅
        }
    }

    async initialize() {
        console.log('寃뚯엫 珥덇린???쒖옉');
        
        try {
            this.#eventEmitter.emit('game:initialize');
            
            // 濡쒓렇 而⑦뀒?대꼫 珥덇린???뺤씤
            this.#ui.ensureLogContainerExists();
            
            // 紐낆떆?곸쑝濡??쒖옉 硫붿떆吏 異붽?
            const initialMessage = document.createElement('div');
            initialMessage.textContent = '寃뚯엫???쒖옉?⑸땲??..';
            initialMessage.className = 'log-entry narrative';
            this.#ui.elements.logContainer.appendChild(initialMessage);
            
            console.log('寃뚯엫 ?곹깭 珥덇린????);
            this.#state.initialize();
            console.log('寃뚯엫 ?곹깭 珥덇린???꾨즺');
            
            // ?붾쾭源낆슜 - ?꾩옱 ?뚮젅?댁뼱? ???곹깭 ?뺤씤
            console.log('?꾩옱 ?뚮젅?댁뼱:', this.#state.getPlayer());
            console.log('?꾩옱 ??', this.#state.getEnemy());

            // 泥?踰덉㎏ 硫붿떆吏 吏곸젒 異붽? (?대깽???쒖뒪???고쉶)
            try {
                const message = `${this.#state.getCurrentStage()}痢듭쓣 ?먰뿕?섍퀬 ?덈떎...`;
                const logEntry = document.createElement('div');
                logEntry.textContent = message;
                logEntry.className = 'log-entry narrative';
                this.#ui.elements.logContainer.appendChild(logEntry);
                console.log('泥?硫붿떆吏 吏곸젒 異붽?:', message);
            } catch (msgError) {
                console.error('泥?硫붿떆吏 吏곸젒 異붽? ?ㅽ뙣:', msgError);
            }
            
            // ?쎄컙??吏?????꾪닾 以鍮??쒖옉
            await AsyncUtils.delay(500);
            
            // 珥덇린???쒖뿉????踰덈쭔 updateNarrative ?몄텧
            // ?곹깭李?珥덇린??諛?以묐났 硫붿떆吏 諛⑹? ?뚮옒洹?
            this.#initialStatusSet = true;
            await this.updateNarrative("愿묒떊?꾨뱾???먮졊??愿痢≪냼???좎엯?덈떎.", "init", true);
            await this.updateNarrative("?닿납???덊솚?섍퀬 ?됲솕瑜??섏갼?꾩빞 ?쒕떎.", "init", true);
            
            console.log('?꾪닾 以鍮??④퀎 ?쒖옉...');
            await this.prepareNextBattle();
        } catch (error) {
            console.error('寃뚯엫 珥덇린??以??ㅻ쪟 諛쒖깮:', error);
            // ?ㅻ쪟 硫붿떆吏 ?쒖떆
            this.#ui.addLogMessage('寃뚯엫 珥덇린??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?섏씠吏瑜??덈줈怨좎묠?댁＜?몄슂.', 'system-error');
        }
    }

    async startBattle() {
        const transaction = new GameStateTransaction(this.#state);
        console.log('[?붾쾭洹? startBattle ?몄텧??- ?꾩옱 寃뚯엫 ?④퀎:', this.#state.getGamePhase());
        
        try {
            // ?몃옖??뀡?쇰줈 ?곹깭 蹂寃?以鍮?
            transaction
                .set('gamePhase', GAME_PHASES.BATTLE)
                .set('turns', 0);
            
            // ?꾪닾 ?쒖옉 硫붿떆吏
            await this.#ui.addLogMessage(
                "=== ?꾪닾 ?쒖옉 ===",
                MESSAGE_TYPES.NARRATIVE
            );
            
            // ?곹깭 蹂寃??뺤젙
            transaction.commit();
            console.log('[?붾쾭洹? 寃뚯엫 ?④퀎媛 BATTLE濡?蹂寃쎈맖 - 蹂寃???', this.#state.getGamePhase());
            
            // BattleManager???꾩슂??李몄“ ?ㅼ젙
            // ?ш린媛 臾몄젣?????덉쓬 - BattleManager???꾩슂??李몄“媛 ?놁쓣 ???덉쓬
            if (!this.#state.battleManager) {
                console.error('[?ш컖] BattleManager媛 ?놁뒿?덈떎!');
                return;
            }
            
            // BattleManager??李몄“ ?ㅼ젙 (?꾩슂??寃쎌슦)
            if (!this.#state.battleManager.gameState) {
                console.log('[?붾쾭洹? BattleManager??gameState 李몄“ ?ㅼ젙');
                this.#state.battleManager.gameState = this.#state;
            }
            
            if (!this.#state.battleManager.playerManager) {
                console.log('[?붾쾭洹? BattleManager??playerManager 李몄“ ?ㅼ젙');
                this.#state.battleManager.playerManager = this.#state.playerManager;
            }
            
            if (!this.#state.battleManager.enemyManager) {
                console.log('[?붾쾭洹? BattleManager??enemyManager 李몄“ ?ㅼ젙');
                this.#state.battleManager.enemyManager = this.#state.enemyManager;
            }
            
            // battle:start ?대깽??諛쒖깮 ??濡쒓렇
            console.log('[?붾쾭洹? battle:start ?대깽??諛쒖깮 以鍮?);
            
            // battle:start ?대깽??諛쒖깮 異붽?
            await this.#eventEmitter.emit('battle:start', {
                player: this.#state.getPlayer(),
                enemy: this.#state.getEnemy(),
                stage: this.#state.getCurrentStage()
            });
            
            // ?꾪닾 ?쒖옉 ???≪뀡 踰꾪듉 ?쒖꽦??- 紐낆떆???뺤씤 異붽?
            console.log('[?붾쾭洹? ?꾪닾 ?쒖옉: ?≪뀡 踰꾪듉 ?쒖꽦??以?..');
            this.#ui.setActionButtonEnabled(true);
            
            // ?붾쾭源?- ?≪뀡 踰꾪듉 ?뺤씤
            if (this.#ui.elements.actionButton) {
                console.log('[?붾쾭洹? ?≪뀡 踰꾪듉 ?곹깭: ', {
                    disabled: this.#ui.elements.actionButton.disabled,
                    innerText: this.#ui.elements.actionButton.innerText
                });
            } else {
                console.error('[?ш컖] ?≪뀡 踰꾪듉 ?붿냼媛 ?놁뒿?덈떎!');
            }
            
            // ?쎄컙??吏?????ㅼ떆 ?쒕쾲 ?쒖꽦???쒕룄
            setTimeout(() => {
                console.log('[?붾쾭洹? ?≪뀡 踰꾪듉 ?쒖꽦???ъ떆??);
                this.#ui.setActionButtonEnabled(true);
            }, 500);
            
            // 3?몄묶 ?대윭?곕툕 異붽?
            const enemy = this.#state.getEnemy();
            const narrativeText = `洹뱀???湲곗궗??臾닿린瑜??⑤떒??伊먭퀬 ${enemy.name}????꾪닾瑜??쒖옉?덈떎. ???몄????대뼸寃??앸궇吏???ㅼ쭅 ?좊뱾留뚯씠 ?뚭퀬 ?덉뿀??`;
            await this.updateNarrative(narrativeText, 'battle-start', true);
        } catch (error) {
            // ?ㅻ쪟 諛쒖깮 ???몃옖??뀡 濡ㅻ갚
            transaction.rollback();
            console.error('?꾪닾 ?쒖옉 以??ㅻ쪟:', error);
            this.handleError(error, '?꾪닾 ?쒖옉');
        }
    }

    async performAction() {
        try {
            console.log('[?붾쾭洹? ?≪뀡 踰꾪듉 ?대┃??- ?꾩옱 寃뚯엫 ?④퀎:', this.#state.getGamePhase());
            
            // 寃뚯엫 ?곹깭???곕씪 ?ㅻⅨ ?≪뀡 ?섑뻾
            const gamePhase = this.#state.getGamePhase();
            
            switch (gamePhase) {
                case GAME_PHASES.BATTLE:
                    console.log('[?붾쾭洹? ?꾪닾 ?≪뀡 ?ㅽ뻾 ?쒕룄');
                    this.executeBattleAction();
                    break;
                case GAME_PHASES.EXPLORE:
                    console.log('[?붾쾭洹? ?먯깋 ?≪뀡 ?ㅽ뻾');
                    this.prepareNextBattle();
                    break;
                case GAME_PHASES.REWARD:
                    console.log('[?붾쾭洹? 蹂댁긽 ?≪뀡 ?ㅽ뻾');
                    this.completeRewardPhase();
                    break;
                default:
                    console.warn('?????녿뒗 寃뚯엫 ?④퀎?먯꽌???≪뀡:', gamePhase);
                    // 湲곕낯?곸쑝濡??꾪닾 以鍮??④퀎濡??꾪솚
                    this.prepareNextBattle();
            }
        } catch (error) {
            console.error('?≪뀡 ?섑뻾 以??ㅻ쪟 諛쒖깮:', error);
            this.handleError(error, '?≪뀡 ?섑뻾');
        }
    }

    async executeBattlePhase(selectedAction, result) {
        // 1. ?뚮젅?댁뼱 ???대깽??諛쒖깮
        await this.executePlayerTurn(selectedAction, result);
        
        // 2. ?곹깭 ?낅뜲?댄듃
        await this.updateGameState();
        
        // 3. ?꾪닾 寃곌낵 ?뺤씤
        if (this.#state.enemy.hp <= 0) {
            await this.handleVictory();
            return;
        }
        
        // 4. ?????ㅽ뻾
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
            '?뚮젅?댁뼱 ??泥섎━ ?ㅽ뙣'
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
            '寃뚯엫 ?곹깭 ?낅뜲?댄듃 ?ㅽ뙣'
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
            console.error('????泥섎━ 以??ㅻ쪟 諛쒖깮:', error);
            // ?ㅻ쪟 蹂듦뎄 濡쒖쭅
        }
    }

    async handleBattleError(error) {
        // ?ㅻ쪟 濡쒓렇 湲곕줉
        console.error('?꾪닾 ?ㅻ쪟:', error);
        
        // ?ъ슜?먯뿉寃??ㅻ쪟 硫붿떆吏 ?쒖떆
        await this.addGameMessage(
            '?꾪닾 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.',
            MESSAGE_TYPES.ERROR
        );
        
        // ?꾩슂??寃쎌슦 寃뚯엫 ?곹깭 蹂듦뎄
        this.recoverGameState();
    }

    recoverGameState() {
        // 媛??理쒓렐 ?좏슚 ?곹깭濡?蹂듭썝
        // ?먮뒗 ?덉쟾??湲곕낯媛믪쑝濡??ㅼ젙
    }

    generateActionMessages(action, result) {
        const messages = [];
        const totalDamage = result?.damage ?? 0;

        if (result?.skipped) {
            messages.push('?숆껐 ?곹깭! ?됰룞 遺덇?濡??댁쓣 ?섍꼈??');
            return messages;
        }

        if (result?.isCritical) {
            messages.push(`移섎챸?! ${action.name}??媛뺣젰?섍쾶 ?곸쨷?덈떎. (?쇳빐: ${totalDamage})`);
        } else if (action?.type === ACTION_TYPES.DEFENSE) {
            messages.push(`${action.name} ?먯꽭濡??ㅼ쓬 怨듦꺽???鍮꾪븳??`);
        } else {
            messages.push(`${action.name} 怨듦꺽! (?쇳빐: ${totalDamage})`);
        }

        if (result?.armorGain > 0) {
            messages.push(`諛⑹뼱 ?쒖꽭! (諛⑹뼱??+${result.armorGain})`);
        }

        if (result?.lifeSteal?.applied > 0) {
            messages.push(`?≫삁 ?④낵 諛쒕룞! 泥대젰 ${result.lifeSteal.applied} ?뚮났.`);
        }

        if (result?.thorns?.applied > 0) {
            messages.push(`媛??諛섍꺽! ?곷??먭쾶 ${result.thorns.applied} ?쇳빐 諛섏궗.`);
        }

        if (result?.freezeApplied) {
            messages.push('?숆껐 ?깃났! ?곸씠 1???숈븞 ?됰룞 遺덇?.');
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
            // ?ㅼ쓬 ?꾪닾 以鍮?
            const wasInBattle = this.#state.visitedStages.has(this.#state.stage);
            if (wasInBattle) {
                this.#state.increaseStage();
                this.#state.increaseLevel();
            }
            
            const statModifier = this.#state.calculateRandomStatModifier();
            this.#state.resetEnemyWithLevel(this.#state.level, statModifier);
            
            // UI ?낅뜲?댄듃
            this.#eventEmitter.emit('state:update', {
                player: this.#state.player,
                enemy: this.#state.enemy,
                gamePhase: this.#state.gamePhase,
                stage: this.#state.stage,
                isBossBattle: this.#state.isBossStage()
            });

            // ?≪뀡 踰꾪듉 ?ㅼ떆 ?쒖꽦??
            this.#ui.setActionButtonEnabled(true);
        });
    }

    async handleDefeat() {
        this.#eventEmitter.emit('game:message', {
            type: 'narrative-emphasis',
            message: '?곕윭議뚮떎...'
        });

        this.#ui.showGameOver();
    }

    async handleVictory() {
        try {
            console.log('[?붾쾭洹?handleVictory] ?밸━ 泥섎━ ?쒖옉');
            
            // ??泥섏튂 泥섎━ - ?뺣낫 蹂댁〈
            this.#state.enemyManager.handleEnemyDefeat();
            
            // ?뚮젅?댁뼱? ??媛앹껜 ?뺤씤
            const player = this.#state.getPlayer();
            const enemy = this.#state.getEnemy(); // ?댁젣 lastDefeatedEnemy瑜?諛섑솚??寃껋엫
            
            console.log('[?붾쾭洹?handleVictory] ?꾩옱 媛앹껜 ?곹깭:', {
                player: {
                    level: player?.level,
                    exp: player?.exp,
                    maxExp: player?.maxExp
                },
                enemy: {
                    level: enemy?.level,
                    exp: enemy?.exp,
                    maxExp: enemy?.maxExp
                }
            });

            if (!player || !enemy) {
                throw new Error('?뚮젅?댁뼱 ?먮뒗 ??媛앹껜媛 ?놁뒿?덈떎.');
            }

            // UI ?낅뜲?댄듃 ?대깽??諛쒖깮
            await this.#eventEmitter.emit('state:update', {
                enemy: enemy,
                player: player,
                gamePhase: 'victory'
            });

            await this.#eventEmitter.emit('game:message', {
                type: 'narrative-emphasis',
                message: '?곸쓣 臾쇰━爾ㅻ떎!'
            });

            const expGained = enemy?.exp || 0;
            console.log('[?붾쾭洹?handleVictory] ?띾뱷??寃쏀뿕移?', expGained);
            
            // 寃쏀뿕移??띾뱷 ?쒕룄
            try {
                console.log('[?붾쾭洹?handleVictory] 寃쏀뿕移??띾뱷 ?쒕룄 ???뚮젅?댁뼱 ?곹깭:', {
                    level: player.level,
                    exp: player.exp,
                    maxExp: player.maxExp
                });

                console.log('[Game] calling addExperience', expGained);
            const expResult = this.#state.addExperience(expGained);
            console.log('[Game] addExperience returned', expResult);
                const appliedExp = (expResult && typeof expResult.gainedExp === 'number')
                    ? expResult.gainedExp
                    : expGained;
                console.log('[?붾쾭洹?handleVictory] 寃쏀뿕移??띾뱷 寃곌낵:', expResult);
                
                await this.#eventEmitter.emit('status:update', {
                    messages: [
                        '=== Battle Result ===',
                        `Experience gained: +${appliedExp}`,
                        `Current EXP: ${expResult.currentExp}/${expResult.maxExp}`,
                        expResult.leveledUp ? 'Level up!' : ""
                    ].filter(msg => msg),
                    append: true
                });

                // 蹂댁긽 ?쒖떆 ???곹깭 ?뺤씤
                if (!this.#state.getPlayer() || !this.#state.getEnemy()) {
                    throw new Error('蹂댁긽 ?쒖떆 ??寃뚯엫 ?곹깭媛 ?좏슚?섏? ?딆뒿?덈떎.');
                }

                console.log('[?붾쾭洹?handleVictory] 蹂댁긽 ?쒖떆 ???곹깭:', {
                    player: this.#state.getPlayer(),
                    enemy: this.#state.getEnemy()
                });

                await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAYS.REWARD));
                await this.#rewardSystem.showRewards();
                
                // 蹂댁긽 泥섎━ ?꾨즺 ?????뺣낫 珥덇린??
                this.#state.enemyManager.clearDefeatedEnemy();
                
                this.#eventEmitter.emit('battle:end', { victory: true });
            } catch (expError) {
                console.error('[?ㅻ쪟/handleVictory] 寃쏀뿕移?泥섎━ 以??ㅻ쪟:', expError);
                this.handleError(expError, '寃쏀뿕移?泥섎━');
                // 寃뚯엫???덉쟾 紐⑤뱶濡??꾪솚
                this.pauseGame();
            }
        } catch (error) {
            console.error('[?ㅻ쪟/handleVictory] ?밸━ 泥섎━ 以??ㅻ쪟:', error);
            this.handleError(error, '?밸━ 泥섎━');
            // 寃뚯엫???덉쟾 紐⑤뱶濡??꾪솚
            this.pauseGame();
        }
    }

    // 寃뚯엫 ?쇱떆 ?뺤? 硫붿꽌??異붽?
    pauseGame() {
        try {
            // ?≪뀡 踰꾪듉 鍮꾪솢?깊솕
            this.#ui.setActionButtonEnabled(false);
            
            // 寃뚯엫 ?곹깭瑜??쇱떆 ?뺤?濡?蹂寃?
            this.#state.setGamePhase('paused');
            
            // ?ъ슜?먯뿉寃??뚮┝
            this.#eventEmitter.emit('game:message', {
                type: 'system-error',
                message: '寃뚯엫???ㅻ쪟媛 諛쒖깮?섏뿬 ?쇱떆 ?뺤??섏뿀?듬땲?? ?섏씠吏瑜??덈줈怨좎묠?댁＜?몄슂.'
            });
        } catch (error) {
            console.error('寃뚯엫 ?쇱떆 ?뺤? 以??ㅻ쪟:', error);
        }
    }

    // 寃뚯엫 醫낅즺 ???뺣━
    shutdown() {
        // 紐⑤뱺 而댄룷?뚰듃 ?대깽???뺣━
        this.#eventEmitter.removeAllListeners(this);
        this.#ui.cleanup();
        
        // DOM ?대깽???뺣━ ??異붽? ?묒뾽...
    }

    handleError(error, context = '') {
        console.error(`寃뚯엫 ?ㅻ쪟 (${context}):`, error);
        
        // UI???ㅻ쪟 ?쒖떆
        this.#ui.addLogMessage(`?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎 (${context}). 寃뚯엫???ъ떆?묓빀?덈떎.`, 'system-error');
        
        // ?꾩슂??寃뚯엫 ?곹깭 蹂듦뎄 ?쒕룄
        try {
            // ?뚮젅?댁뼱媛 ?놁쑝硫??ㅼ떆 ?앹꽦
            if (!this.#state.getPlayer()) {
                this.#state.playerManager.createPlayer();
            }
            
            // ?곸씠 ?놁쑝硫??ㅼ떆 ?앹꽦
            if (!this.#state.getEnemy()) {
                this.#state.enemyManager.createEnemy(1); // ?덈꺼 1濡??앹꽦
            }
            
            // UI 媛뺤젣 ?낅뜲?댄듃
            this.#ui.updateAll();
            
            // 1珥????ъ떆???쒕룄
            setTimeout(() => this.prepareNextBattle(), 1000);
        } catch (recoveryError) {
            console.error('?ㅻ쪟 蹂듦뎄 ?ㅽ뙣:', recoveryError);
            // 蹂듦뎄 ?ㅽ뙣 ???섏씠吏 ?덈줈怨좎묠 ?좊룄
            this.#ui.addLogMessage('寃뚯엫??蹂듦뎄?????놁뒿?덈떎. ?섏씠吏瑜??덈줈怨좎묠?댁＜?몄슂.', 'system-error');
        }
    }

    async prepareNextBattle() {
        try {
            // 珥덇린??以묒뿉??以묐났 硫붿떆吏 諛⑹?
            if (this.#initialStatusSet) {
                this.#initialStatusSet = false;
                console.log('珥덇린??以묒씠誘濡??곹깭李?硫붿떆吏 ?낅뜲?댄듃 ?앸왂');
            } else {
                // ?꾪닾 以鍮??곹깭 ?낅뜲?댄듃
                await this.updateNarrative(`洹뱀???湲곗궗??${this.#state.getCurrentStage()}痢듭뿉 ?꾩갑?덈떎. ?꾪닾瑜?以鍮꾪븯硫댁꽌 洹몄쓽 諛쒓구?뚯? 議곗떖?ㅻ윭?뚯죱怨? ?덈튆? 寃곗쓽??李⑥삱?먮떎.`, "battle-prepare", true);
            }
            
            console.log('?ㅼ쓬 ?꾪닾 以鍮?以?..');
            
            // ???앹꽦 ?뺤씤 - 二쎌? 寃쎌슦?먮쭔 ?덈줈 ?앹꽦
            const currentEnemy = this.#state.getEnemy();
            if (!currentEnemy || currentEnemy.isDead()) {
                const level = this.#state.getCurrentLevel();
                const isBoss = this.#state.isBossStage();
                console.log(`???앹꽦: ?덈꺼 ${level}, 蹂댁뒪 ?щ?: ${isBoss}`);
                
                // ???앹꽦
                this.#state.enemyManager.createEnemy(level, isBoss);
            } else {
                console.log('?대? ?곸씠 議댁옱?⑸땲??', currentEnemy.name);
            }
            
            // ???뺣낫 硫붿떆吏 異쒕젰
            const enemy = this.#state.getEnemy();
            await this.addGameMessage(
                `${enemy.name}? 留덉＜爾ㅻ떎!`,
                MESSAGE_TYPES.ENEMY_EMPHASIS
            );
            
            // ?꾪닾 ?쒖옉 踰꾪듉 硫붿떆吏 異붽?
            await this.addGameMessage({
                text: "?꾪닾 ?쒖옉",
                onClick: () => {
                    this.#state.setGamePhase(GAME_PHASES.BATTLE);
                    this.startBattle();
                    // 5珥????≪뀡 踰꾪듉???ъ쟾??鍮꾪솢?깊솕 ?곹깭?몄? ?뺤씤
                    setTimeout(() => {
                        if (this.#ui.elements.actionButton && this.#ui.elements.actionButton.disabled) {
                            console.log('?≪뀡 踰꾪듉???ъ쟾??鍮꾪솢?깊솕 ?곹깭?낅땲?? 媛뺤젣 ?쒖꽦???쒕룄...');
                            this.#ui.elements.actionButton.disabled = false;
                            this.#ui.elements.actionButton.style.opacity = '1';
                            // 踰꾪듉 ?대┃ ?⑥닔 吏곸젒 ?곌껐
                            this.#ui.elements.actionButton.onclick = () => this.performAction();
                        }
                    }, 5000);
                }
            }, MESSAGE_TYPES.BUTTON);
            
            // ?≪뀡 踰꾪듉 鍮꾪솢?깊솕
            if (this.#ui.setActionButtonEnabled) {
                this.#ui.setActionButtonEnabled(false);
            } else {
                console.warn('setActionButtonEnabled ?⑥닔媛 ?놁뒿?덈떎');
            }

            // 3?몄묶 愿???대윭?곕툕 硫붿떆吏瑜??곹깭李쎌뿉 異붽? 紐⑤뱶濡??쒖떆
            const narrativeText = `洹뱀???湲곗궗??${enemy.name}? 留덉＜爾ㅻ떎. ?꾪닾瑜?以鍮꾪븯硫댁꽌 洹몄쓽 諛쒓구?뚯? 議곗떖?ㅻ윭?뚯죱怨? ?덈튆? 寃곗쓽??李⑥삱?먮떎.`;
            await this.updateNarrative(narrativeText, 'battle-prepare', true);
        } catch (error) {
            console.error('?ㅼ쓬 ?꾪닾 以鍮?以??ㅻ쪟:', error);
            this.handleError(error, '?꾪닾 以鍮?);
        }
    }

    async updateNarrative(message, context = null, append = false) {
        try {
            console.log('?대윭?곕툕 硫붿떆吏 ?낅뜲?댄듃 ?쒖옉 (?몄텧 ?ㅽ깮):', new Error().stack);
            
            // ?곹깭李쎌씠 ?놁쑝硫?珥덇린??
            if (!this.#ui?.elements?.statusNarrative) {
                console.warn('?곹깭李쎌씠 ?놁뼱??珥덇린?붾? ?쒕룄?⑸땲??);
                this.#ui.initializeStatusContainer([]);
            }
            
            // ??댄븨 以묒뿉???댁쟾 ?뺤씤 ?묒뾽 痍⑥냼
            if (this.#updateCheckTimer) {
                clearTimeout(this.#updateCheckTimer);
            }
            
            // ?대깽??諛쒖깮
            const emitResult = await this.#eventEmitter.emit('narrative:update', {
                message, context, append
            });
            
            console.log('narrative:update ?대깽??諛쒖깮 寃곌낵:', emitResult);
            
            // ??댄븨 ?④낵媛 吏꾪뻾 以묒씤吏 ?뺤씤 ??寃利?濡쒖쭅 ?ㅽ뻾
            this.#updateCheckTimer = setTimeout(() => {
                // ??댄븨 以묒씠硫??뺤씤 ?곌린
                if (this.#ui.isTypingInProgress) {
                    console.log('??댄븨 吏꾪뻾 以? ?뺤씤 ?곌린...');
                    // ??댄븨???앸궇 ?뚭퉴吏 湲곕떎由?(理쒕? 2珥?
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
            
            // ?댁슜 寃利??⑥닔
            const validateContent = () => {
                try {
                    if (this.#ui.isTypingInProgress) {
                        console.log('??댄븨???꾩쭅 吏꾪뻾 以묒씠誘濡?寃利앹쓣 嫄대꼫?곷땲??);
                        return;
                    }
                    
                    const statusContent = this.#ui.elements.statusNarrative?.textContent;
                    const statusOk = statusContent && statusContent.includes(message.substring(0, 20));
                    
                    console.log('?곹깭李??낅뜲?댄듃 ?뺤씤:', { 
                        isDisplayed: statusOk,
                        contentLength: statusContent?.length || 0
                    });
                    
                    if (!statusOk) {
                        console.warn('??댄븨 ?꾨즺 ?꾩뿉??硫붿떆吏媛 ?놁뒿?덈떎. ?덈줈怨좎묠 ?⑸땲??);
                        this.#ui.refreshNarrativeStatus();
                    }
                } catch (error) {
                    console.error('?곹깭李??뺤씤 以??ㅻ쪟:', error);
                }
            };
        } catch (error) {
            console.error('?대윭?곕툕 硫붿떆吏 泥섎━ 以??ㅻ쪟 諛쒖깮:', error);
        }
    }

    testEventEmitter() {
        console.log("=== ?대깽???대???吏꾨떒 ?쒖옉 ===");
        this.#eventEmitter.logEventHandlers();
        
        console.log("=== ?대깽??諛쒖깮 ?뚯뒪??===");
        this.#eventEmitter.emit('narrative:update', {
            message: "?닿쾬? ?뚯뒪??硫붿떆吏?낅땲??",
            context: "test",
            append: false
        });
        
        // 2珥????ㅼ떆 ?뺤씤
        setTimeout(() => {
            console.log("=== ?대깽??泥섎━ ???곹깭 ===");
            console.log("?곹깭李??댁슜:", this.#ui.elements.statusNarrative?.textContent);
        }, 2000);
    }

    executeBattleAction() {
        this.executeBattleActionAsync();
    }

    async executeBattleActionAsync() {
        try {
            console.log('[디버그] executeBattleAction 호출됨');

            if (this.#state.getGamePhase() !== GAME_PHASES.BATTLE) {
                console.warn('[경고] 전투 상태가 아니어서 전투 행동을 수행할 수 없습니다:', this.#state.getGamePhase());
                this.#state.setGamePhase(GAME_PHASES.BATTLE);
                if (this.#state.getGamePhase() !== GAME_PHASES.BATTLE) {
                    console.error('[치명] 전투 상태로 전환할 수 없습니다.');
                    return;
                }
            }

            if (!this.#state.battleManager) {
                console.error('[치명] BattleManager가 없습니다.');
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
                console.error('[치명] 전투 대상이 올바르지 않습니다.', { player, enemy });
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
            console.error('[에러] 전투 행동 수행 중 오류:', error);
            this.handleError(error, '전투 행동');
            this.#ui.setActionButtonEnabled(true);
        }
    }

    // 異붽?: ?꾪닾 ?곹깭 ?뺤씤 硫붿꽌??
    checkBattleState() {
        try {
            const player = this.#state.getPlayer();
            const enemy = this.#state.getEnemy();

            if (!player || !enemy) {
                console.error('[에러] 전투 상태 확인 중 대상 정보가 없습니다.', { player, enemy });
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
            console.error('[에러] 전투 상태 확인 오류:', error);
            this.handleError(error, '전투 상태 확인');
            this.#ui.setActionButtonEnabled(true);
        }
    }

    // 異붽?: ????泥섎━ 硫붿꽌??
    handleEnemyTurn() {
        try {
            const battleManager = this.#state.battleManager;
            if (!battleManager) {
                console.error('[치명] BattleManager가 없어 적 턴을 진행할 수 없습니다.');
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
                        console.error('[에러] 적 턴 처리 중 오류:', error);
                        this.handleError(error, '적 턴');
                        this.#ui.setActionButtonEnabled(true);
                    });
            }, 350);
        } catch (error) {
            console.error('[에러] 적 턴 스케줄링 오류:', error);
            this.handleError(error, '적 턴 스케줄링');
            this.#ui.setActionButtonEnabled(true);
        }
    }
}



