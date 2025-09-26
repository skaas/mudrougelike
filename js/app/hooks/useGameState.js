import { useGameStateContext, useGameActionsContext } from '../state/GameContext.js';

export function useGameState() {
    const state = useGameStateContext();
    const actions = useGameActionsContext();
    return { state, actions };
}
