import { EVENT_TYPES } from '../EventTypes.js';

export class RewardManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    
    generateRewards(playerLevel, isBossDefeat) {
        // 보상 생성 로직
        return [];
    }
    
    applyReward(player, reward) {
        // 선택된 보상 적용 로직
    }
    
    getRandomRewards(count) {
        // 랜덤하게 n개의 보상 선택
        return [];
    }
} 