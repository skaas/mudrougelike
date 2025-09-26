const REWARD_POOL = [
    {
        id: 'attack-boost-5',
        type: 'STAT',
        stat: 'attack',
        amount: 5,
        title: 'Steel Edge',
        description: 'Attack +5'
    },
    {
        id: 'attack-boost-9',
        type: 'STAT',
        stat: 'attack',
        amount: 9,
        title: 'Bloodforged Blade',
        description: 'Attack +9'
    },
    {
        id: 'heal-40',
        type: 'HEAL_PERCENT',
        amount: 0.4,
        title: 'Minor Healing Draft',
        description: 'Restore 40% of max HP'
    },
    {
        id: 'heal-70',
        type: 'HEAL_PERCENT',
        amount: 0.7,
        title: 'Elixir of Vitality',
        description: 'Restore 70% of max HP'
    },
    {
        id: 'maxhp-60',
        type: 'MAX_HP',
        amount: 60,
        title: 'Giant Heart Relic',
        description: 'Max HP +60 (current HP increases equally)'
    },
    {
        id: 'luck-amulet',
        type: 'STAT',
        stat: 'luck',
        amount: 2,
        title: 'Charm of Fortune',
        description: 'Luck +2'
    },
    {
        id: 'thorns-boost-05',
        type: 'STAT',
        stat: 'thornsCoeff',
        amount: 0.05,
        title: 'Barbed Sigil',
        description: 'Thorns +0.05'
    },
    {
        id: 'armor-5',
        type: 'ARMOR_FLAT',
        amount: 5,
        title: 'Bulwark Plates',
        description: 'Armor +5'
    },
    {
        id: 'exp-120',
        type: 'EXP',
        amount: 120,
        title: 'Battle Memory',
        description: 'Gain 120 experience'
    }
];

export function pickRewards(count = 3) {
    const pool = [...REWARD_POOL];
    const rewards = [];

    while (rewards.length < count && pool.length > 0) {
        const index = Math.floor(Math.random() * pool.length);
        const [picked] = pool.splice(index, 1);
        rewards.push(picked);
    }

    return rewards;
}

export function findRewardById(rewardId, options) {
    return options.find(option => option.id === rewardId) || null;
}

