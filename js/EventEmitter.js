// 클래스 외부로 상수 이동
const SILENT_EVENTS = ['ui:update-request']; // state:update와 game:message 제거

export class EventEmitter {
    constructor() {
        this.events = {};
        this.eventHandlerMap = new Map(); // 핸들러 참조 저장용
    }

    // 이벤트 등록 - 컴포넌트와 핸들러 함께 저장
    on(event, callback, component = null) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // 컴포넌트별 핸들러 관리를 위한 맵 업데이트
        if (component) {
            if (!this.eventHandlerMap.has(component)) {
                this.eventHandlerMap.set(component, new Map());
            }
            const componentMap = this.eventHandlerMap.get(component);
            if (!componentMap.has(event)) {
                componentMap.set(event, []);
            }
            componentMap.get(event).push(callback);
        }
    }

    // 특정 이벤트 핸들러 제거
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    // 컴포넌트에 연결된 모든 이벤트 핸들러 제거
    removeAllListeners(component) {
        if (!this.eventHandlerMap.has(component)) return;
        
        const componentMap = this.eventHandlerMap.get(component);
        for (const [event, handlers] of componentMap.entries()) {
            if (this.events[event]) {
                for (const handler of handlers) {
                    this.off(event, handler);
                }
            }
        }
        
        this.eventHandlerMap.delete(component);
    }

    // 특정 컴포넌트와 이벤트에 대한 모든 리스너 제거 메서드 추가
    removeAllListenersForComponent(component, event) {
        if (!this.eventHandlerMap.has(component)) return;
        
        const componentMap = this.eventHandlerMap.get(component);
        if (!componentMap.has(event)) return;
        
        const handlers = componentMap.get(event);
        
        // 이벤트에서 해당 컴포넌트의 핸들러들 제거
        if (this.events[event]) {
            for (const handler of handlers) {
                const index = this.events[event].indexOf(handler);
                if (index !== -1) {
                    this.events[event].splice(index, 1);
                }
            }
        }
        
        // 컴포넌트 맵에서 해당 이벤트 핸들러 목록 제거
        componentMap.delete(event);
        
        console.log(`컴포넌트의 ${event} 이벤트 핸들러 ${handlers.length}개 제거 완료`);
    }

    // 향상된 비동기 이벤트 발생 메서드
    async emit(eventName, data = {}) {
        try {
            // 이벤트 발생 위치 추적
            const stackTrace = new Error().stack;
            console.log(`이벤트 발생: ${eventName}`, data);
            
            // 타입 검사 추가: undefined에 대해 includes 호출 방지
            if (typeof eventName === 'string' && eventName.includes('narrative')) {
                console.log(`${eventName} 이벤트 호출 스택:`, stackTrace);
            }
            
            // 이벤트 리스너가 있는지 확인
            if (!this.events[eventName]) {
                console.log(`이벤트 ${eventName}에 대한 리스너가 없습니다.`);
                return false;
            }
            
            const promises = [];
            
            // 등록된 모든 핸들러에 이벤트 데이터 전달
            for (const handler of this.events[eventName]) {
                try {
                    // 핸들러가 함수인지 확인
                    if (typeof handler === 'function') {
                        const result = handler(data);
                        if (result instanceof Promise) {
                            promises.push(result);
                        }
                    } else {
                        console.error(`${eventName} 이벤트에 유효하지 않은 핸들러가 등록됨:`, handler);
                    }
                } catch (handlerError) {
                    console.error(`${eventName} 이벤트 핸들러 실행 중 오류:`, handlerError);
                    // 오류가 발생해도 다른 핸들러는 계속 실행
                }
            }
            
            // 모든 비동기 핸들러가 완료될 때까지 대기 (있는 경우)
            if (promises.length > 0) {
                await Promise.all(promises);
            }
            
            // 여기서 중요한 수정: 자동 이벤트 발생 코드 주석 처리
            // narrative:update 이벤트 후 narrative:updated 이벤트가 자동으로 발생하는 코드가 있다면 제거
            /*
            if (eventName === 'narrative:update') {
                await this.emit('narrative:updated', data);
            }
            */
            
            return true;
        } catch (error) {
            console.error(`이벤트 ${eventName} 처리 중 오류:`, error);
            return false;
        }
    }
    
    // 이벤트 발생 시 타임아웃 설정 (무한 대기 방지)
    async emitWithTimeout(event, data, timeout = 5000) {
        try {
            return await Promise.race([
                this.emit(event, data),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`이벤트 ${event} 처리 시간 초과`)), timeout)
                )
            ]);
        } catch (error) {
            console.error(`이벤트 ${event} 타임아웃 또는 오류:`, error);
            // 오류 발생 관련 추가 이벤트 발생
            this.emit('error:event-timeout', { event, error });
            return null;
        }
    }

    // EventEmitter 클래스에 진단 메서드 추가
    logEventHandlers() {
        console.log("=== 등록된 모든 이벤트 핸들러 ===");
        for (const [eventName, handlers] of Object.entries(this.events)) {
            console.log(`${eventName}: ${handlers.length}개 핸들러`);
            if (eventName.includes('narrative')) {
                console.log(`  ${eventName} 핸들러 상세:`, handlers);
            }
        }
    }
} 