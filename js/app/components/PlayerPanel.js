import React from 'react';

const h = React.createElement;

const formatPercent = (value) => `${Math.round(((value ?? 0) * 1000)) / 10}%`;
const formatRatio = (value) => (value ?? 0).toFixed(2);
const formatNumber = (value) => Math.floor(value ?? 0);

function createStatRow(icon, label, id, value) {
    return h(
        'div',
        { key: id, className: 'stat-item' },
        h('span', { className: 'stat-icon' }, icon),
        `${label} `,
        h('span', { id, className: 'stat-value' }, value)
    );
}

export function PlayerPanel({ player, hurtToken = 0 }) {
    const [isHurt, setIsHurt] = React.useState(false);

    React.useEffect(() => {
        if (!player || hurtToken <= 0) {
            return;
        }
        setIsHurt(true);
        const timeoutId = setTimeout(() => setIsHurt(false), 360);
        return () => clearTimeout(timeoutId);
    }, [hurtToken, player]);

    if (!player) {
        return h('div', { className: 'character player' }, 'No player data');
    }

    const hpPercent = Math.max(0, Math.min(100, Math.floor((player.hp / player.maxHp) * 100)));
    const expTarget = player.maxExp ?? player.expToNext ?? 0;
    const expPercent = expTarget
        ? Math.max(0, Math.min(100, Math.floor((player.exp / expTarget) * 100)))
        : 0;

    const stats = [
        { icon: '⚔️', label: 'Attack', id: 'playerAttack', value: formatNumber(player.attack) },        { icon: '🪖', label: 'Armor', id: 'playerArmor', value: formatNumber(player.armor) },
        { icon: '🎯', label: 'Crit Rate', id: 'playerCritRate', value: formatPercent(player.critRate) },
        { icon: '💥', label: 'Crit Damage', id: 'playerCritDamage', value: formatRatio(player.critDamage) },
        { icon: '💉', label: 'Life Steal', id: 'playerLifeSteal', value: formatPercent(player.lifeStealRate) },
        { icon: '🗡️', label: 'Thorns', id: 'playerThorns', value: formatPercent(player.thornsCoeff) },
        { icon: '❄️', label: 'Freeze', id: 'playerFreeze', value: formatPercent(player.freezeRate) },
        { icon: '🍀', label: 'Luck', id: 'playerLuck', value: formatPercent(player.luck) },
        { icon: '❤️', label: 'Heal Cap', id: 'playerHealCap', value: formatPercent(player.turnHealingCapRatio) }
    ];

    return h(
        'div',
        { className: `character player ${isHurt ? 'hurt' : ''}`.trim() },
        h(
            'div',
            { className: 'stats-container' },
            h(
                'div',
                { className: 'stats-main' },
                h('div', { className: 'character-name' }, player.name),
                h(
                    'div',
                    { className: 'player-info' },
                    h(
                        'div',
                        { className: 'level-exp-container' },
                        h('span', { id: 'levelText' }, `Lv.${player.level}`),
                        h(
                            'div',
                            { className: 'exp-bar-container' },
                            h('div', {
                                id: 'expBar',
                                className: 'exp-bar',
                                style: { width: `${expPercent}%` }
                            })
                        )
                    )
                ),
                h(
                    'div',
                    { className: 'hp-bar' },
                    h('div', {
                        id: 'playerHpBar',
                        className: 'hp-fill player',
                        style: { width: `${hpPercent}%` }
                    }),
                    h('span', { id: 'playerHpText', className: 'hp-text' }, `${player.hp} / ${player.maxHp}`)
                )
            ),
            h(
                'div',
                { id: 'playerStats', className: 'stats-detail' },
                stats.map((stat) => createStatRow(stat.icon, stat.label, stat.id, stat.value))
            )
        )
    );
}
