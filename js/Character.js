import {
    PLAYER_STATS,
    PLAYER_STAT_LIMITS,
    PLAYER_LEVEL_GROWTH,
    PLAYER_TURN_LIMITS,
    SPEED_SETTINGS,
    FREEZE_SETTINGS
} from './constants.js';

const isValidNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const coerce = (value, fallback) => (isValidNumber(value) ? value : fallback);

const ensurePositiveInt = (value, fallback) => {
    const nextValue = coerce(value, fallback);
    return Number.isInteger(nextValue) ? Math.max(0, nextValue) : Math.max(0, Math.floor(nextValue));
};

const defaultSpeedStep = SPEED_SETTINGS?.EXTRA_STRIKE_STEP ?? 5;
const speedCap = SPEED_SETTINGS?.MAX_EXTRA_STRIKES ?? Number.MAX_SAFE_INTEGER;

export class Character {
    constructor(stats = {}) {
        if (!stats) {
            console.error('[Character] stats 객체가 제공되지 않았습니다. 기본값으로 초기화합니다.');
            stats = {};
        }

        const base = PLAYER_STATS.BASE;
        const limits = PLAYER_STAT_LIMITS;

        this.name = stats.name ?? 'Character';

        const maxHpFallback = coerce(stats.hp, base.HP);
        this.maxHp = clamp(coerce(stats.maxHp, maxHpFallback), 1, Number.MAX_SAFE_INTEGER);
        this.hp = clamp(coerce(stats.hp, this.maxHp), 0, this.maxHp);

        this.attack = coerce(stats.attack, base.ATTACK);
        this.defense = coerce(stats.defense, base.DEFENSE);
        this.level = ensurePositiveInt(stats.level, 1);

        this.speed = clamp(coerce(stats.speed, base.SPEED ?? 0), 0, limits.SPEED ?? Number.MAX_SAFE_INTEGER);
        this.extraStrikeStep = ensurePositiveInt(stats.extraStrikeStep, defaultSpeedStep) || defaultSpeedStep;

        this._armor = clamp(coerce(stats.armor, base.ARMOR), 0, Number.MAX_SAFE_INTEGER);
        Object.defineProperty(this, 'armor', {
            configurable: true,
            enumerable: true,
            get: () => this._armor,
            set: (value) => {
                this._armor = clamp(coerce(value, this._armor), 0, Number.MAX_SAFE_INTEGER);
            }
        });
        Object.defineProperty(this, 'shield', {
            configurable: true,
            enumerable: true,
            get: () => this._armor,
            set: (value) => {
                this._armor = clamp(coerce(value, this._armor), 0, Number.MAX_SAFE_INTEGER);
            }
        });

        this.maxShield = Math.floor(this.maxHp * 0.5);

        this.critRate = clamp(coerce(stats.critRate, base.CRIT_RATE), 0, limits.CRIT_RATE);
        this.critDamage = clamp(coerce(stats.critDamage, base.CRIT_DAMAGE), 1, limits.CRIT_DAMAGE);
        this.lifeStealRate = clamp(coerce(stats.lifeStealRate, base.LIFE_STEAL_RATE), 0, limits.LIFE_STEAL_RATE);
        this.turnHealingCapRatio = clamp(coerce(stats.turnHealingCapRatio, base.TURN_HEAL_CAP_RATIO), 0, limits.TURN_HEAL_CAP_RATIO);
        this.thornsCoeff = clamp(coerce(stats.thornsCoeff, base.THORNS_COEFF), 0, limits.THORNS_COEFF);
        this.freezeRate = clamp(coerce(stats.freezeRate, base.FREEZE_RATE), 0, limits.FREEZE_RATE);
        this.freezeResist = clamp(coerce(stats.freezeResist, FREEZE_SETTINGS.DEFAULT_RESIST ?? 0), 0, 1);
        this.luck = clamp(coerce(stats.luck, base.LUCK), 0, limits.LUCK);

        this.turnHealingAccrued = 0;
        this.turnThornsAccrued = 0;
        this.freezeImmuneUntilTurn = 0;

        this.isStunned = false;

        this.combatState = {
            speedBonus: 0,
            bonusStrikes: 0,
            guaranteedCrits: 0,
            attackPercent: 0,
            attackMultiplier: 1,
            thornsMultiplier: 1
        };
    }

