import { GAME_SETTINGS } from '../../constants.js';

const formatChance = (value) => Math.min(Math.max(value ?? 0, 0), 0.9);

export function rollDamage(attacker, defender) {
    const baseDamage = Math.max(0, attacker.attack ?? 0);
    const randomFactor = 0.9 + Math.random() * 0.2;
    const scaledDamage = Math.floor(baseDamage * randomFactor);

    const critChanceSource = attacker.getEffectiveCritChance
        ? attacker.getEffectiveCritChance()
        : (attacker.critRate ?? GAME_SETTINGS.CRITICAL_HIT_CHANCE);
    const luckBonus = attacker.luck ?? 0;
    const effectiveCritChance = formatChance(critChanceSource * (1 + luckBonus));
    const isCritical = Math.random() < effectiveCritChance;

    const critMultiplier = attacker.critDamage ?? GAME_SETTINGS.CRITICAL_DAMAGE_MULTIPLIER;
    const finalDamage = isCritical ? Math.floor(scaledDamage * critMultiplier) : scaledDamage;

    return {
        damage: Math.max(0, finalDamage),
        isCritical
    };
}

export function applyDamageToPlayer(player, incomingDamage) {
    const armor = player.armor ?? 0;
    const incoming = Math.max(0, incomingDamage);
    const mitigated = Math.min(armor, incoming);
    const applied = Math.max(0, incoming - mitigated);

    return {
        hp: Math.max(0, (player.hp ?? 0) - applied)
    };
}
