// 비동기 처리 유틸리티
export class AsyncUtils {
    // 지정된 시간만큼 대기
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Promise를 안전하게 실행
    static async safePromise(promise, errorMessage = "작업 실패") {
        try {
            return await promise;
        } catch (error) {
            console.error(`${errorMessage}: ${error.message}`);
            return null;
        }
    }
    
    // 시간 제한이 있는 Promise
    static timeout(promise, ms, timeoutMessage = "시간 초과") {
        let timeoutId;
        
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, ms);
        });
        
        return Promise.race([
            promise,
            timeoutPromise
        ]).finally(() => clearTimeout(timeoutId));
    }
    
    // Promise 시퀀스 실행 (배열의 작업을 순차적으로 수행)
    static async sequence(tasks) {
        const results = [];
        for (const task of tasks) {
            try {
                results.push(await task());
            } catch (error) {
                console.error(`시퀀스 작업 실패: ${error.message}`);
                results.push(null);
            }
        }
        return results;
    }
    
    // 병렬 실행 한계 설정 (너무 많은 병렬 작업 방지)
    static async parallelLimit(tasks, limit = 5) {
        const results = new Array(tasks.length);
        const executing = new Set();
        
        async function execute(task, index) {
            try {
                const result = await task();
                results[index] = result;
            } catch (error) {
                console.error(`작업 ${index} 실패: ${error.message}`);
                results[index] = null;
            } finally {
                executing.delete(index);
            }
        }
        
        let index = 0;
        while (index < tasks.length) {
            if (executing.size < limit) {
                executing.add(index);
                execute(tasks[index], index);
                index++;
            } else {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        // 모든 작업이 완료될 때까지 대기
        while (executing.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return results;
    }
    
    // 순차적으로 작업 실행
    static async runSequentially(tasks) {
        const results = [];
        
        for (const task of tasks) {
            try {
                // 각 작업을 순차적으로 실행
                results.push(await task());
            } catch (error) {
                console.error('순차 실행 중 오류:', error);
                results.push(null);
            }
        }
        
        return results;
    }
    
    // 병렬로 작업 실행
    static async runParallel(tasks) {
        try {
            // 모든 작업을 동시에 실행
            return await Promise.all(
                tasks.map(task => 
                    task().catch(error => {
                        console.error('병렬 실행 중 오류:', error);
                        return null;
                    })
                )
            );
        } catch (error) {
            console.error('병렬 실행 치명적 오류:', error);
            return Array(tasks.length).fill(null);
        }
    }
} 