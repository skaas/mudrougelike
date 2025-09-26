// RewardSystem.js
import { getRandomFromArray } from './utils.js';
import { 
    ENEMY_GROWTH, 
    INITIAL_STATS, 
    LUCK_FACTORS, 
    LUCK_MESSAGES,
    GAME_SETTINGS 
} from './constants.js';
import { MESSAGES } from './constants.js';
import { PLAYER_STATS, PLAYER_STAT_LIMITS } from './constants.js';

export class RewardSystem {
    #eventEmitter;
    #state;

    constructor(eventEmitter, state) {
        this.#eventEmitter = eventEmitter;
        this.#state = state;
    }

    showRewards() {
        const possibleRewards = this.#getAllPossibleRewards();
        const selectedRewards = this.#selectRandomRewards(possibleRewards, 3);
        
        this.#eventEmitter.emit('ui:show-rewards', selectedRewards);
    }

    hideRewards() {
        this.#eventEmitter.emit('ui:hide-rewards');
    }

    startNextBattle() {
        const { state } = this.#eventEmitter;
        state.stage++;
        state.level++;
        
        const statModifier = state.calculateRandomStatModifier(state.player.luck);
        state.enemy = state.resetEnemyWithLevel(state.level, statModifier);
        
        this.#eventEmitter.emit('ui:update-all');
        this.#eventEmitter.emit('game:start-exploration');
    }