    resetTurnState() {
        this.turnHealingAccrued = 0;
        this.turnThornsAccrued = 0;
        this.combatState.speedBonus = 0;
        this.combatState.bonusStrikes = 0;
        this.combatState.attackPercent = 0;
        this.combatState.attackMultiplier = 1;
        this.combatState.thornsMultiplier = 1;
    }

    damage(amount, options = {}) {
        const incoming = Math.max(0, coerce(amount, 0));
        const ignoreArmor = Boolean(options.ignoreArmor);
        const effectiveArmor = ignoreArmor ? 0 : this.armor;
        const mitigated = Math.min(incoming, effectiveArmor);
        const applied = Math.max(0, incoming - mitigated);
        this.hp = Math.max(0, this.hp - applied);

        if (!options.skipThornsTracking) {
            this.turnThornsAccrued += applied;
        }

        return {
            incoming,
            mitigated,
            applied,
            remainingHp: this.hp
        };
    }

    heal(amount, options = {}) {
        const value = Math.max(0, coerce(amount, 0));
        const enforceCap = Boolean(options.enforceCap);

        let effective = value;
        let capValue = 0;
        if (enforceCap) {
            capValue = this.getTurnHealingCapValue();
            if (capValue > 0) {
                const remaining = Math.max(0, capValue - this.turnHealingAccrued);
                effective = Math.min(effective, remaining);
            }
        }

        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + effective);
        const applied = this.hp - before;

        if (enforceCap && capValue > 0) {
            this.turnHealingAccrued = Math.min(capValue, this.turnHealingAccrued + applied);
        }

        return {
            attempted: value,
            applied,
            remainingHp: this.hp
        };
    }

    isDead() {
        return this.hp <= 0;
    }

    setArmor(amount) {
        this.armor = amount;
        return this.armor;
    }

    getTurnHealingCapValue() {
        return Math.floor(this.maxHp * this.turnHealingCapRatio);
    }

    getEffectiveCritChance() {
        const luckFactor = 1 + Math.max(0, this.luck);
        return Math.min(this.critRate * luckFactor, PLAYER_STAT_LIMITS.CRIT_RATE);
    }

    getEffectiveFreezeChance(enemy = null) {
        const luckFactor = 1 + Math.max(0, this.luck);
        const resist = enemy?.freezeResist ?? 0;
        const baseChance = Math.min(this.freezeRate * luckFactor, PLAYER_STAT_LIMITS.FREEZE_RATE);
        return Math.max(0, baseChance * (1 - resist));
    }

    canBeFrozen(currentTurn) {
        return currentTurn > this.freezeImmuneUntilTurn;
    }

    markFrozen(currentTurn) {
        this.isStunned = true;
        const immunityDuration = FREEZE_SETTINGS.BASE_IMMUNITY_TURNS ?? 1;
        this.freezeImmuneUntilTurn = currentTurn + immunityDuration;
    }

    clearFrozen() {
        this.isStunned = false;
    }

    getEffectiveSpeed() {
        return Math.max(0, this.speed + (this.combatState.speedBonus ?? 0));
    }

    getExtraStrikeStep() {
        return this.extraStrikeStep || defaultSpeedStep;
    }

    getBaseExtraStrikes() {
        const step = this.getExtraStrikeStep();
        if (step <= 0) {
            return 0;
        }
        return Math.floor(this.getEffectiveSpeed() / step);
    }

    getTotalExtraStrikes() {
        const bonus = this.combatState.bonusStrikes ?? 0;
        const total = this.getBaseExtraStrikes() + bonus;
        return Math.max(0, Math.min(total, speedCap));
    }

    addSpeedBonus(amount = 0) {
        this.combatState.speedBonus = (this.combatState.speedBonus ?? 0) + amount;
        return this.combatState.speedBonus;
    }

    addBonusStrikes(count = 0) {
        this.combatState.bonusStrikes = (this.combatState.bonusStrikes ?? 0) + count;
        return this.combatState.bonusStrikes;
    }

    grantGuaranteedCrits(count = 1) {
        this.combatState.guaranteedCrits = Math.max(0, (this.combatState.guaranteedCrits ?? 0) + count);
        return this.combatState.guaranteedCrits;
    }

    hasGuaranteedCrit() {
        return (this.combatState.guaranteedCrits ?? 0) > 0;
    }

    consumeGuaranteedCrit() {
        if (this.hasGuaranteedCrit()) {
            this.combatState.guaranteedCrits -= 1;
            return true;
        }
        return false;
    }

    addAttackPercentBuff(percent = 0) {
        this.combatState.attackPercent = (this.combatState.attackPercent ?? 0) + percent;
        return this.combatState.attackPercent;
    }

    setAttackMultiplier(multiplier = 1) {
        this.combatState.attackMultiplier = Math.max(0, multiplier);
        return this.combatState.attackMultiplier;
    }

    resetAttackBuffs() {
        this.combatState.attackPercent = 0;
        this.combatState.attackMultiplier = 1;
    }

    getEffectiveAttackValue() {
        const baseAttack = this.attack;
        const percent = this.combatState.attackPercent ?? 0;
        const multiplier = this.combatState.attackMultiplier ?? 1;
        const value = baseAttack * multiplier * (1 + percent);
        return Math.max(0, value);
    }

    addThornsMultiplier(multiplier = 1) {
        this.combatState.thornsMultiplier = Math.max(0, (this.combatState.thornsMultiplier ?? 1) * multiplier);
        return this.combatState.thornsMultiplier;
    }

    getEffectiveThornsDamage() {\r\n        const baseDamage = Math.max(0, this.thornsCoeff ?? 0);\r\n        const multiplier = this.combatState.thornsMultiplier ?? 1;\r\n        return Math.max(0, Math.floor(baseDamage * multiplier));\r\n    }

    getThornsTurnCap() {
        const multiplier = PLAYER_TURN_LIMITS?.THORNS_DAMAGE_MULTIPLIER ?? 0;
        return Math.floor(this.attack * multiplier);
    }
}

