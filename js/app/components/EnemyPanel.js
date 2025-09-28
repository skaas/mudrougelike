import React from 'react';

const h = React.createElement;

const formatPercent = (value) => `${Math.round(((value ?? 0) * 1000)) / 10}%`;
const formatRatio = (value) => (value ?? 0).toFixed(2);
const formatNumber = (value) => Math.floor(value ?? 0);

function statItem(icon, label, valueId, value) {
    return h(
        'div',
        { key: valueId, className: 'stat-item' },
        h('span', { className: 'stat-icon' }, icon),
        `${label} `,
        h('span', { id: valueId, className: 'stat-value' }, value)
    );
}

export function EnemyPanel({ enemy, isBattle }) {
    const enemyName = enemy ? enemy.name : isBattle ? 'Enemy Approaching' : 'No Enemy';
    const hpText = enemy ? `${enemy.hp} / ${enemy.maxHp}` : '-- / --';
    const hpPercent = enemy ? Math.max(0, Math.min(100, Math.floor((enemy.hp / enemy.maxHp) * 100))) : 0;

    const stats = [
        { icon: '⚔️', label: 'Attack', id: 'enemyAttack', value: enemy ? formatNumber(enemy.attack) : '-' },        { icon: '🪖', label: 'Armor', id: 'enemyArmor', value: enemy ? formatNumber(enemy.armor) : '-' },
        { icon: '🎯', label: 'Crit Rate', id: 'enemyCritRate', value: enemy ? formatPercent(enemy.critRate) : '-' },
        { icon: '💥', label: 'Crit Damage', id: 'enemyCritDamage', value: enemy ? formatRatio(enemy.critDamage) : '-' },
        { icon: '💉', label: 'Life Steal', id: 'enemyLifeSteal', value: enemy ? formatPercent(enemy.lifeStealRate) : '-' },
        { icon: '🗡️', label: 'Thorns', id: 'enemyThorns', value: enemy ? formatPercent(enemy.thornsCoeff) : '-' },
        { icon: '❄️', label: 'Freeze', id: 'enemyFreeze', value: enemy ? formatPercent(enemy.freezeRate) : '-' },
        { icon: '🍀', label: 'Luck', id: 'enemyLuck', value: enemy ? formatPercent(enemy.luck) : '-' }
    ];

    return h(
        'div',
        { id: 'enemyContainer', className: 'character-container' },
        h(
            'div',
            { id: 'enemyStats', className: 'stats' },
            h(
                'div',
                { className: 'stats-main' },
                h('div', { id: 'enemyName', className: 'character-name' }, enemyName),
                h(
                    'div',
                    { className: 'hp-bar' },
                    h('div', {
                        id: 'enemyHpBar',
                        className: `hp-fill ${enemy && enemy.isBoss ? 'boss' : ''}`.trim(),
                        style: { width: `${hpPercent}%` }
                    }),
                    h('span', { id: 'enemyHpText', className: 'hp-text' }, hpText)
                )
            ),
            h(
                'div',
                { className: 'stats-detail' },
                stats.map((stat) => statItem(stat.icon, stat.label, stat.id, stat.value))
            )
        )
    );
}
