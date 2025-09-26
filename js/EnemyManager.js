class EnemyManager {
    #currentEnemy = null;
    #lastDefeatedEnemy = null;
    #enemyTypes;
    #eventEmitter;

    constructor(enemyTypes, eventEmitter) {
        this.#enemyTypes = enemyTypes;
        this.#eventEmitter = eventEmitter;
        console.log('[디버그/EnemyManager] 초기화됨');
    }

    getEnemy() {
        if (!this.#currentEnemy && this.#lastDefeatedEnemy) {
            console.log('[디버그/EnemyManager] 현재 적이 없어 마지막으로 처치된 적 정보 반환');
            return this.#lastDefeatedEnemy;
        }
        return this.#currentEnemy;
    }

    handleEnemyDefeat() {
        console.log('[디버그/EnemyManager] 적 처치 처리');
        if (this.#currentEnemy) {
            this.#lastDefeatedEnemy = { ...this.#currentEnemy };
            console.log('[디버그/EnemyManager] 마지막으로 처치된 적 정보 저장:', this.#lastDefeatedEnemy);
        }
    }

    clearDefeatedEnemy() {
        console.log('[디버그/EnemyManager] 처치된 적 정보 초기화');
        this.#currentEnemy = null;
        this.#lastDefeatedEnemy = null;
    }
} 