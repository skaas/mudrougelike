import { GAME_SETTINGS, ACTION_TYPES } from '../constants.js';
import { EVENT_TYPES } from '../EventTypes.js';
import { ActionManager } from '../actions/ActionManager.js';
import { GAME_PHASES } from '../constants.js';

const OFFENSIVE_ACTIONS = new Set([
    ACTION_TYPES.ATTACK,
    ACTION_TYPES.HEAVY_ATTACK,
    ACTION_TYPES.MULTI_HIT,
    ACTION_TYPES.MULTI_ATTACK,
    ACTION_TYPES.POWER_ATTACK,
    ACTION_TYPES.CRITICAL,
    ACTION_TYPES.ULTIMATE,
    ACTION_TYPES.SHIELD_BREAK,
    ACTION_TYPES.DESPERATE_ATTACK
]);

const asPromise = (maybePromise) => Promise.resolve(maybePromise);

export class BattleManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.turns = 0;
        this.actionManager = new ActionManager(eventEmitter);

        this.battleLog = [];
        this.currentEnemy = null;
        this.currentPlayer = null;
        this.battleStage = 1;
        this.turnCount = 0;
        this.roundContext = { enemyActed: false, playerActed: false };

        this.setupEventListeners(this);
    }

    ensureManagers() {
        if (!this.playerManager && this.gameState?.playerManager) {
            this.playerManager = this.gameState.playerManager;
        }
        if (!this.enemyManager && this.gameState?.enemyManager) {
            this.enemyManager = this.gameState.enemyManager;
        }
        if (!this.playerManager || !this.enemyManager) {
            throw new Error('[BattleManager] playerManager 또는 enemyManager 참조가 필요합니다.');
        }
    }

    beginRound() {
        this.ensureManagers();
        this.turns += 1;
        this.roundContext = { enemyActed: false, playerActed: false };

        const player = this.playerManager.getPlayer();\n        const enemy = this.enemyManager.getEnemy();\n\n        player?.resetTurnState?.();\n        enemy?.resetTurnState?.();\n\n        this.eventEmitter.emit('battle:round-start', {\n            turn: this.turns,\n            player,\n            enemy\n        });
    }

    hasEnemyActedThisRound() {
        return Boolean(this.roundContext?.enemyActed);
    }

    markEnemyActed() {
        if (!this.roundContext) {
            this.roundContext = {};
        }
        this.roundContext.enemyActed = true;
    }

    markPlayerActed() {
        if (!this.roundContext) {
            this.roundContext = {};
        }
        this.roundContext.playerActed = true;
    }

    selectPlayerAction(player) {
        return this.actionManager.selectPlayerAction(player);
    }

    calculatePlayerStrikes(player, action) {
        if (!player || !action) {
            return 1;
        }
        if (!OFFENSIVE_ACTIONS.has(action.type)) {
            return 1;
        }
        const extra = player.getTotalExtraStrikes ? player.getTotalExtraStrikes() : 0;
        return Math.max(1, 1 + extra);
    }

    determineInitiative(player, enemy) {
        const playerSpeed = player?.getEffectiveSpeed ? player.getEffectiveSpeed() : (player?.speed ?? 0);
        const enemySpeed = enemy?.getEffectiveSpeed ? enemy.getEffectiveSpeed() : (enemy?.speed ?? 0);

        if (playerSpeed > enemySpeed) {
            return 'player';
        }
        if (playerSpeed < enemySpeed) {
            return 'enemy';
        }
        return 'player';
    }

    async performPlayerAttack(options = {}) {
        this.ensureManagers();
        const player = this.playerManager.getPlayer();
        const enemy = this.enemyManager.getEnemy();

        if (!player || !enemy) {
            throw new Error('[BattleManager] 전투 대상이 없습니다.');
        }

        const action = options.actionOverride ? options.actionOverride : this.selectPlayerAction(player);
        if (!action) {
            throw new Error('[BattleManager] 선택할 수 있는 플레이어 스킬이 없습니다.');
        }

        const strikeCount = options.strikesOverride ?? this.calculatePlayerStrikes(player, action);
        const strikeResults = [];
        const narrativeContext = options.context ?? 'battle-player-attack';
        let plannedStrikes = strikeCount;

        for (let i = 0; i < plannedStrikes; i += 1) {
            if (enemy.isDead()) {
                break;
            }

            const isExtraStrike = i > 0;
            const strikeAction = isExtraStrike ? { ...action, type: ACTION_TYPES.ATTACK, name: `${action.name || 'Attack'} (Extra)` } : action;
            const result = this.executeAction(strikeAction, player, enemy, {\n                actorType: 'player',\n                strikeIndex: i,\n                extraStrike: isExtraStrike\n            });\n\n            await asPromise(this.eventEmitter.emit('battle:player-strike', {\n                player,\n                enemy,\n                action: strikeAction,\n                result,\n                strikeIndex: i\n            }));

            strikeResults.push({ action: strikeAction, result });\n\n            const recalculated = this.calculatePlayerStrikes(player, action);\n            if (recalculated > plannedStrikes) {\n                plannedStrikes = recalculated;\n            }
            await this.emitStrikeNarrative(player, enemy, strikeAction, result, { context: narrativeContext });
            this.emitBattleStateUpdate();
        }

        this.markPlayerActed();

        return {
            action,
            strikesPerformed: strikeResults.length,
            strikeResults,
            enemyDefeated: enemy.isDead(),
            playerDefeated: player.isDead()
        };
    }

    async performEnemyAttack(options = {}) {
        this.ensureManagers();
        const player = this.playerManager.getPlayer();
        const enemy = this.enemyManager.getEnemy();

        if (!player || !enemy) {
            throw new Error('[BattleManager] 전투 대상이 없습니다.');
        }

        const action = options.actionOverride ?? { type: ACTION_TYPES.ATTACK, name: 'Attack' };
        const result = this.executeAction(action, enemy, player, {
            actorType: 'enemy',
            preemptive: Boolean(options.preemptive)
        });

        this.markEnemyActed();
        await this.emitStrikeNarrative(enemy, player, action, result, { context: 'battle-enemy-attack' });
        this.emitBattleStateUpdate();

        return {
            action,
            result,
            enemyDefeated: enemy.isDead(),
            playerDefeated: player.isDead()
        };
    }

    executeAction(action, actor, target, context = {}) {
        const defaultResult = {
            damage: 0,
            rawDamage: 0,
            mitigated: 0,
            isCritical: false,
            armorGain: 0,
            lifeSteal: { attempted: 0, applied: 0 },
            thorns: { attempted: 0, applied: 0 },
            freezeApplied: false,
            skipped: false,
            extraStrike: Boolean(context.extraStrike)
        };

        if (!action || !actor || !target) {
            return defaultResult;
        }

        if (actor.isStunned) {
            actor.clearFrozen?.();
            return { ...defaultResult, skipped: true };
        }

        let isCritical = actor.hasGuaranteedCrit?.() ? actor.consumeGuaranteedCrit() : false;
        if (!isCritical) {
            isCritical = this.isCriticalHit(actor);
        }

        const damageInfo = this.calculateDamage(action, actor, target, { isCritical });
        const rawDamage = damageInfo.damage;
        const shouldAttemptFreeze = OFFENSIVE_ACTIONS.has(action.type) && actor.freezeRate > 0;

        let armorGain = 0;
        let damageResult = { incoming: rawDamage, mitigated: 0, applied: 0, remainingHp: target.hp };
        let lifeSteal = { attempted: 0, applied: 0 };
        let thorns = { attempted: 0, applied: 0 };
        let freezeApplied = false;

        if (action.type === ACTION_TYPES.DEFEND) {
            armorGain = this.calculateDefense(actor);
            actor.armor = actor.armor + armorGain;
        }

        if (rawDamage > 0) {
            damageResult = target.damage(rawDamage, { ignoreArmor: Boolean(action.ignoreArmor) });
            lifeSteal = this.applyLifeSteal(actor, damageResult.applied);
            thorns = this.applyThorns(target, actor);
            if (shouldAttemptFreeze) {
                freezeApplied = this.tryApplyFreeze(actor, target);
            }
        } else if (shouldAttemptFreeze) {
            freezeApplied = this.tryApplyFreeze(actor, target);
        }

        return {
            ...defaultResult,
            damage: damageResult.applied,
            rawDamage,
            mitigated: damageResult.mitigated,
            isCritical,
            armorGain,
            lifeSteal,
            thorns,
            freezeApplied
        };
    }

    isCriticalHit(actor) {
        if (!actor) {
            return false;
        }

        const chance = actor.getEffectiveCritChance
            ? actor.getEffectiveCritChance()
            : (actor.critRate ?? GAME_SETTINGS.CRITICAL_HIT_CHANCE);

        return Math.random() < Math.min(chance, 0.9);
    }

    calculateDamage(action, actor, target, { isCritical = false } = {}) {
        const attackerPower = actor.getEffectiveAttackValue ? actor.getEffectiveAttackValue() : actor.attack ?? 0;
        const defenseFactor = Math.max(0, target.defense ?? 0);
        let baseDamage = Math.max(0, attackerPower - Math.floor(defenseFactor / 2));

        switch (action.type) {
            case ACTION_TYPES.POWER_ATTACK:
            case ACTION_TYPES.HEAVY_ATTACK:
                baseDamage = Math.floor(baseDamage * 1.5);
                break;
            case ACTION_TYPES.MULTI_HIT:
            case ACTION_TYPES.MULTI_ATTACK:
                baseDamage = Math.floor(baseDamage * 0.6);
                break;
            case ACTION_TYPES.DEFEND:
            case ACTION_TYPES.HEAL:
                baseDamage = 0;
                break;
            default:
                break;
        }

        const randomFactor = 0.9 + Math.random() * 0.2;
        let damage = Math.floor(baseDamage * randomFactor);

        if (isCritical) {
            const critMultiplier = actor.critDamage ?? GAME_SETTINGS.CRITICAL_DAMAGE_MULTIPLIER;
            damage = Math.floor(damage * critMultiplier);
        }

        return {
            baseDamage,
            damage: Math.max(0, damage)
        };
    }

    calculateDefense(actor) {
        const baseDefense = Math.floor(actor.defense * 0.5);
        const levelBonus = Math.floor(actor.level * 0.5);
        const randomFactor = 0.9 + Math.random() * 0.2;
        return Math.floor((baseDefense + levelBonus) * randomFactor);
    }

    applyLifeSteal(actor, damageApplied) {
        if (!actor || damageApplied <= 0 || !actor.lifeStealRate) {
            return { attempted: 0, applied: 0 };
        }

        const attempted = Math.floor(damageApplied * actor.lifeStealRate);
        if (attempted <= 0) {
            return { attempted: 0, applied: 0 };
        }

        const result = actor.heal(attempted, { enforceCap: true });
        return { attempted, applied: result.applied };
    }

    applyThorns(defender, attacker) {
        if (!defender || !attacker) {
            return { attempted: 0, applied: 0 };
        }

        const baseDamage = defender.getEffectiveThornsDamage ? defender.getEffectiveThornsDamage() : Math.max(0, defender.thornsCoeff ?? 0);
        const attempted = Math.max(0, Math.floor(baseDamage));
        if (attempted <= 0) {
            return { attempted: 0, applied: 0 };
        }

        const beforeHp = attacker.hp ?? 0;
        const applied = Math.min(beforeHp, attempted);
        attacker.hp = Math.max(0, beforeHp - applied);

        if (applied > 0) {
            this.emitThornsLog(defender, attacker, applied);
        }

        return { attempted, applied };
    }

    emitThornsLog(defender, attacker, amount) {
        if (amount <= 0) {
            return;
        }

        const attackerName = attacker?.name ?? 'Enemy';
        const defenderName = defender?.name ?? 'Player';
        const message = defenderName + '의 반격! ' + attackerName + '에게 ' + amount + ' 피해!';

        this.eventEmitter.emit('ui:log-message', {
            message,
            type: 'battle',
            context: 'battle-thorns'
        });

        this.eventEmitter.emit('narrative:update', {
            message,
            context: 'battle-thorns',
            append: true
        });
    }

        this.eventEmitter.emit('narrative:update', {
            message,
            context: 'battle-thorns',
            append: true
        });
    }
    }

    tryApplyFreeze(actor, target) {
        if (!actor || !target || !actor.freezeRate) {
            return false;
        }

        const chance = actor.getEffectiveFreezeChance ? actor.getEffectiveFreezeChance(target) : 0;
        if (chance <= 0) {
            return false;
        }

        if (!target.canBeFrozen || !target.canBeFrozen(this.turns)) {
            return false;
        }

        if (Math.random() < chance) {
            target.markFrozen?.(this.turns);
            return true;
        }

        return false;
    }

    emitBattleStateUpdate() {
        this.eventEmitter.emit('state:update', {
            enemy: this.currentEnemy ?? this.enemyManager?.getEnemy?.(),
            player: this.currentPlayer ?? this.playerManager?.getPlayer?.()
        });
    }

    async emitStrikeNarrative(attacker, defender, action, result, { context }) {
        const narrative = this.createAttackNarrative(attacker, defender, action, result);
        const logType = result.isCritical ? 'battle-critical' : 'battle';

        await asPromise(this.eventEmitter.emit('ui:log-message', {
            message: narrative,
            type: logType,
            context
        }));

        await asPromise(this.eventEmitter.emit('narrative:update', {
            message: narrative,
            context,
            append: true
        }));
    }

    createAttackNarrative(attacker, defender, action, result) {
        const attackerName = attacker?.name ?? 'Unknown';
        const defenderName = defender?.name ?? 'Unknown';

        if (result.skipped) {
            return `${attackerName}는 행동할 수 없었습니다.`;
        }

        if (action.type === ACTION_TYPES.DEFEND) {
            return `${attackerName}이(가) 방어 태세를 취했습니다. (방어력 +${result.armorGain})`;
        }

        if (result.damage <= 0) {
            return `${attackerName}의 공격이 ${defenderName}에게 막혔습니다.`;
        }

        if (result.isCritical) {
            return `${attackerName}의 치명타! ${defenderName}에게 ${result.damage} 피해를 주었습니다.`;
        }

        return `${attackerName}이(가) ${defenderName}에게 ${result.damage} 피해를 주었습니다.`;
    }

    increaseTurn() {
        this.turns += 1;

        if (this.currentPlayer && this.currentPlayer.resetTurnState) {
            this.currentPlayer.resetTurnState();
        }
        if (this.currentEnemy && this.currentEnemy.resetTurnState) {
            this.currentEnemy.resetTurnState();
        }

        this.eventEmitter.emit('battle:turn-changed', { turn: this.turns });
    }

    resetTurns() {
        this.turns = 0;
    }

    setupEventListeners(component) {
        this.eventEmitter.on('battle:start', this.handleBattleStart.bind(this), component);
    }

    handleBattleStart(data) {
        try {
            this.battleLog = this.battleLog || [];
            this.currentEnemy = data.enemy;
            this.currentPlayer = data.player;
            this.battleStage = data.stage || 1;
            this.turnCount = 0;

            this.resetBattleEffects();

            this.battleLog.push({ type: 'battle-start', data: {
                player: this.currentPlayer ? this.currentPlayer.name : 'Player',
                enemy: this.currentEnemy ? this.currentEnemy.name : 'Enemy',
                stage: this.battleStage
            }});

            this.eventEmitter.emit('battle:started', {
                battleLog: this.battleLog,
                enemy: this.currentEnemy,
                turnCount: this.turnCount
            });
        } catch (error) {
            console.error('[BattleManager] 전투 시작 처리 오류:', error);
        }
    }

    resetBattleEffects() {
        try {
            if (this.currentPlayer && this.currentPlayer.resetTurnState) {
                this.currentPlayer.resetTurnState();
                this.currentPlayer.clearFrozen?.();
            }

            if (this.currentEnemy && this.currentEnemy.resetTurnState) {
                this.currentEnemy.resetTurnState();
                this.currentEnemy.clearFrozen?.();
            }
        } catch (error) {
            console.error('[BattleManager] 전투 효과 초기화 오류:', error);
        }
    }
}

