import React from 'react';
import { GAME_PHASES } from '../state/gameReducer.js';

const h = React.createElement;

export function StageInfo({ stage, phase }) {
    const level = stage?.level ?? 1;
    const encountersCleared = stage?.encountersCleared ?? 0;
    const encountersPerStage = stage?.encountersPerStage ?? 0;

    const progressRatio = encountersPerStage > 0
        ? Math.min(encountersCleared / encountersPerStage, 1)
        : 0;
    const fightsRemaining = Math.max(encountersPerStage - encountersCleared, 0);
    const progressPercent = Math.floor(progressRatio * 100);

    let progressLabel;
    if (fightsRemaining <= 0) {
        progressLabel = '층 정리 완료!';
    } else if (fightsRemaining === 1) {
        progressLabel = phase === GAME_PHASES.BATTLE ? '보스와 교전 중!' : '다음 전투는 보스!';
    } else {
        progressLabel = `다음 보스까지: ${fightsRemaining} 전투`;
    }

    return h(
        'div',
        { id: 'stageInfoContainer', className: 'stage-info-container' },
        h('div', { id: 'stageInfo', className: 'stage-title' }, `${level}층 탐험 진행 중`),
        h(
            'div',
            { className: 'stage-progress' },
            h(
                'div',
                { className: 'progress-bar' },
                h('div', {
                    id: 'stageProgressBar',
                    className: 'progress-fill',
                    style: { width: `${progressPercent}%` }
                })
            ),
            h(
                'div',
                { className: 'progress-text' },
                progressLabel,
                fightsRemaining > 1
                    ? h('span', { id: 'stageProgress' }, ` (${encountersCleared}/${encountersPerStage})`)
                    : null
            )
        )
    );
}
