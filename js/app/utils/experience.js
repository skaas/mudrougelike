export function grantExperience(player, amount) {
    console.log('[experience] grantExperience start', { amount, player });
    const baseState = { ...player };
    let exp = baseState.exp + amount;
    let expToNext = baseState.expToNext;
    let level = baseState.level;
    let attack = baseState.attack;
    let maxHp = baseState.maxHp;
    let hp = baseState.hp;

    const levelUps = [];

    while (exp >= expToNext) {
        exp -= expToNext;
        level += 1;
        expToNext = Math.floor(expToNext * 1.25);

        attack += 3;
        maxHp += 35;
        hp = maxHp;

        levelUps.push({
            level,
            attack,
            maxHp,
            playerState: {
                ...baseState,
                level,
                attack,
                maxHp,
                hp,
                exp,
                expToNext
            }
        });
    }

    const finalPlayer = {
        ...baseState,
        exp,
        expToNext,
        level,
        attack,
        maxHp,
        hp
    };

    console.log('[experience] grantExperience end', { finalPlayer, levelUps });

    return {
        player: finalPlayer,
        levelUps
    };
}
