import React, {
    createContext,
    useReducer,
    useRef,
    useEffect,
    useMemo,
    useContext
} from 'react';
import { createInitialState, gameReducer } from './gameReducer.js';
import { createGameActions } from './GameActions.js';

const GameStateContext = createContext(null);
const GameActionsContext = createContext(null);

export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
    const stateRef = useRef(state);
    stateRef.current = state;

    const actions = useMemo(
        () => createGameActions(() => stateRef.current, dispatch),
        [dispatch]
    );

    useEffect(() => {
        actions.initialize();
    }, [actions]);

    return React.createElement(
        GameStateContext.Provider,
        { value: state },
        React.createElement(
            GameActionsContext.Provider,
            { value: actions },
            children
        )
    );
}

export function useGameStateContext() {
    const context = useContext(GameStateContext);
    if (context === null) {
        throw new Error('useGameStateContext는 GameProvider 내부에서만 사용할 수 있습니다.');
    }
    return context;
}

export function useGameActionsContext() {
    const context = useContext(GameActionsContext);
    if (context === null) {
        throw new Error('useGameActionsContext는 GameProvider 내부에서만 사용할 수 있습니다.');
    }
    return context;
}
