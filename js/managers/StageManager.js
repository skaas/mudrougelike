import { STAGE_SETTINGS } from '../constants.js';
import { EVENT_TYPES } from '../EventTypes.js';

export class StageManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.stage = 1;
        this.level = 1;
        this.visitedStages = new Set();
    }
    
    initialize() {
        this.stage = 1;
        this.level = 1;
        this.visitedStages = new Set();
    }
    
    getCurrentStage() { return this.stage; }
    getCurrentLevel() { return this.level; }
    
    increaseStage() {
        this.stage++;
        this.visitedStages.add(this.stage);
        this.eventEmitter.emit(EVENT_TYPES.STAGE.CHANGED, { stage: this.stage });
    }
    
    increaseLevel() { 
        this.level++;
        this.eventEmitter.emit(EVENT_TYPES.STAGE.LEVEL_CHANGED, { level: this.level });
    }
    
    isBossStage() {
        // 보스 스테이지 여부 확인 로직
        return this.stage % STAGE_SETTINGS.BOSS_INTERVAL === 0;
    }
} 