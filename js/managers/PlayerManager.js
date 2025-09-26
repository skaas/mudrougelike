import { PLAYER_STATS, SPEED_SETTINGS } from '../constants.js';
import { Player } from '../Character.js';
import { EVENT_TYPES } from '../EventTypes.js';

export class PlayerManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.player = null;
    }
    
    createPlayer() {
        const stats = this.generatePlayerStats();
        this.player = new Player(stats);
        this.eventEmitter.emit(EVENT_TYPES.STATE.PLAYER_UPDATE, this.player);
        return this.player;
    }
    
    generatePlayerStats() {
        // ?뚮젅?댁뼱 ?ㅽ꺈 ?앹꽦 濡쒖쭅
        const warriorClass = PLAYER_STATS.CLASSES.WARRIOR;
        const base = PLAYER_STATS.BASE;
        return {
            hp: Math.floor(base.HP * warriorClass.HP_MULTIPLIER),
            maxHp: Math.floor(base.HP * warriorClass.HP_MULTIPLIER),
            name: warriorClass.NAME,
            attack: base.ATTACK,
            defense: Math.floor(base.DEFENSE * warriorClass.DEFENSE_MULTIPLIER),
            armor: base.ARMOR,
            critRate: base.CRIT_RATE,
            critDamage: base.CRIT_DAMAGE,
            lifeStealRate: base.LIFE_STEAL_RATE,
            thornsCoeff: base.THORNS_COEFF,
            freezeRate: base.FREEZE_RATE,
            luck: base.LUCK,
            turnHealingCapRatio: base.TURN_HEAL_CAP_RATIO
        };
    }
    
    getPlayer() {
        return this.player;
    }
    
    gainExp(amount) {
        const beforeLevel = this.player.level;
        const beforeExp = this.player.exp;

        const leveledUp = this.player.gainExp(amount);

        console.log('[PlayerManager] gainExp', {
            amount,
            beforeExp,
            afterExp: this.player.exp,
            beforeLevel,
            afterLevel: this.player.level,
            leveledUp
        });

        if (leveledUp) {
            this.eventEmitter.emit(EVENT_TYPES.PLAYER.LEVEL_UP, {
                oldLevel: beforeLevel,
                newLevel: this.player.level,
                player: this.player
            });
        }

        return leveledUp;
    }
    
    // 洹????뚮젅?댁뼱 愿??硫붿꽌??(踰꾪봽, ?꾩씠???곸슜 ??
} 




