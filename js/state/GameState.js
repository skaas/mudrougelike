// GameState???댁젣 ?ㅻⅨ 愿由ъ옄 ?대옒?ㅻ뱾??議고빀?섏뿬 ?ъ슜?⑸땲??import { GAME_PHASES } from '../constants.js';
import { EVENT_TYPES } from '../EventTypes.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { EnemyManager } from '../managers/EnemyManager.js';
import { BattleManager } from '../managers/BattleManager.js';
import { StageManager } from '../managers/StageManager.js';
import { RewardManager } from '../rewards/RewardManager.js';

export class GameState {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.playerManager = new PlayerManager(eventEmitter);
        this.enemyManager = new EnemyManager(eventEmitter);
        this.battleManager = new BattleManager(eventEmitter);
        this.stageManager = new StageManager(eventEmitter);
        this.rewardManager = new RewardManager(eventEmitter);
        
        // 湲곕낯 寃뚯엫 ?곹깭 蹂?섎뱾 (理쒖냼?쒖쑝濡??좎?)
        this.gamePhase = GAME_PHASES.EXPLORE;
        this.isGameOver = false;
        
        this.setupEventListeners(this);
    }
    
    // ?대깽???붿껌???묐떟?섎뒗 ?몃뱾?щ쭔 ?④퉩?덈떎
    setupEventListeners(component) {
        this.eventEmitter.on(EVENT_TYPES.STATE.REQUEST_UPDATE, 
            this.handleUpdateRequest.bind(this), component);
        
        // ?대윭?곕툕 ?낅뜲?댄듃 ?대깽??異붽?
        this.eventEmitter.on('narrative:update', 
            this.handleNarrativeUpdate.bind(this), component);
    }
    
    // ?곹깭 ?낅뜲?댄듃 ?붿껌 泥섎━ - 媛?留ㅻ땲??먭쾶 ?꾩엫
    handleUpdateRequest(data = {}) {
        // ?듯빀 ?곹깭 ?뺣낫 ?앹꽦
        const stateData = {
            player: this.playerManager.getPlayer(),
            enemy: this.enemyManager.getEnemy(),
            gamePhase: this.gamePhase,
            stage: this.stageManager.getCurrentStage(),
            isBossBattle: this.stageManager.isBossStage()
        };
        
        // ?뱀젙 ?좏삎留??붿껌??寃쎌슦
        if (data.type === 'player') {
            this.eventEmitter.emit(EVENT_TYPES.STATE.PLAYER_UPDATE, stateData.player);
        } else if (data.type === 'enemy') {
            this.eventEmitter.emit(EVENT_TYPES.STATE.ENEMY_UPDATE, stateData.enemy);
        } else {
            // ?꾩껜 ?곹깭 ?낅뜲?댄듃
            globalThis.__debugLog?.push?.(['GameState','?꾩껜 寃뚯엫 ?곹깭 ?낅뜲?댄듃:', stateData);
            this.eventEmitter.emit('state:update', stateData);
        }
    }
    
    // 寃뚯엫 珥덇린??- 媛?留ㅻ땲??먭쾶 ?꾩엫
    initialize() {
        try {
            globalThis.__debugLog?.push?.(['GameState','GameState 珥덇린???쒖옉');
            
            this.stageManager.initialize();
            globalThis.__debugLog?.push?.(['GameState','?ㅽ뀒?댁? 留ㅻ땲? 珥덇린???꾨즺');
            
            this.playerManager.createPlayer();
            globalThis.__debugLog?.push?.(['GameState','?뚮젅?댁뼱 ?앹꽦 ?꾨즺:', this.playerManager.getPlayer());
            
            // ?덈꺼 ?좏슚???뺤씤
            const currentLevel = this.stageManager.getCurrentLevel();
            if (!currentLevel || currentLevel < 1) {
                console.error('?좏슚?섏? ?딆? ?덈꺼:', currentLevel);
                // 湲곕낯媛믪쑝濡?1 ?ъ슜
                this.enemyManager.createEnemy(1);
            } else {
                this.enemyManager.createEnemy(currentLevel);
            }
            
            globalThis.__debugLog?.push?.(['GameState','???앹꽦 ?꾨즺:', this.enemyManager.getEnemy());
            
            // ?몄뒪?댁뒪 議댁옱 ?뺤씤
            if (!this.playerManager.getPlayer()) {
                throw new Error('?뚮젅?댁뼱 ?몄뒪?댁뒪媛 ?앹꽦?섏? ?딆븯?듬땲??');
            }
            
            if (!this.enemyManager.getEnemy()) {
                throw new Error('???몄뒪?댁뒪媛 ?앹꽦?섏? ?딆븯?듬땲??');
            }
            
            this.eventEmitter.emit(EVENT_TYPES.STATE.INITIALIZED);
            globalThis.__debugLog?.push?.(['GameState','GameState 珥덇린???꾨즺');
        } catch (error) {
            console.error('GameState 珥덇린??以??ㅻ쪟:', error);
            // ?ㅻ쪟 ?대깽??諛쒖깮
            this.eventEmitter.emit('error:initialization', { error });
        }
    }
    
    // 寃뚯엫 ?④퀎 ?쒖뼱 硫붿꽌??    setGamePhase(phase) {
        if (!Object.values(GAME_PHASES).includes(phase)) {
            console.error('?섎せ??寃뚯엫 ?④퀎:', phase);
            return false;
        }
        
        const oldPhase = this.gamePhase;
        this.gamePhase = phase;
        
        globalThis.__debugLog?.push?.(['GameState',`[?붾쾭洹? 寃뚯엫 ?④퀎 蹂寃? ${oldPhase} -> ${phase}`);
        
        // 寃뚯엫 ?④퀎 蹂寃??대깽??諛쒖깮
        this.eventEmitter.emit('game:phase-change', { 
            oldPhase, 
            newPhase: phase 
        });
        
        return true;
    }
    
    // 紐?媛吏 ?듭떖 ?꾩엫 硫붿꽌?쒕쭔 ?좎?
    selectPlayerAction() {
        return this.battleManager.selectPlayerAction(
            this.playerManager.getPlayer()
        );
    }
    
    executeAction(action, actor, target) {
        return this.battleManager.executeAction(action, actor, target);
    }
    
    // 寃뚯엫 ?곹깭 ?묎렐??硫붿꽌??(getter)
    getPlayer() { return this.playerManager.getPlayer(); }
    getEnemy() { return this.enemyManager.getEnemy(); }
    getCurrentStage() { return this.stageManager.getCurrentStage(); }
    getCurrentLevel() { return this.stageManager.getCurrentLevel(); }
    getGamePhase() { return this.gamePhase; }
    isGameEnded() { return this.isGameOver; }
    
    isBossStage() {
        return this.stageManager.isBossStage();
    }
    
    // ?대윭?곕툕 ?낅뜲?댄듃 ?몃뱾??異붽?
    handleNarrativeUpdate(data) {
        try {
            globalThis.__debugLog?.push?.(['GameState','GameState: ?대윭?곕툕 ?낅뜲?댄듃 泥섎━:', data?.message?.substring(0, 30) + '...');
            
            // 寃뚯엫 ?곹깭 ?낅뜲?댄듃 泥섎━
            if (data && data.message) {
                // ?꾩슂???곹깭 ?낅뜲?댄듃 濡쒖쭅留??ш린??泥섎━
                
                return true;
            }
        } catch (error) {
            console.error('GameState: ?대윭?곕툕 ?낅뜲?댄듃 泥섎━ 以??ㅻ쪟:', error);
        }
        return false;
    }
    
        addExperience(amount) {\n        globalThis.__debugLog?.push?.(['GameState','[GameState] addExperience invoked', amount);
        const player = this.playerManager.getPlayer();
        if (!player) {
            console.error('플레이어 객체가 없습니다!');
            return { currentExp: 0, maxExp: 0, level: 0, leveledUp: false };
        }

        const hasImportMeta = typeof import.meta !== 'undefined' && import.meta && import.meta.env;
        const devScale = (hasImportMeta && import.meta.env.DEV) ||
            (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');
        const expGain = devScale ? amount * 10 : amount;

        globalThis.__debugLog?.push?.(['GameState','[GameState] addExperience input', {
            amount,
            expGain,
            level: player.level,
            currentExp: player.exp,
            maxExp: player.maxExp
        });

        const leveledUp = this.playerManager.gainExp(expGain);

        globalThis.__debugLog?.push?.(['GameState','[GameState] addExperience result', {
            afterExp: player.exp,
            maxExp: player.maxExp,
            leveledUp
        });

        return {
            currentExp: player.exp,
            gainedExp: expGain,
            maxExp: player.maxExp,
            level: player.level,
            leveledUp
        };
    }
} 












