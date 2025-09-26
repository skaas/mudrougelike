import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.js';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('React root element(#root)를 찾을 수 없습니다.');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    React.createElement(
        React.StrictMode,
        null,
        React.createElement(App)
    )
);
