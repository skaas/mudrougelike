import { CardEffects } from './effects.js';

export const CARD_RARITIES = {
    COMMON: 'common',
    RARE: 'rare'
};

export const COMMON_CARDS = [
    {
        key: 'card.attack.percent.5',
        name: '공격력 +5%',
        rarity: CARD_RARITIES.COMMON,
        description: '기본 공격력을 5% 증가시킵니다.',
        apply: ({ player }) => {
            if (!player) return;
            player.attack = Math.max(0, Math.round(player.attack * 1.05));
        }
    },
    {
        key: 'card.speed.plus1',
        name: '속도 +1',
        rarity: CARD_RARITIES.COMMON,
        description: '속도를 1 증가시켜 선공과 추가타 확률을 높입니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'speed', 1);
        }
    },
    {
        key: 'card.crit.rate.plus3',
        name: '치명타 확률 +3%',
        rarity: CARD_RARITIES.COMMON,
        description: '치명타 확률을 3%p 증가시킵니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'critRate', 0.03);
        }
    },
    {
        key: 'card.lifeSteal.plus2',
        name: '흡혈 +2%',
        rarity: CARD_RARITIES.COMMON,
        description: '흡혈 비율을 2%p 증가시킵니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'lifeStealRate', 0.02);
        }
    },
    {
        key: 'card.thorns.plus005',
        name: '가시 계수 +0.05',
        rarity: CARD_RARITIES.COMMON,
        description: '반격 계수를 0.05 증가시킵니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'thornsCoeff', 0.05);
        }
    },
    {
        key: 'card.freeze.plus2',
        name: '동결 확률 +2%',
        rarity: CARD_RARITIES.COMMON,
        description: '동결 확률을 2%p 증가시킵니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'freezeRate', 0.02);
        }
    },
    {
        key: 'card.armor.plus1',
        name: '방어력 +1',
        rarity: CARD_RARITIES.COMMON,
        description: '방어력을 1 증가시킵니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'armor', 1);
        }
    },
    {
        key: 'card.luck.plus3',
        name: '행운 +3%',
        rarity: CARD_RARITIES.COMMON,
        description: '행운을 3%p 증가시켜 확률 기반 효과를 향상시킵니다.',
        apply: ({ player }) => {
            CardEffects.increaseFlat(player, 'luck', 0.03);
        }
    }
];

export const RARE_CARDS = [
    {
        key: 'card.rare.crit.extraStrike',
        name: '치명타 시 추가타',
        rarity: CARD_RARITIES.RARE,
        description: '치명타가 발생하면 즉시 추가타 1회를 부여합니다.',
        apply: ({ registry }) => {
            registry.registerPlayerStrikeEffect('card.rare.crit.extraStrike', ({ player, result }) => {
                if (result.isCritical && !result.extraStrike) {
                    CardEffects.addBonusStrike(player, 1);
                }
            });
        }
    },
    {
        key: 'card.rare.lowhp.thornsBoost',
        name: '절체절명 가시',
        rarity: CARD_RARITIES.RARE,
        description: '플레이어 HP가 50% 이하일 때 해당 턴 동안 가시 피해 1.5배.',
        apply: ({ registry }) => {
            registry.registerRoundStartEffect('card.rare.lowhp.thornsBoost', ({ player }) => {
                if (!player) return;
                if (player.hp <= player.maxHp * 0.5) {
                    player.addThornsMultiplier?.(1.5);
                }
            });
        }
    },
    {
        key: 'card.rare.nextChest.rare',
        name: '다음 보상 희귀 확정',
        rarity: CARD_RARITIES.RARE,
        description: '다음 상자 보상이 희귀 등급으로 확정됩니다.',
        apply: ({ registry }) => {
            registry.markNextChestAsRare();
        }
    },
    {
        key: 'card.rare.freeze.forceCrit',
        name: '빙결 연계 치명타',
        rarity: CARD_RARITIES.RARE,
        description: '동결에 성공하면 그 턴 동안 치명타가 확정됩니다 (1회).',
        apply: ({ registry }) => {
            registry.registerPlayerStrikeEffect('card.rare.freeze.forceCrit', ({ player, result }) => {
                if (result.freezeApplied) {
                    CardEffects.addGuaranteedCrit(player, 1);
                }
            });
        }
    }
];

export const CARD_DEFINITIONS = [...COMMON_CARDS, ...RARE_CARDS];

