export class GameStateTransaction {
    constructor(gameState) {
        this.gameState = gameState;
        this.changes = new Map();
        this.previousValues = new Map();
    }
    
    // 상태 변경 기록
    set(key, value) {
        if (!this.previousValues.has(key)) {
            this.previousValues.set(key, this.gameState[key]);
        }
        this.changes.set(key, value);
        return this;
    }
    
    // 트랜잭션 커밋
    commit() {
        // 변경사항 적용
        for (const [key, value] of this.changes) {
            this.gameState[key] = value;
        }
        
        // 변경 기록 초기화
        this.changes.clear();
        this.previousValues.clear();
        
        return true;
    }
    
    // 트랜잭션 롤백
    rollback() {
        // 이전 값으로 복원
        for (const [key, value] of this.previousValues) {
            this.gameState[key] = value;
        }
        
        // 변경 기록 초기화
        this.changes.clear();
        this.previousValues.clear();
        
        return true;
    }
    
    // 비동기 트랜잭션 실행
    async execute(asyncOperation) {
        try {
            const result = await asyncOperation();
            this.commit();
            return result;
        } catch (error) {
            console.error('트랜잭션 실행 오류, 롤백 중:', error);
            this.rollback();
            throw error;
        }
    }
} 