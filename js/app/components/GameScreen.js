import React, { useCallback } from 'react';
import { useGameState } from '../hooks/useGameState.js';
import { StageInfo } from './StageInfo.js';
import { EnemyPanel } from './EnemyPanel.js';
import { LogPanel } from './LogPanel.js';
import { PlayerPanel } from './PlayerPanel.js';
import { ActionControls } from './ActionControls.js';
import { RewardModal } from './RewardModal.js';
import { GAME_PHASES } from '../state/gameReducer.js';

const h = React.createElement;

export function GameScreen() {
    const { state, actions } = useGameState();

    const handleActionClick = useCallback(() => {
        actions.performAction();
    }, [actions]);

    const stage = state.stage;
    const enemy = state.battle?.enemy;
    const actionButton = state.actionButton || { label: '다음 전투', disabled: false };
    const rewardState = state.reward || { open: false, options: [] };

    return h(
        React.Fragment,
        null,
        h(
            'div',
            { id: 'gameContainer' },
            h(
                'div',
                { className: 'info-container' },
                h(StageInfo, {
                    stage,
                    phase: state.phase
                }),
                h(EnemyPanel, {
                    enemy,
                    isBattle: state.phase === GAME_PHASES.BATTLE
                })
            ),
            h(LogPanel, { logs: state.logs }),
            h(PlayerPanel, { player: state.player, hurtToken: state.ui?.playerHurtToken || 0 }),
            h(ActionControls, {
                label: actionButton.label || '다음 전투',
                disabled: !!actionButton.disabled,
                onAction: handleActionClick,
                isRestart: state.phase === GAME_PHASES.GAME_OVER
            })
        ),
        h(RewardModal, {
            open: rewardState.open,
            options: rewardState.options || [],
            onSelect: actions.selectReward
        })
    );
}
