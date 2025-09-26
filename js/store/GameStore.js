export class GameStore {
    constructor() {
        this.state = {
            player: null,
            enemy: null,
            stage: 1,
            level: 1,
            gamePhase: GAME_PHASES.EXPLORE,
            turns: 0,
            // 기타 상태들
        };
        
        this.listeners = [];
    }
    
    // 상태 변경 메서드
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }
    
    // 특정 상태만 업데이트
    updateState(path, value) {
        // path는 'player.hp'와 같은 형태
        const pathParts = path.split('.');
        const newState = { ...this.state };
        
        let current = newState;
        for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
        }
        
        current[pathParts[pathParts.length - 1]] = value;
        this.state = newState;
        this.notifyListeners();
    }
    
    // 구독 메서드
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    // 리스너 통지
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
} 