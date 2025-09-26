import React from 'react';
import { GameProvider } from './state/GameContext.js';
import { GameScreen } from './components/GameScreen.js';

export function App() {
    return React.createElement(
        GameProvider,
        null,
        React.createElement(GameScreen)
    );
}
