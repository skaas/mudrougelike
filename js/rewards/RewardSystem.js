export class RewardSystem {
    constructor(eventEmitter, gameState) {
        console.log('[디버그/RewardSystem] 초기화 시작');
        this.eventEmitter = eventEmitter;
        this.gameState = gameState;
        
        // 초기화 시 필수 의존성 검증
        if (!eventEmitter) {
            throw new Error('RewardSystem: eventEmitter가 필요합니다.');
        }
        if (!gameState) {
            throw new Error('RewardSystem: gameState가 필요합니다.');
        }
        
        this.validateGameState();
        console.log('[디버그/RewardSystem] 초기화 완료');
    }

    // 게임 상태 유효성 검증
    validateGameState() {
        console.log('[디버그/RewardSystem] 게임 상태 검증 시작');
        
        if (!this.gameState.getPlayer) {
            throw new Error('RewardSystem: gameState.getPlayer 메서드가 없습니다.');
        }
        if (!this.gameState.getEnemy) {
            throw new Error('RewardSystem: gameState.getEnemy 메서드가 없습니다.');
        }
        
        // 플레이어와 적 객체의 필수 속성 검증
        const player = this.gameState.getPlayer();
        const enemy = this.gameState.getEnemy();
        
        console.log('[디버그/RewardSystem] 검증할 객체 상태:', {
            player: {
                exists: !!player,
                level: player?.level,
                exp: player?.exp,
                maxExp: player?.maxExp
            },
            enemy: {
                exists: !!enemy,
                level: enemy?.level,
                exp: enemy?.exp,
                maxExp: enemy?.maxExp
            }
        });
        
        if (!player) {
            throw new Error('RewardSystem: 플레이어 객체가 없습니다.');
        }
        if (!enemy) {
            throw new Error('RewardSystem: 적 객체가 없습니다.');
        }
        
        // 필수 속성 검증
        const requiredProps = ['level', 'exp', 'maxExp'];
        
        requiredProps.forEach(prop => {
            if (player[prop] === undefined) {
                console.error('[오류/RewardSystem] 플레이어 객체 속성 누락:', {
                    property: prop,
                    playerState: player
                });
                throw new Error(`RewardSystem: 플레이어 객체에 ${prop} 속성이 없습니다.`);
            }
            if (enemy[prop] === undefined) {
                console.error('[오류/RewardSystem] 적 객체 속성 누락:', {
                    property: prop,
                    enemyState: enemy
                });
                throw new Error(`RewardSystem: 적 객체에 ${prop} 속성이 없습니다.`);
            }
        });
        
        console.log('[디버그/RewardSystem] 게임 상태 검증 완료');
    }

    showRewards() {
        try {
            console.log('[디버그/RewardSystem] 보상 표시 시작');
            // 상태 재검증
            this.validateGameState();
            
            const player = this.gameState.getPlayer();
            const enemy = this.gameState.getEnemy();
            
            console.log('[디버그/RewardSystem] 보상 계산을 위한 상태:', {
                playerLevel: player.level,
                enemyLevel: enemy.level
            });
            
            // 가능한 보상 목록 생성
            const possibleRewards = this.getAllPossibleRewards(player.level, enemy.level);
            console.log('[디버그/RewardSystem] 생성된 보상 목록:', possibleRewards);
            
            // 보상 표시 이벤트 발생
            this.eventEmitter.emit('rewards:show', {
                rewards: possibleRewards,
                playerLevel: player.level,
                enemyLevel: enemy.level
            });
        } catch (error) {
            console.error('[오류/RewardSystem] 보상 표시 중 오류:', error);
            // 오류 발생 시 기본 보상으로 대체
            this.showDefaultRewards();
        }
    }

    showDefaultRewards() {
        console.log('[디버그/RewardSystem] 기본 보상 표시');
        // 기본 보상 표시 (경험치만)
        this.eventEmitter.emit('rewards:show', {
            rewards: [{
                type: 'exp',
                amount: 10,
                name: '기본 경험치'
            }],
            playerLevel: 1,
            enemyLevel: 1
        });
    }

    getAllPossibleRewards(playerLevel, enemyLevel) {
        console.log('[디버그/RewardSystem] 보상 계산:', { playerLevel, enemyLevel });
        
        if (typeof playerLevel !== 'number' || typeof enemyLevel !== 'number') {
            console.error('[오류/RewardSystem] 유효하지 않은 레벨:', { playerLevel, enemyLevel });
            return this.getDefaultRewards();
        }
        
        // 여기에 보상 생성 로직 구현
        const rewards = [
            {
                type: 'exp',
                amount: Math.floor(10 * (1 + enemyLevel * 0.1)),
                name: '경험치'
            }
            // 추가 보상 항목들...
        ];
        
        console.log('[디버그/RewardSystem] 계산된 보상:', rewards);
        return rewards;
    }

    getDefaultRewards() {
        console.log('[디버그/RewardSystem] 기본 보상 반환');
        return [{
            type: 'exp',
            amount: 10,
            name: '기본 경험치'
        }];
    }
} 