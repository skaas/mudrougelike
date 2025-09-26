import { ENEMY_GROWTH, STAGE_SETTINGS, ACTION_TYPES, FREEZE_SETTINGS } from '../constants.js';
import { Enemy } from '../Character.js';
import { EVENT_TYPES } from '../EventTypes.js';
import { skillRegistry } from '../app/skills/index.js';

const stripRegistryFields = (action) => {
    if (!action) {
        return action;
    }
    const { key, owner, requirements, availability, ...rest } = action;
    return rest;
};

export class EnemyManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.enemy = null;
        this.lastDefeatedEnemy = null;
    }

    createEnemy(level = 1, isBoss = false) {
        const stats = this.generateEnemyStats(level, isBoss);
        const context = {
            enemy: { ...stats, level },
            player: null,
            isBoss,
            stage: level,
            includeLocked: false
        };
        const actions = this.buildEnemyActions(context);

        stats.level = level;
        stats.maxExp = Math.floor(20 * (1 + (level - 1) * 0.1));

        this.enemy = new Enemy(stats, actions);
        this.eventEmitter.emit(EVENT_TYPES.STATE.ENEMY_UPDATE, this.enemy);

        return this.enemy;
    }

    validateConstants() {
        if (!ENEMY_GROWTH || !ENEMY_GROWTH.BASE_HP || !ENEMY_GROWTH.BASE_ATK || !ENEMY_GROWTH.BASE_DEF) {
            throw new Error('ENEMY_GROWTH 설정이 올바르지 않습니다.');
        }

        if (!STAGE_SETTINGS || !STAGE_SETTINGS.BOSS_MULTIPLIER) {
            throw new Error('STAGE_SETTINGS.BOSS_MULTIPLIER 설정이 필요합니다.');
        }

        const availableEnemySkills = skillRegistry.getEnemySkills({ includeLocked: true });
        if (!availableEnemySkills.length) {
            throw new Error('등록된 적 스킬이 없습니다.');
        }
    }

    validateEnemyStats(stats) {
        const requiredProperties = ['name', 'hp', 'maxHp', 'attack', 'defense', 'level', 'exp'];
        const missingProperties = requiredProperties.filter(prop => stats[prop] === undefined);

        if (missingProperties.length > 0) {
            throw new Error(`적 스탯 생성 실패: ${missingProperties.join(', ')} 속성이 필요합니다.`);
        }

        if (stats.hp <= 0 || stats.maxHp <= 0) {
            throw new Error('적 체력은 0보다 커야 합니다.');
        }

        if (stats.attack <= 0) {
            throw new Error('적 공격력은 0보다 커야 합니다.');
        }

        if (stats.defense < 0) {
            throw new Error('적 방어력은 0 이상이어야 합니다.');
        }
    }

    getEnemy() {
        if (!this.enemy && this.lastDefeatedEnemy) {
            return this.lastDefeatedEnemy;
        }
        return this.enemy;
    }

    calculateStatModifier() {
        return 0.9 + Math.random() * 0.2;
    }

    generateEnemyStats(level, isBoss = false) {
        const baseStats = {
            hp: Math.floor(50 * (1 + (level - 1) * 0.2)),
            attack: Math.floor(10 * (1 + (level - 1) * 0.15)),
            defense: Math.floor(5 * (1 + (level - 1) * 0.1)),
            exp: Math.floor(10 * (1 + (level - 1) * 0.1))
        };

        if (isBoss) {
            baseStats.hp *= 2;
            baseStats.attack *= 1.5;
            baseStats.defense *= 1.3;
            baseStats.exp *= 2;
        }

        return {
            ...baseStats,
            maxHp: baseStats.hp,
            name: isBoss ? 'Judgement Priest' : 'Fanatic Priest',
            level,
            isBoss,
            armor: 0,
            critRate: 0.05,
            critDamage: 1.5,
            lifeStealRate: 0,
            thornsCoeff: isBoss ? 0.15 : 0,
            freezeResist: isBoss ? (FREEZE_SETTINGS.BOSS_RESIST ?? 0.5) : (FREEZE_SETTINGS.DEFAULT_RESIST ?? 0),
            freezeRate: 0,
            luck: 0,
            turnHealingCapRatio: 0
        };
    }

    generateEnemyName(isBoss) {
        return isBoss ? 'Judgement Priest' : 'Fanatic Priest';
    }

    calculateExpReward(level, isBoss) {
        const baseExp = 10;
        const levelBonus = level * 5;
        const bossBonus = isBoss ? 50 : 0;
        return baseExp + levelBonus + bossBonus;
    }

    buildEnemyActions(context) {
        const presetName = context.isBoss ? 'boss' : 'default';
        const presetActions = skillRegistry.getEnemyPreset(presetName, context);
        const basePool = presetActions.length ? presetActions : skillRegistry.getEnemySkills(context);
        const actions = basePool.length ? basePool : this.createFallbackActions();
        return actions.map(stripRegistryFields);
    }

    createFallbackActions() {
        return [{ type: ACTION_TYPES.ATTACK, name: 'Attack', weight: 100 }];
    }

    handleEnemyDefeat() {
        if (this.enemy) {
            this.lastDefeatedEnemy = { ...this.enemy };
        }
    }

    clearDefeatedEnemy() {
        this.enemy = null;
        this.lastDefeatedEnemy = null;
    }
}