export class Player extends Character {
    constructor(stats = {}) {
        super(stats);
        this.exp = stats.exp ?? 0;
        this.maxExp = this.calcMaxExp();

        this.multiHitCount = PLAYER_STATS.MULTI_HIT?.BASE ?? 2;

        this.class = stats.class ?? 'WARRIOR';
        const classConfig = PLAYER_STATS.CLASSES?.[this.class] ?? PLAYER_STATS.CLASSES?.WARRIOR;
        this.className = classConfig?.NAME ?? 'Warrior';
        this.specialSkills = classConfig?.SPECIAL_SKILLS ?? [];
        this.equipment = classConfig?.STARTING_EQUIPMENT ?? {};

        this.turnCount = 0;
    }

    calcMaxExp() {
        return Math.max(20, this.level * 20);
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = this.calcMaxExp();

        this.maxHp += 2;
        this.hp = this.maxHp;
        this.attack += 1;
        this.defense += 0.5;
        this.speed = clamp(this.speed + 1, 0, PLAYER_STAT_LIMITS.SPEED ?? Number.MAX_SAFE_INTEGER);

        this.applyLevelUpGrowth();
    }

    applyLevelUpGrowth() {
        const limits = PLAYER_STAT_LIMITS;
        const growth = PLAYER_LEVEL_GROWTH;

        if (growth.LIFE_STEAL_RATE) {
            this.lifeStealRate = clamp(this.lifeStealRate + growth.LIFE_STEAL_RATE, 0, limits.LIFE_STEAL_RATE);
        }
        if (growth.THORNS_COEFF) {
            this.thornsCoeff = clamp(this.thornsCoeff + growth.THORNS_COEFF, 0, limits.THORNS_COEFF);
        }
        if (growth.FREEZE_RATE) {
            this.freezeRate = clamp(this.freezeRate + growth.FREEZE_RATE, 0, limits.FREEZE_RATE);
        }
        if (growth.LUCK) {
            this.luck = clamp(this.luck + growth.LUCK, 0, limits.LUCK);
        }
        if (growth.TURN_HEAL_CAP_RATIO) {
            this.turnHealingCapRatio = clamp(this.turnHealingCapRatio + growth.TURN_HEAL_CAP_RATIO, 0, limits.TURN_HEAL_CAP_RATIO);
        }
    }
}

export class Enemy extends Character {
    constructor(stats, actions) {
        super(stats);
        this.exp = stats?.exp ?? 0;
        this.maxExp = stats?.maxExp ?? this.exp;
        this.level = stats?.level ?? 1;
        this.actions = actions || [];
        this.lastPlayerUsedCombo = false;
    }

    selectAction() {
        if (!this.actions || this.actions.length === 0) {
            return { type: 'ATTACK', name: 'Attack' };
        }

        const totalWeight = this.actions.reduce((sum, action) => sum + (action.weight || 1), 0);
        let random = Math.random() * totalWeight;

        for (const action of this.actions) {
            random -= (action.weight || 1);
            if (random <= 0) {
                return action;
            }
        }

        return this.actions[0];
    }
}

