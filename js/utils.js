/**
 * 가중치 기반 랜덤 선택을 위한 유틸리티 함수들
 */

// 가중치 검증
const validateWeights = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid items array');
    }

    const invalidItem = items.find(item => 
        typeof item?.weight !== 'number' || 
        item.weight < 0 || 
        !isFinite(item.weight)
    );

    if (invalidItem) {
        throw new Error(`Invalid weight in item: ${JSON.stringify(invalidItem)}`);
    }

    return true;
};

// 총 가중치 계산
const calculateTotalWeight = (items) => 
    items.reduce((sum, item) => sum + item.weight, 0);

// 가중치 정규화 (모든 가중치의 합이 1이 되도록)
const normalizeWeights = (items) => {
    const totalWeight = calculateTotalWeight(items);
    return items.map(item => ({
        ...item,
        normalizedWeight: item.weight / totalWeight
    }));
};

// 누적 확률 계산
const calculateCumulativeProbabilities = (items) => {
    let cumulative = 0;
    return items.map(item => {
        cumulative += item.normalizedWeight;
        return { ...item, cumulativeProbability: cumulative };
    });
};

// 메인 가중치 기반 랜덤 선택 함수
export function calculateWeightedRandom(items, options = {}) {
    try {
        validateWeights(items);
        
        // 빈 배열이거나 가중치 총합이 0인 경우 처리
        const totalWeight = calculateTotalWeight(items);
        if (totalWeight === 0) {
            return options.defaultItem || items[0];
        }

        // 가중치 정규화 및 누적 확률 계산
        const normalizedItems = normalizeWeights(items);
        const itemsWithCumulativeProbability = calculateCumulativeProbabilities(normalizedItems);

        // 랜덤 값 생성 (0~1)
        const random = Math.random();

        // 누적 확률을 기반으로 아이템 선택
        const selectedItem = itemsWithCumulativeProbability.find(
            item => random <= item.cumulativeProbability
        );

        // 선택된 아이템에서 내부 계산용 프로퍼티 제거
        const { normalizedWeight, cumulativeProbability, ...result } = selectedItem;
        return result;

    } catch (error) {
        console.error('Error in calculateWeightedRandom:', error);
        return options.defaultItem || items[0];
    }
}

// 테스트용 함수: 분포 검증
export function testWeightDistribution(items, iterations = 10000) {
    const results = new Map(items.map(item => [item.type || item.id, 0]));
    
    for (let i = 0; i < iterations; i++) {
        const selected = calculateWeightedRandom(items);
        const key = selected.type || selected.id;
        results.set(key, results.get(key) + 1);
    }

    // 결과를 퍼센트로 변환
    const distribution = Array.from(results.entries()).map(([key, count]) => ({
        type: key,
        percentage: (count / iterations) * 100
    }));

    return distribution;
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function safeExecute(callback, errorHandler) {
    try {
        return callback();
    } catch (error) {
        console.error('Error:', error);
        if (errorHandler) {
            errorHandler(error);
        }
        return null;
    }
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 확률 계산 헬퍼 함수
export function calculateProbability(baseChance, modifier) {
    return clamp(baseChance * modifier, 0, 1);
}

// 숫자 포맷팅 헬퍼 함수
export function formatNumber(number) {
    return Math.floor(number).toLocaleString();
}