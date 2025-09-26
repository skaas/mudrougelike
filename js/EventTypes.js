// 모든 이벤트 타입을 한 곳에서 관리
export const EVENT_TYPES = {
  GAME: {
    INITIALIZED: 'game:initialized',
    START: 'game:start',
    END: 'game:end',
    PREPARE_NEXT_BATTLE: 'game:prepare-next-battle',
    MESSAGE: 'game:message'
  },
  BATTLE: {
    START: 'battle:start',
    END: 'battle:end',
    ACTION: 'battle:action',
    PLAYER_TURN: 'battle:player-turn',
    ENEMY_TURN: 'battle:enemy-turn'
  },
  STATE: {
    UPDATE: 'state:update',
    PLAYER_UPDATE: 'state:player-update',
    ENEMY_UPDATE: 'state:enemy-update',
    INITIALIZED: 'state:initialized'
  },
  UI: {
    ACTION_BUTTON_CLICKED: 'ui:action-button-clicked',
    UPDATE_REQUEST: 'ui:update-request',
    SHOW_REWARDS: 'ui:show-rewards'
  },
  PLAYER: {
    LEVEL_UP: 'player:level-up',
    BUFF_APPLIED: 'player:buff-applied',
    BUFF_REMOVED: 'player:buff-removed'
  },
  STAGE: {
    CHANGED: 'stage:changed',
    LEVEL_CHANGED: 'stage:level-changed',
    BOSS_ENCOUNTERED: 'stage:boss-encountered'
  }
}; 