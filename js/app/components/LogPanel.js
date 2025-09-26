import React, { useEffect, useRef } from 'react';

const LOG_TONE_CLASS = {
    player: 'player',
    enemy: 'enemy attack-highlight',
    system: 'system',
    'system-error': 'system error',
    battle: 'narrative',
    narrative: 'narrative'
};

const h = React.createElement;

export function LogPanel({ logs }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }, [logs]);

    return h(
        'div',
        { className: 'log-container' },
        h(
            'div',
            { className: 'log-scroll', id: 'logContainer', ref: containerRef },
            logs && logs.length > 0
                ? logs.map(log =>
                    h(
                        'div',
                        {
                            key: log.id,
                            className: `log-entry ${LOG_TONE_CLASS[log.tone] || ''}`.trim()
                        },
                        log.message
                    )
                )
                : h('div', { className: 'log-entry narrative' }, '아직 기록이 없습니다.')
        )
    );
}