    #getAllPossibleRewards() {
        const player = this.#state.player;
        const clampToLimit = (value, limit) => (typeof limit === 'number' ? Math.min(value, limit) : value);
        const formatPercent = (value) => `${Math.round(value * 1000) / 10}%`;
        return [
            {
                type: 'armor_up',
                name: 'Armor 媛뺥솕',
                description: '諛⑹뼱?μ씠 利앷??⑸땲?? (+1)',
                effect: () => {
                    const increase = 1;
                    const previous = player.armor ?? 0;
                    player.armor = previous + increase;
                    const message = `諛⑹뼱?μ씠 ${previous} ??${player.armor}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'crit_rate_up',
                name: '移섎챸? ?뺣쪧',
                description: '移섎챸? ?뺣쪧??利앷??⑸땲?? (+3%p)',
                isAvailable: () => (player.critRate ?? 0) < PLAYER_STAT_LIMITS.CRIT_RATE,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.CRIT_RATE;
                    if (player.critRate >= limit) {
                        return '移섎챸? ?뺣쪧???대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.03;
                    const previous = player.critRate ?? 0;
                    player.critRate = clampToLimit(previous + increase, limit);
                    const applied = player.critRate - previous;
                    const message = `移섎챸? ?뺣쪧??${formatPercent(previous)} ??${formatPercent(player.critRate)} ( +${formatPercent(applied)} )`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'crit_damage_up',
                name: '移섎챸? ?쇳빐',
                description: '移섎챸? ?쇳빐 諛곗쑉??利앷??⑸땲?? (+0.1)',
                isAvailable: () => (player.critDamage ?? GAME_SETTINGS.CRITICAL_DAMAGE_MULTIPLIER) < PLAYER_STAT_LIMITS.CRIT_DAMAGE,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.CRIT_DAMAGE;
                    const previous = player.critDamage ?? GAME_SETTINGS.CRITICAL_DAMAGE_MULTIPLIER;
                    if (previous >= limit) {
                        return '移섎챸? ?쇳빐 諛곗쑉???대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.1;
                    player.critDamage = clampToLimit(previous + increase, limit);
                    const message = `移섎챸? ?쇳빐 諛곗쑉??${previous.toFixed(2)} ??${player.critDamage.toFixed(2)}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'life_steal_up',
                name: '?≫삁 媛뺥솕',
                description: '?≫삁 鍮꾩쑉??利앷??⑸땲?? (+2%p)',
                isAvailable: () => (player.lifeStealRate ?? 0) < PLAYER_STAT_LIMITS.LIFE_STEAL_RATE,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.LIFE_STEAL_RATE;
                    const previous = player.lifeStealRate ?? 0;
                    if (previous >= limit) {
                        return '?≫삁 鍮꾩쑉???대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.02;
                    player.lifeStealRate = clampToLimit(previous + increase, limit);
                    const message = `?≫삁 鍮꾩쑉??${formatPercent(previous)} ??${formatPercent(player.lifeStealRate)}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'heal_cap_up',
                name: '?뚮났 ?곹븳 ?뺣?',
                description: '?대떦 ?뚮났 ?곹븳??利앷??⑸땲?? (+10%p)',
                isAvailable: () => (player.turnHealingCapRatio ?? 0) < PLAYER_STAT_LIMITS.TURN_HEAL_CAP_RATIO,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.TURN_HEAL_CAP_RATIO;
                    const previous = player.turnHealingCapRatio ?? 0;
                    if (previous >= limit) {
                        return '?대떦 ?뚮났 ?곹븳???대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.1;
                    player.turnHealingCapRatio = clampToLimit(previous + increase, limit);
                    const message = `?대떦 ?뚮났 ?곹븳??${formatPercent(previous)} ??${formatPercent(player.turnHealingCapRatio)}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'thorns_up',
                name: 'Thorns 媛뺥솕',
                description: '諛섍꺽 怨꾩닔媛 利앷??⑸땲?? (+0.05)',
                isAvailable: () => (player.thornsCoeff ?? 0) < PLAYER_STAT_LIMITS.THORNS_COEFF,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.THORNS_COEFF;
                    const previous = player.thornsCoeff ?? 0;
                    if (previous >= limit) {
                        return '諛섍꺽 怨꾩닔媛 ?대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.05;
                    player.thornsCoeff = clampToLimit(previous + increase, limit);
                    const message = `諛섍꺽 怨꾩닔媛 ${(previous).toFixed(2)} ??${player.thornsCoeff.toFixed(2)}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'freeze_rate_up',
                name: '?숆껐 ?뺣쪧',
                description: '?숆껐 ?뺣쪧??利앷??⑸땲?? (+2%p)',
                isAvailable: () => (player.freezeRate ?? 0) < PLAYER_STAT_LIMITS.FREEZE_RATE,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.FREEZE_RATE;
                    const previous = player.freezeRate ?? 0;
                    if (previous >= limit) {
                        return '?숆껐 ?뺣쪧???대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.02;
                    player.freezeRate = clampToLimit(previous + increase, limit);
                    const message = `?숆껐 ?뺣쪧??${formatPercent(previous)} ??${formatPercent(player.freezeRate)}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'luck_up',
                name: '?됱슫 媛뺥솕',
                description: '?됱슫??利앷??⑸땲?? (+3%p)',
                isAvailable: () => (player.luck ?? 0) < PLAYER_STAT_LIMITS.LUCK,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.LUCK;
                    const previous = player.luck ?? 0;
                    if (previous >= limit) {
                        return '?됱슫???대? 理쒕?移섏엯?덈떎.';
                    }
                    const increase = 0.03;
                    player.luck = clampToLimit(previous + increase, limit);
                    const message = `?됱슫??${formatPercent(previous)} ??${formatPercent(player.luck)}`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'attack',
                name: "怨듦꺽??媛뺥솕",
                description: `怨듦꺽?μ씠 利앷??⑸땲?? (+${5 + Math.floor(player.level / 3)})`,
                effect: () => {
                    const increase = 5 + Math.floor(player.level / 3);
                    player.attack += increase;
                    this.#eventEmitter.emit('ui:show-stat-increase', 'attack');
                    const message = `怨듦꺽?μ씠 ${increase} 利앷??덈떎! (${player.attack - increase} ??${player.attack})`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'defense',
                name: "諛⑹뼱??媛뺥솕",
                description: `諛⑹뼱?μ씠 利앷??⑸땲?? (+${3 + Math.floor(player.level / 4)})`,
                effect: () => {
                    const increase = 3 + Math.floor(player.level / 4);
                    player.defense += increase;
                    this.#eventEmitter.emit('ui:show-stat-increase', 'defense');
                    const message = `諛⑹뼱?μ씠 ${increase} 利앷??덈떎! (${player.defense - increase} ??${player.defense})`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'heal_on_defend',
                name: "諛⑹뼱 ?뚮났",
                description: !player.hasHealOnDefend 
                    ? "諛⑹뼱 ??泥대젰???뚮났?⑸땲??" 
                    : `諛⑹뼱 ???뚮났?됱씠 利앷??⑸땲?? (+20%, ?꾩옱: ${Math.floor(player.healOnDefendBonus * 100)}%)`,
                effect: () => {
                    if (player.hasHealOnDefend) {
                        player.healOnDefendBonus = (player.healOnDefendBonus || 0) + 0.2;
                        const message = `諛⑹뼱 ???뚮났?됱씠 ${Math.floor(player.healOnDefendBonus * 100)}% 利앷??섏뿀??`;
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    } else {
                        player.hasHealOnDefend = true;
                        player.healOnDefendBonus = 0.2;
                        const message = "諛⑹뼱 ??諛⑹뼱?λ쭔??泥대젰???뚮났?섎뒗 ?λ젰???살뿀??";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                }
            },
            {
                type: 'stun',
                name: "湲곗젅 怨듦꺽",
                description: !player.hasStunChance
                    ? "20% ?뺣쪧濡???湲곗젅 (NEW!)"
                    : `湲곗젅 ??異붽? ?곕?吏 10% 利앷? (?꾩옱: +${Math.floor((player.stunDamageBonus || 0) * 100)}%)`,
                effect: () => {
                    if (player.hasStunChance) {
                        player.stunDamageBonus = (player.stunDamageBonus || 0) + 0.1;
                        const bonus = Math.floor(player.stunDamageBonus * 100);
                        const message = `湲곗젅 怨듦꺽 ??異붽? ?곕?吏媛 ${bonus}%媛 ?섏뿀??`;
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    } else {
                        player.hasStunChance = true;
                        player.stunChance = 0.2;
                        player.stunDamageBonus = 0;
                        const message = "?곸쓣 湲곗젅?쒗궗 ???덇쾶 ?섏뿀??";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                }
            },
            {
                type: 'max_hp',
                name: "理쒕? 泥대젰",
                description: "理쒕? 泥대젰??利앷??⑸땲?? (+10%)",
                effect: () => {
                    const increase = Math.floor(player.maxHp * 0.1);
                    player.maxHp += increase;
                    player.hp += increase;
                    this.#eventEmitter.emit('ui:show-stat-increase', 'hp');
                    const message = `理쒕? 泥대젰??${increase} 利앷??덈떎! (${player.maxHp - increase} ??${player.maxHp})`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'heal',
                name: "泥대젰 ?뚮났",
                description: "泥대젰???뚮났?⑸땲?? (30%)",
                effect: () => {
                    const healAmount = Math.floor(player.maxHp * 0.3);
                    const oldHp = player.hp;
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    const actualHeal = player.hp - oldHp;
                    const message = `泥대젰??${actualHeal} ?뚮났?덈떎!`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'critical_sense',
                name: "湲됱냼 媛먭컖",
                description: !player.hasCriticalSense
                    ? "移섎챸? ?뺣쪧??利앷??⑸땲?? (+15%)"
                    : `移섎챸? ?뺣쪧??利앷??⑸땲?? (+5%, ?꾩옱: ${Math.floor((GAME_SETTINGS.CRITICAL_HIT_CHANCE + player.criticalChanceBonus) * 100)}%)`,
                effect: () => {
                    if (!player.hasCriticalSense) {
                        player.hasCriticalSense = true;
                        player.criticalChanceBonus = 0.15;
                        const message = "?곸쓽 湲됱냼瑜?媛꾪뙆?섎뒗 ?λ젰???띾뱷?덈떎!";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                    player.criticalChanceBonus += 0.05;
                    const message = `移섎챸? ?뺣쪧??${Math.floor((GAME_SETTINGS.CRITICAL_HIT_CHANCE + player.criticalChanceBonus) * 100)}%媛 ?섏뿀??`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'heart_crush',
                name: "?ъ옣??遺꾩뇙",
                description: !player.hasHeartCrush
                    ? "移섎챸? ?쇳빐媛 利앷??⑸땲?? (+50%)"
                    : `移섎챸? ?쇳빐媛 利앷??⑸땲?? (+20%, ?꾩옱: ${Math.floor((GAME_SETTINGS.CRITICAL_DAMAGE_MULTIPLIER + player.criticalDamageBonus - 1) * 100)}%)`,
                effect: () => {
                    if (!player.hasHeartCrush) {
                        player.hasHeartCrush = true;
                        player.criticalDamageBonus = 0.5;
                        const message = "移섎챸?濡??곸쓽 ?ъ옣??遺꾩뇙?섎뒗 ?λ젰???띾뱷?덈떎!";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                    player.criticalDamageBonus += 0.2;
                    const message = `移섎챸? ?쇳빐媛 ${Math.floor((GAME_SETTINGS.CRITICAL_DAMAGE_MULTIPLIER + player.criticalDamageBonus - 1) * 100)}%媛 ?섏뿀??`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'rage_oath',
                name: "寃⑸끂??留뱀꽭",
                description: !player.hasRageOath 
                    ? "怨듦꺽 ?④낵媛 利앷??⑸땲?? (+30%)" 
                    : `怨듦꺽 ?④낵媛 利앷??⑸땲?? (+20%, ?꾩옱: ${Math.floor((player.attackBonus - 1) * 100)}%)`,
                effect: () => {
                    if (!player.hasRageOath) {
                        player.hasRageOath = true;
                        player.attackBonus = 1.3;
                        const message = "寃⑸끂???섏쓣 ?뚯뼱?대뒗 ?λ젰???띾뱷?덈떎!";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                    player.attackBonus *= 1.2;
                    const message = `怨듦꺽 ?④낵媛 ${Math.floor((player.attackBonus - 1) * 100)}%媛 ?섏뿀??`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'guard_oath',
                name: "?섑샇??留뱀꽭",
                description: !player.hasGuardOath 
                    ? "諛⑹뼱 ?④낵媛 利앷??⑸땲?? (+30%)" 
                    : `諛⑹뼱 ?④낵媛 利앷??⑸땲?? (+20%, ?꾩옱: ${Math.floor((player.defenseBonus - 1) * 100)}%)`,
                effect: () => {
                    if (!player.hasGuardOath) {
                        player.hasGuardOath = true;
                        player.defenseBonus = 1.3;
                        const message = "?섑샇???섏?瑜?遺덊깭?곕뒗 ?λ젰???띾뱷?덈떎!";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                    player.defenseBonus *= 1.2;
                    const message = `諛⑹뼱 ?④낵媛 ${Math.floor((player.defenseBonus - 1) * 100)}%媛 ?섏뿀??`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {
                type: 'thorns_conversion',
                name: '泥좎쓽 蹂듭닔',
                description: !player.hasThornsConversion
                    ? '諛섍꺽 怨꾩닔媛 0.30源뚯? ?곸듅?⑸땲??'
                    : `諛섍꺽 怨꾩닔媛 利앷??⑸땲?? (+0.10, ?꾩옱: ${(player.thornsCoeff ?? 0).toFixed(2)})`,
                effect: () => {
                    const limit = PLAYER_STAT_LIMITS.THORNS_COEFF;
                    if (!player.hasThornsConversion) {
                        player.hasThornsConversion = true;
                        player.thornsCoeff = Math.max(player.thornsCoeff ?? 0, 0.3);
                        const message = '諛섍꺽 怨꾩닔媛 0.30???섏뿀??';

                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });

                        return message;
                    }

                    if (player.thornsCoeff >= limit) {
                        return '諛섍꺽 怨꾩닔媛 ?대? 理쒕?移섏엯?덈떎.';
                    }

                    player.thornsCoeff = clampToLimit((player.thornsCoeff ?? 0) + 0.1, limit);
                    const message = `諛섍꺽 怨꾩닔媛 ${(player.thornsCoeff ?? 0).toFixed(2)}源뚯? ?곸듅?덈떎.`;

                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });

                    return message;
                }
            },
            {
                type: 'endurance',
                name: "?몃궡??,
                description: !player.hasEndurance 
                    ? "HP媛 30% ?댄븯????諛⑹뼱?μ씠 利앷??⑸땲?? (+50%)" 
                    : `?꾧린 ??諛⑹뼱?μ씠 利앷??⑸땲?? (+20%, ?꾩옱: ${Math.floor(player.enduranceBonus * 100)}%)`,
                effect: () => {
                    if (!player.hasEndurance) {
                        player.hasEndurance = true;
                        player.enduranceBonus = 0.5;
                        const message = "?꾧린 ?곹솴?먯꽌 諛⑹뼱?μ씠 利앷??섎뒗 ?λ젰???띾뱷?덈떎!";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                    player.enduranceBonus += 0.2;
                    const message = `?꾧린 ?곹솴 諛⑹뼱?μ씠 ${Math.floor(player.enduranceBonus * 100)}%媛 ?섏뿀??`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            },
            {

                type: 'luck',

                name: '?됱슫 利앷컯',

                description: (() => {

                    const increase = 0.02 + Math.floor(player.level / 5) * 0.01;

                    return `?됱슫??利앷??⑸땲?? (+${formatPercent(increase)})`;

                })(),

                isAvailable: () => (player.luck ?? 0) < PLAYER_STAT_LIMITS.LUCK,



                effect: () => {

                    const limit = PLAYER_STAT_LIMITS.LUCK;

                    const increase = 0.02 + Math.floor(player.level / 5) * 0.01;

                    const previous = player.luck ?? 0;

                    if (previous >= limit) {

                        return '?됱슫???대? 理쒕?移섏엯?덈떎.';

                    }

                    player.luck = clampToLimit(previous + increase, limit);

                    this.#eventEmitter.emit('ui:show-stat-increase', 'luck');

                    const message = `?됱슫??${formatPercent(previous)} ??${formatPercent(player.luck)}`;



                    this.#eventEmitter.emit('status:update', {

                        messages: [message],

                        append: true

                    });



                    return message;

                }

            },

           {
                type: 'combo_mastery',
                name: "?곗냽 怨듦꺽 媛뺥솕",
                description: player.multiHitCount === PLAYER_STATS.MULTI_HIT.BASE
                    ? "?곗냽 怨듦꺽??3?고?媛 ?⑸땲??"
                    : `?곗냽 怨듦꺽??1??利앷??⑸땲?? (?꾩옱: ${player.multiHitCount}?고?)`,
                effect: () => {
                    if (player.multiHitCount === PLAYER_STATS.MULTI_HIT.BASE) {
                        player.multiHitCount = PLAYER_STATS.MULTI_HIT.UPGRADED;
                        const message = "?곗냽 怨듦꺽??3?고?濡?媛뺥솕?섏뿀??";
                        
                        this.#eventEmitter.emit('status:update', {
                            messages: [message],
                            append: true
                        });
                        
                        return message;
                    }
                    player.multiHitCount++;
                    const message = `?곗냽 怨듦꺽??${player.multiHitCount}?고?媛 ?섏뿀??`;
                    
                    this.#eventEmitter.emit('status:update', {
                        messages: [message],
                        append: true
                    });
                    
                    return message;
                }
            }
        ];
    }

    #selectRandomRewards(array, count) {
        const filtered = array.filter(item => !item.isAvailable || item.isAvailable());
        const pool = filtered.length >= count ? filtered : array;
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    giveExperience(amount) {
        console.log('[RewardSystem] addExperience request', amount);
        const result = this.#eventEmitter.addExperience(amount);
        console.log('[RewardSystem] addExperience response', result);
        
        if (result.leveledUp) {
            this.#eventEmitter.emit('ui:show-level-up-effect');
            this.#eventEmitter.emit('ui:update-all');
        }
        
        this.#eventEmitter.emit('ui:update-exp-bar');
        return result;
    }
}
