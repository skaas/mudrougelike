import { INITIAL_STATS } from '../../constants.js';

export function createPlayerTemplate() {
    const base = INITIAL_STATS.PLAYER;
    return {
        name: base.NAME,
        hp: base.HP,
        maxHp: base.MAX_HP,
        armor: base.ARMOR,
        attack: base.ATTACK,
        critRate: base.CRIT_RATE,
        critDamage: base.CRIT_DAMAGE,
        lifeStealRate: base.LIFE_STEAL_RATE,
        thornsCoeff: base.THORNS_COEFF,
        freezeRate: base.FREEZE_RATE,
        luck: base.LUCK,
        turnHealingCapRatio: base.TURN_HEAL_CAP_RATIO,
        level: 1,
        exp: 0,
        expToNext: 100,
        buffs: []
    };
}
