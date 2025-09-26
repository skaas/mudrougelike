import React from 'react';

const h = React.createElement;

export function ActionControls({ label, disabled, onAction, isRestart = false }) {
    const className = `action-button${isRestart ? ' restart' : ''}`;

    return h(
        'button',
        {
            id: 'actionButton',
            className,
            onClick: onAction,
            disabled
        },
        label
    );
}
