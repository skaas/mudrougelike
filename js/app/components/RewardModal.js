import React from 'react';

const h = React.createElement;

export function RewardModal({ open, options, onSelect }) {
    const overlayStyle = { display: open ? 'block' : 'none' };
    const containerStyle = { display: open ? 'flex' : 'none' };

    return h(
        React.Fragment,
        null,
        h('div', { className: 'overlay', id: 'overlay', style: overlayStyle }),
        h(
            'div',
            { className: 'reward-container', id: 'rewardContainer', style: containerStyle },
            h('div', { className: 'reward-title' }, '강화 선택'),
            h(
                'div',
                { className: 'reward-options' },
                options && options.length > 0
                    ? options.map(option =>
                        h(
                            'button',
                            {
                                key: option.id,
                                className: 'reward-button',
                                onClick: () => onSelect(option.id)
                            },
                            h('div', { className: 'reward-title' }, option.title),
                            h('div', { className: 'reward-description' }, option.description)
                        )
                    )
                    : h('div', { className: 'reward-placeholder' }, '선택할 수 있는 보상이 없습니다.')
            )
        )
    );
}
