/**
 * @typedef {Object} GameViewPort
 * @property {(snapshot: any) => void} [onGameInitialized]
 * @property {(payload: { previous: string, next: string }) => void} [onPhaseChanged]
 * @property {(snapshot: any) => void} [onBattleRoundStart]
 * @property {(result: any) => void} [onPlayerActionResolved]
 * @property {(result: any) => void} [onEnemyActionResolved]
 * @property {(snapshot: any) => void} [onBattleComplete]
 * @property {(rewards: any[]) => void} [showRewards]
 */

export const GameViewPortShape = {};