import { 
    STAGE_SETTINGS, 
    MESSAGES, 
    UI_EVENTS, 
    LOG_STYLES,
    MESSAGE_DELAYS,
    MESSAGE_TYPES
} from './constants.js';
import { EVENT_TYPES } from './EventTypes.js';
import { AsyncUtils } from './utils/AsyncUtils.js';

export class UIManager {
    #eventEmitter;
    #messageQueue = [];
    #isProcessingQueue = false;
    
    // 내러티브 메시지 큐 추가
    narrativeMessageQueue = [];
    isProcessingNarrativeQueue = false;
    
    constructor(eventEmitter) {
        console.log('UIManager constructor called');
        this.#eventEmitter = eventEmitter;
        this.elements = {};
        
        // DOM이 완전히 로드된 후 UI 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM 로드 완료, UI 초기화 시작');
                this.setupUI();
                this.setupEventListeners(this);
            });
        } else {
            // 이미 DOM이 로드된 경우
            console.log('DOM 이미 로드됨, UI 초기화 시작');
            this.setupUI();
            this.setupEventListeners(this);
        }
        
        console.log('UIManager initialization complete');
    }

    setupUI() {
        this.initializeElements();
    }

    initializeElements() {
        console.log('initializeElements 호출됨: DOM 상태=', document.readyState);
        
        this.elements = {
            playerHp: document.getElementById('playerHpText'),
            enemyHp: document.getElementById('enemyHpText'),
            playerHpBar: document.getElementById('playerHpBar'),
            enemyHpBar: document.getElementById('enemyHpBar'),
            playerAttack: document.getElementById('playerAttack'),
            playerDefense: document.getElementById('playerDefense'),
            playerLuck: document.getElementById('playerLuck'),
            playerArmor: document.getElementById('playerArmor'),
            playerCritRate: document.getElementById('playerCritRate'),
            playerCritDamage: document.getElementById('playerCritDamage'),
            playerLifeSteal: document.getElementById('playerLifeSteal'),
            playerThorns: document.getElementById('playerThorns'),
            playerFreeze: document.getElementById('playerFreeze'),
            playerHealCap: document.getElementById('playerHealCap'),
            enemyAttack: document.getElementById('enemyAttack'),
            enemyDefense: document.getElementById('enemyDefense'),
            enemyLuck: document.getElementById('enemyLuck'),
            enemyArmor: document.getElementById('enemyArmor'),
            enemyCritRate: document.getElementById('enemyCritRate'),
            enemyCritDamage: document.getElementById('enemyCritDamage'),
            enemyLifeSteal: document.getElementById('enemyLifeSteal'),
            enemyThorns: document.getElementById('enemyThorns'),
            enemyFreeze: document.getElementById('enemyFreeze'),
            enemyStatus: document.getElementById('enemyStatus'),
            logContainer: document.getElementById('logContainer'),
            actionButton: document.getElementById('actionButton'),
            overlay: document.getElementById('overlay'),
            rewardContainer: document.getElementById('rewardContainer'),
            stageInfo: document.getElementById('stageInfo'),
            stageProgressBar: document.getElementById('stageProgressBar'),
            stageProgress: document.getElementById('stageProgress'),
            stageInfoContainer: document.getElementById('stageInfoContainer'),
            enemyContainer: document.getElementById('enemyContainer'),
            playerStats: document.getElementById('playerStats'),
            enemyStats: document.getElementById('enemyStats'),
        };

        // 초기 메시지 정의
        const INITIAL_MESSAGES = [
            "=== 게임 상태 ===",
            "광신도들이 점령한 관측소에 잠입했다.",
            "이곳을 탈환하고 평화를 되찾아야 한다."
        ];
        
        // 상태창 생성 및 설정 - 여기서 statusNarrative 참조가 생성됨
        this.initializeStatusContainer(INITIAL_MESSAGES);

        // 액션 버튼에 로그 추가
        if (this.elements.actionButton) {
            this.elements.actionButton.addEventListener('click', () => {
                console.log('[디버그] 액션 버튼 클릭됨 - UIManager');
                // 버튼 상태 로그 추가
                console.log('[디버그] 액션 버튼 상태:', {
                    disabled: this.elements.actionButton.disabled,
                    innerHTML: this.elements.actionButton.innerHTML,
                    style: this.elements.actionButton.style.cssText
                });
                
                this.#eventEmitter.emit('ui:action-button-clicked');
            });
        }
    }

    initializeStatusContainer(initialMessages) {
        console.log('상태창 컨테이너 초기화 시작');
        
        try {
            // 먼저 기존 상태창이 있는지 확인
            let statusElement = document.querySelector('.character-stats.terminal');
            
            if (!statusElement) {
                console.log('상태창 컨테이너를 새로 생성합니다');
                // 상태창 생성
                statusElement = document.createElement('div');
                statusElement.className = 'character-stats terminal';
                
                // 스타일 설정
                Object.assign(statusElement.style, {
                    backgroundColor: '#003300',
                    color: '#33ff33',
                    padding: '10px',
                    borderRadius: '5px',
                    height: '150px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #00ff00'
                });
                
                // 위치에 추가
                const playerStatsElement = document.getElementById('playerStats');
                if (playerStatsElement) {
                    playerStatsElement.appendChild(statusElement);
                    console.log('상태창을 playerStats에 추가했습니다');
                } else {
                    document.body.appendChild(statusElement);
                    console.log('상태창을 body에 추가했습니다');
                }
            } else {
                console.log('기존 상태창을 사용합니다:', statusElement);
            }
            
            // 상태창 요소 참조 저장
            this.elements.statusNarrative = statusElement;
            console.log('상태창 참조 설정 완료:', this.elements.statusNarrative);
            
            // 메시지 내역 배열 초기화
            this.narrativeMessages = [];
            
            // 초기 메시지 직접 설정 (이벤트 사용 안 함)
            if (initialMessages && initialMessages.length > 0) {
                const message = initialMessages.join('\n\n');
                console.log('초기 상태창 메시지 직접 설정:', message);
                
                // 메시지 저장
                this.narrativeMessages = initialMessages;
                
                // 상태창에 표시 (타이핑 효과 적용)
                this.typewriterEffect(
                    this.elements.statusNarrative,
                    message,
                    30,
                    () => {
                        console.log('초기 메시지 타이핑 효과 완료');
                        // 타이핑 완료 후 애니메이션 효과
                        this.elements.statusNarrative.style.animation = 'none';
                        setTimeout(() => {
                            this.elements.statusNarrative.style.animation = 'highlight 1s ease';
                        }, 10);
                    }
                );
            }
        } catch (error) {
            console.error('상태창 초기화 중 오류:', error);
        }
    }

    updateHealth() {
        this.updateCharacterHealth('player');
        this.updateCharacterHealth('enemy');
    }

    updateCharacterHealth(type, character) {
        if (!character || character.hp === undefined || character.maxHp === undefined) {
            console.error(`updateCharacterHealth: 유효하지 않은 캐릭터 데이터 - ${type}`, character);
            return;
        }
        
        try {
            // 체력 비율 계산 (NaN 방지)
            const healthPercent = character.maxHp > 0 ? (character.hp / character.maxHp) * 100 : 0;
            
            // 체력 표시 업데이트
            if (this.elements[`${type}HealthBar`]) {
                this.elements[`${type}HealthBar`].style.width = `${healthPercent}%`;
            }
            
            if (this.elements[`${type}HealthText`]) {
                this.elements[`${type}HealthText`].textContent = 
                    `${Math.max(0, Math.floor(character.hp))}/${Math.floor(character.maxHp)}`;
            }
        } catch (error) {
            console.error(`체력 업데이트 중 오류 발생 (${type}):`, error);
        }
    }

    updateHealthBar(elements, character) {
        const healthPercent = (character.hp / character.maxHp) * 100;
        if (elements.hp) {
            elements.hp.textContent = `${character.hp}/${character.maxHp}`;
        }
        
        if (elements.hpBar) {
            elements.hpBar.style.width = `${healthPercent}%`;
        }
    }

    updateStats() {
        // 플레이어와 적 스탯 업데이트는 이벤트로 처리됨
        // updatePlayerBuffs도 이벤트로 처리하도록 수정
    }

    updateCharacterStats(type, character) {
        if (!character) return;

        const toPercent = (value) => `${Math.round(((value ?? 0) * 1000)) / 10}%`;
        const toRatio = (value) => (value ?? 0).toFixed(2);
        const toInt = (value) => Math.floor(value ?? 0);

        const elements = type === 'player' ? {
            attack: this.elements.playerAttack,
            defense: this.elements.playerDefense,
            armor: this.elements.playerArmor,
            critRate: this.elements.playerCritRate,
            critDamage: this.elements.playerCritDamage,
            lifeSteal: this.elements.playerLifeSteal,
            thorns: this.elements.playerThorns,
            freeze: this.elements.playerFreeze,
            luck: this.elements.playerLuck,
            healCap: this.elements.playerHealCap,
            level: this.elements.playerLevel,
            exp: this.elements.playerExp,
            expBar: this.elements.playerExpBar
        } : {
            attack: this.elements.enemyAttack,
            defense: this.elements.enemyDefense,
            armor: this.elements.enemyArmor,
            critRate: this.elements.enemyCritRate,
            critDamage: this.elements.enemyCritDamage,
            lifeSteal: this.elements.enemyLifeSteal,
            thorns: this.elements.enemyThorns,
            freeze: this.elements.enemyFreeze,
            luck: this.elements.enemyLuck
        };

        if (elements.attack) elements.attack.textContent = toInt(character.attack);
        if (elements.defense) elements.defense.textContent = toInt(character.defense);
        if (elements.armor) elements.armor.textContent = toInt(character.armor);
        if (elements.critRate) elements.critRate.textContent = toPercent(character.critRate);
        if (elements.critDamage) elements.critDamage.textContent = toRatio(character.critDamage);
        if (elements.lifeSteal) elements.lifeSteal.textContent = toPercent(character.lifeStealRate);
        if (elements.thorns) elements.thorns.textContent = toPercent(character.thornsCoeff);
        if (elements.freeze) elements.freeze.textContent = toPercent(character.freezeRate);
        if (elements.luck) elements.luck.textContent = toPercent(character.luck);

        if (type === 'player') {
            if (elements.healCap) elements.healCap.textContent = toPercent(character.turnHealingCapRatio);
            if (elements.level) elements.level.textContent = character.level;
            if (elements.exp && elements.expBar && character.maxExp) {
                elements.exp.textContent = `${character.exp}/${character.maxExp}`;
                const expPercent = Math.max(0, Math.min(100, (character.exp / character.maxExp) * 100));
                elements.expBar.style.width = `${expPercent}%`;
            }
        }
    }

    updatePlayerBuffs(player) {
        const buffsContainer = document.getElementById('playerBuffs');
        if (!buffsContainer) return;
        
        buffsContainer.innerHTML = '';
        
        const buffs = this.getActiveBuffs(player);
        if (!buffs?.length) return;
        
        buffs.forEach(buff => {
            const buffElement = document.createElement('div');
            buffElement.className = `stat-item ${buff.type}`;
            buffElement.innerHTML = `
                <span class="stat-icon">${buff.icon}</span>
                <span class="stat-value">${buff.value}</span>
            `;
            if (buff.tooltip) {
                buffElement.title = buff.tooltip;
            }
            buffsContainer.appendChild(buffElement);
        });
    }

    getActiveBuffs(player) {
        if (!player) return [];

        const buffs = [];

        // 아머
        if (player.armor > 0) {
            buffs.push({
                type: 'armor',
                icon: '🪖',
                value: player.armor,
                tooltip: `현재 아머: ${player.armor}`
            });
        }

        // 방어 스택
        if (player.defenseStack > 1) {
            buffs.push({
                type: 'defense-stack',
                icon: '🔰',
                value: `x${player.defenseStack}`,
                tooltip: `방어 중첩: ${player.defenseStack}회`
            });
        }

        return buffs;
    }

    updateEnemyStatus(enemy) {
        if (!enemy) {
            console.log('No enemy data provided');
            return;
        }
        
        // 적 이름 업데이트
        const enemyNameElement = document.getElementById('enemyName');
        if (enemyNameElement) {
            enemyNameElement.textContent = enemy.name;
        }

        // 적 HP 업데이트
        const hpText = document.getElementById('enemyHpText');
        if (hpText) {
            const hpString = `${enemy.hp}/${enemy.maxHp}`;
            hpText.textContent = hpString;
            
            // HP 바 업데이트
            const hpBar = document.getElementById('enemyHpBar');
            if (hpBar) {
                const hpPercent = (enemy.hp / enemy.maxHp) * 100;
                hpBar.style.width = `${hpPercent}%`;
            } else {
                console.log('HP bar element not found!');
            }
        } else {
            console.log('HP text element not found!');
        }

        // 적 스탯 업데이트
        const attackElement = document.getElementById('enemyAttack');
        const defenseElement = document.getElementById('enemyDefense');
        
        if (attackElement) attackElement.textContent = Math.floor(enemy.attack);
        if (defenseElement) defenseElement.textContent = Math.floor(enemy.defense);
    }

    async addLogMessage(message, type = 'narrative', delay = 0) {
        try {
            console.log('[디버그] 로그 메시지 추가:', message.substring(0, 30) + '...', { type, delay });
            
            // 로그 컨테이너 확인
            if (!this.elements.logContainer) {
                console.error('[오류] 로그 컨테이너가 없습니다!');
                this.ensureLogContainerExists();
                
                if (!this.elements.logContainer) {
                    console.error('[심각] 로그 컨테이너를 생성할 수 없습니다!');
                    return Promise.resolve(false);
                }
            }
            
            // 지연이 있는 경우 대기
            if (delay > 0) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this._createAndAppendLogEntry(message, type);
                        resolve(true);
                    }, delay);
                });
            } else {
                // 지연이 없는 경우 바로 처리
                this._createAndAppendLogEntry(message, type);
                return Promise.resolve(true);
            }
        } catch (error) {
            console.error('[오류] 로그 메시지 추가 중 오류:', error);
            return Promise.resolve(false);
        }
    }

    // 로그 항목을 생성하고 추가하는 내부 메서드
    _createAndAppendLogEntry(message, type) {
        // 메시지 요소 생성
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logEntry.className = `log-entry ${type}`;
        
        // 특별한 메시지 타입에 따른 추가 스타일
        if (type === 'battle-critical') {
            logEntry.classList.add('critical');
        } else if (type === 'battle-victory') {
            logEntry.classList.add('victory');
        }
        
        // 로그 컨테이너에 추가
        this.elements.logContainer.appendChild(logEntry);
        
        // 스크롤 맨 아래로
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }

    showRewards(rewards) {
        // 기존 overlay와 reward-container 사용
        this.elements.overlay.style.display = 'block';
        this.elements.rewardContainer.style.display = 'block';
        this.elements.rewardContainer.innerHTML = ''; // 기존 내용 초기화
        
        // 보상 버튼들을 기존 컨테이너에 추가
        rewards.forEach(reward => {
            const rewardButton = document.createElement('button');
            rewardButton.className = 'reward-button';
            rewardButton.innerHTML = `
                <div class="reward-title">${reward.name}</div>
                <div class="reward-description">${reward.description}</div>
            `;
            
            rewardButton.onclick = () => {
                const message = reward.effect();

                // status창에 메시지 추가
                this.#eventEmitter.emit('status:update', {
                    messages: [message]
                });
                
                // 기존 hideRewards 메서드 사용
                this.hideRewards();
                
                // 다음 전투 준비
                this.#eventEmitter.emit('game:prepare-next-battle');
            };
            
            this.elements.rewardContainer.appendChild(rewardButton);
        });
    }

    hideRewards() {
        this.elements.overlay.style.display = 'none';
        this.elements.rewardContainer.style.display = 'none';
    }

    setActionButtonEnabled(enabled) {
        try {
            if (!this.elements.actionButton) {
                console.error('액션 버튼 요소가 없습니다!');
                return false;
            }
            
            console.log(`[디버그] 액션 버튼 ${enabled ? '활성화' : '비활성화'} 시도`);
            this.elements.actionButton.disabled = !enabled;
            
            // 시각적 피드백 강화
            this.elements.actionButton.style.opacity = enabled ? '1' : '0.5';
            this.elements.actionButton.style.cursor = enabled ? 'pointer' : 'not-allowed';
            
            // 성공 로그
            console.log(`[디버그] 액션 버튼이 ${enabled ? '활성화' : '비활성화'} 되었습니다.`);
            
            return true;
        } catch (error) {
            console.error('액션 버튼 상태 변경 중 오류:', error);
            return false;
        }
    }

    updateAll() {
        // 각 업데이트 메서드는 이벤트 리스너에서 처리되도록 변경
        this.#eventEmitter.emit('ui:update-request', {
            type: 'all'
        });
    }

    updateEnemyVisibility(gamePhase) {
        const { enemyContainer } = this.elements;

        // 전투 시작 시 적 표시
        if (gamePhase === 'battle') {
            enemyContainer.style.display = 'block';  // 명시적으로 'block' 설정
            enemyContainer.removeAttribute('style');  // 인라인 스타일 제거
            enemyContainer.classList.add('fade-in');
        } else {
            enemyContainer.style.display = 'none';
            enemyContainer.classList.remove('fade-in');
        }
    }

    clearLog() {
        this.elements.logContainer.innerHTML = '';
    }

    setActionButtonText(text, actions = null) {
        if (actions) {
            // 확률 계산 및 표시
            const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);
            const probabilities = actions.map(action => {
                const probability = Math.round((action.weight / totalWeight) * 100);
                const actionName = this.getActionName(action.type);
                return `${actionName} ${probability}%`;
            });
            
            // text 파라미터 무시하고 확률만 표시
            this.elements.actionButton.innerHTML = `
                <span class="action-probabilities">${probabilities.join(' • ')}</span>
            `;
        } else {
            this.elements.actionButton.textContent = text;
        }
    }

    getActionName(type) {
        const actionNames = {
            'attack': '일반 공격',
            'critical': '치명타',
            'defend': '방어',
            'skill': '스킬',
            'mistake': '실수'
        };
        return actionNames[type] || type;
    }

    updateStageInfo(gameState) {
        if (!gameState) return;
        
        const { stage, gamePhase, isBossBattle } = gameState;
        
        // 스테이지 제목 업데이트
        if (this.elements.stageInfo) {
            if (isBossBattle) {
                this.elements.stageInfo.textContent = `🔥 보스 스테이지 [${stage}층] 🔥`;
            } else {
                const exploreText = gamePhase === 'explore' ? ' - 탐험중...' : '';
                this.elements.stageInfo.textContent = `${stage}층${exploreText}`;
            }
        }

        // 진행도 업데이트
        if (this.elements.stageProgressBar && this.elements.stageProgress) {
            const progress = stage % STAGE_SETTINGS.STAGES_PER_BOSS || STAGE_SETTINGS.STAGES_PER_BOSS;
            const progressPercent = (progress / STAGE_SETTINGS.STAGES_PER_BOSS) * 100;
            
            this.elements.stageProgressBar.style.width = `${progressPercent}%`;
            this.elements.stageProgress.textContent = 
                `다음 보스까지: ${progress}/${STAGE_SETTINGS.STAGES_PER_BOSS}`;
        }
    }

    showCriticalEffect() {
        const flash = document.createElement('div');
        flash.className = 'battle-effect critical-effect';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }

    showStunEffect() {
        const flash = document.createElement('div');
        flash.className = 'battle-effect stun-effect';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }

    showSkillEffect() {
        const flash = document.createElement('div');
        flash.className = 'battle-effect skill-effect';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }

    showHealEffect() {
        const flash = document.createElement('div');
        flash.className = 'battle-effect heal-effect';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }

    showLuckyEffect() {
        const flash = document.createElement('div');
        flash.className = 'battle-effect lucky-effect';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1000);
    }

    updateExpBar(level, exp, maxExp) {
        const levelText = document.getElementById('levelText');
        const expBar = document.getElementById('expBar');
        
        if (levelText && expBar) {
            levelText.textContent = `Lv.${level}`;
            expBar.style.width = `${(exp / maxExp) * 100}%`;
        }
    }

    showStatIncreaseEffect(statType) {
        // 스탯 증가 이펙트 생성
        const flash = document.createElement('div');
        flash.className = `battle-effect stat-increase-effect ${statType}`;
        
        // 이펙트 아이콘 추가
        const icon = document.createElement('span');
        icon.className = 'stat-icon';
        switch(statType) {
            case 'attack':
                icon.textContent = '⚔️';
                break;
            case 'defense':
                icon.textContent = '🛡️';
                break;
            case 'hp':
                icon.textContent = '❤️';
                break;
            case 'luck':
                icon.textContent = '🍀';
                break;
        }
        flash.appendChild(icon);

        // 증가 표시 추가
        const increase = document.createElement('span');
        increase.className = 'stat-increase';
        increase.textContent = '↑';
        flash.appendChild(increase);

        document.body.appendChild(flash);
        
        // 애니메이션 효과
        flash.style.animation = 'statIncrease 1.5s ease-out forwards';
        setTimeout(() => flash.remove(), 1500);
    }

    showLevelUpEffect() {
        const effect = document.createElement('div');
        effect.className = 'level-up-effect';
        effect.textContent = MESSAGES.STATUS.LEVEL_UP;
        document.body.appendChild(effect);
        
        // 파티클 효과 추가
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'level-up-particle';
            effect.appendChild(particle);
        }

        // 경험치 바에 레벨업 효과 추가
        const expBar = document.getElementById('expBar');
        if (expBar) {
            expBar.classList.add('level-up');
            setTimeout(() => {
                expBar.classList.remove('level-up');
            }, 2000);
        }

        setTimeout(() => effect.remove(), 2000);
    }

    showBossEncounterEffect() {
        const effect = document.createElement('div');
        effect.className = 'boss-encounter-effect';
        effect.textContent = '💀 보스 출현 ';
        document.body.appendChild(effect);
        
        // 화면 전체에 붉은 빛 효과
        document.body.classList.add('boss-encounter');
        
        setTimeout(() => {
            effect.remove();
            document.body.classList.remove('boss-encounter');
        }, 2000);
    }

    addLogButton(text, onClick, action = '') {
        // 버튼 추가 시 메인 액션 버튼 비활성화
        this.setActionButtonEnabled(false);
        
        // 버튼 컨테이너 생성
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'log-button-container';
        
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'log-button';
        if (action) {
            button.setAttribute('data-action', action);
        }
        button.onclick = () => {
            onClick();
            buttonContainer.remove();  // 컨테이너째로 제거
        };

        buttonContainer.appendChild(button);
        this.elements.logContainer.appendChild(buttonContainer);
        
        // 버튼이 완전히 보이도록 스크롤 처리 개선
        setTimeout(() => {
            const logContainer = this.elements.logContainer;
            const scrollHeight = logContainer.scrollHeight;
            const clientHeight = logContainer.clientHeight;
            
            // 컨테이너의 맨 아래로 스크롤
            logContainer.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }, 100); // 약간의 지연을 주어 버튼이 완전히 렌더링된 후 스크롤되도록 함
    }

    showGameOver() {
        // 즉시 액션 버튼 비활성화
        this.setActionButtonEnabled(false);

        const messages = [  
            "전장에서 강인했던 모험가는 결국 허무하게 생을 마감했다.", 
            "그의 마지막 숨결은 싸움의 소용돌이 속에 사라졌고,", 
            "남겨진 동료들은 깊은 슬픔에 잠겼다.", 
            "마을 사람들은 새로운 용사를 기다리며 절박하게 신께 기도드렸다.", 
            "비록 어둠이 여전히 세상을 덮고 있었지만,", 
            "그들의 간절한 소망은 새로운 희망의 불씨로 남아",
            "다음 영웅의 탄생을 믿게 했다." 
        ];

        // 기존 메시지들 페이드 아웃
        const existingMessages = this.elements.logContainer.children;
        Array.from(existingMessages).forEach(msg => {
            msg.style.transition = `opacity 1000ms`;
            msg.style.opacity = '0.3';  // 완전히 안보이게 하지 않고 흐리게
        });

        // 메시지를 순차적으로 표시
        messages.forEach((message, index) => {
            setTimeout(() => {
                this.addLogMessage(message, MESSAGE_TYPES.NARRATIVE);
                // 로그창을 맨 아래로 스크롤
                this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
            }, index * 2000);  // 각 메시지는 2초 간격으로 표시
        });

        // 모든 메시지가 표시된 후 재시작 버튼 표시
        setTimeout(() => {
            this.setActionButtonText('게임 재시작');
            this.elements.actionButton.classList.add('restart');
            this.setActionButtonEnabled(true);
            
            this.elements.actionButton.onclick = () => {
                window.location.reload();
            };
        }, messages.length * 2000);
    }

    async processMessageQueue() {
        if (this.#isProcessingQueue) return;
        
        this.#isProcessingQueue = true;
        
        try {
            while (this.#messageQueue.length > 0) {
                const { message, type, delay, resolve } = this.#messageQueue[0];
                
                try {
                    await this.displayMessage(message, type);
                    await AsyncUtils.delay(delay);
                    resolve();
                } catch (error) {
                    console.error('메시지 표시 중 오류:', error);
                    // 오류가 있어도 큐 진행
                    resolve();
                }
                
                this.#messageQueue.shift();
            }
        } finally {
            this.#isProcessingQueue = false;
        }
    }
    
    async displayMessage(message, type) {
        try {
            console.log(`메시지 표시 시도: "${message}", 타입: ${type}`);
            
            // logContainer가 존재하는지 확인
            if (!this.elements.logContainer) {
                console.error('로그 컨테이너가 없습니다. 메시지를 표시할 수 없습니다.');
                this.ensureLogContainerExists();
                if (!this.elements.logContainer) {
                    return false;
                }
            }
            
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            
            // 메시지 타입에 따른 처리
            if (type === MESSAGE_TYPES.BUTTON) {
                await this.createButtonMessage(logEntry, message);
            } else {
                logEntry.textContent = typeof message === 'string' ? message : JSON.stringify(message);
            }
            
            // 로그 컨테이너에 추가
            this.elements.logContainer.appendChild(logEntry);
            console.log(`메시지가 로그에 추가됨: "${message}"`);
            
            // 스크롤 조정
            this.scrollToBottom();
            
            return true;
        } catch (error) {
            console.error('메시지 표시 오류:', error, '메시지:', message, '타입:', type);
            // 비상용 메시지 표시 시도
            this.displayEmergencyMessage(message, type);
            return false;
        }
    }
    
    async createButtonMessage(logEntry, message) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'log-button-container';
        
        if (Array.isArray(message.buttons)) {
            // 여러 버튼 처리
            message.buttons.forEach(btn => {
                this.createSingleButton(buttonContainer, btn.text, btn.onClick);
            });
        } else {
            // 단일 버튼 처리
            this.createSingleButton(buttonContainer, message.text, message.onClick);
        }
        
        logEntry.appendChild(buttonContainer);
    }
    
    createSingleButton(container, text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'log-button';
        button.onclick = () => {
            onClick();
            container.remove();
        };
        container.appendChild(button);
    }
    
    scrollToBottom() {
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }

    setupEventListeners(self) {
        console.log('UIManager: 이벤트 리스너 설정 시작');
        
        // 이벤트 핸들러 중복 등록 방지 로직 추가
        // 이벤트 목록과 해당 핸들러 함수 매핑
        const eventHandlers = [
            { event: 'narrative:update', handler: this.handleNarrativeUpdate },
            { event: 'game:message', handler: this.handleGameMessage },
            { event: 'battle:start', handler: this.handleBattleStart },
            { event: 'state:update', handler: this.handleStateUpdate },
            { event: 'state:player-update', handler: this.handlePlayerUpdate },
            { event: 'state:enemy-update', handler: this.handleEnemyUpdate },
            { event: 'status:update', handler: this.handleStatusUpdate },
            { event: 'ui:log-message', handler: this.handleLogMessage }
        ];

        // 핸들러 등록 전 기존 이벤트 핸들러 체크
        for (const { event, handler } of eventHandlers) {
            // 이미 등록된 핸들러가 있는지 확인
            const existingHandlers = this.#eventEmitter.events[event] || [];
            
            if (existingHandlers.length > 0) {
                console.warn(`${event} 이벤트에 이미 핸들러가 있습니다: ${existingHandlers.length}개`);
                
                // 중복 등록 방지 - 기존 핸들러 제거
                this.#eventEmitter.removeAllListenersForComponent(self, event);
                console.log(`${event} 이벤트의 기존 핸들러 제거 완료`);
            }
            
            // 이벤트 리스너 등록 (컴포넌트 참조 포함)
            this.#eventEmitter.on(event, handler.bind(this), self);
            console.log(`${event} 이벤트 리스너 등록 완료`);
        }
        
        console.log('UIManager: 이벤트 리스너 설정 완료');
    }
    
    // 각 이벤트 핸들러를 메서드로 분리
    handlePlayerUpdate(player) {
        this.updateCharacterHealth('player', player);
        this.updateCharacterStats('player', player);
        this.updatePlayerBuffs(player);
    }
    
    handleEnemyUpdate(enemy) {
        this.updateCharacterHealth('enemy', enemy);
        this.updateCharacterStats('enemy', enemy);
        this.updateEnemyStatus(enemy);
    }
    
    // status:update 핸들러 개선 - 상태창에만 표시하도록 수정
    handleStatusUpdate(data) {
        console.log('handleStatusUpdate 호출됨: data =', data);
        console.log('handleStatusUpdate 시점의 statusNarrative =', this.elements.statusNarrative);
        
        try {
            console.log('상태 업데이트 처리:', data);
            
            // 상태창에만 표시
            if (data.messages && Array.isArray(data.messages)) {
                // 상태창 메시지 업데이트
                const statusText = data.messages.join('\n\n');
                this.updateNarrativeStatus(statusText, data.append || false);
            }
        } catch (error) {
            console.error('상태 업데이트 처리 중 오류:', error);
        }
    }
    
    // UI 업데이트 요청 핸들러
    handleUpdateRequest(data) {
        try {
            console.log('UI 업데이트 요청 처리:', data);
            
            if (data.type === 'all') {
                // 플레이어와 적 정보 업데이트 요청
                this.#eventEmitter.emit(EVENT_TYPES.STATE.REQUEST_UPDATE);
            } else if (data.type === 'player' || data.type === 'enemy') {
                // 직접 state에 접근하는 대신 이벤트를 발생시킴
                this.#eventEmitter.emit(EVENT_TYPES.STATE.REQUEST_UPDATE, {
                    type: data.type
                });
            }
        } catch (error) {
            console.error('UI 업데이트 요청 처리 중 오류:', error);
        }
    }
    
    // 게임 메시지 핸들러
    async handleGameMessage(data) {
        try {
            console.log('게임 메시지 처리:', data);
            
            // data에서 필요한 정보 추출
            const { type, message, delay } = data;
            
            // 메시지 표시
            await this.displayMessage(message, type);
            
            // 지연 처리 (있는 경우)
            if (delay && delay > 0) {
                await AsyncUtils.delay(delay);
            }
        } catch (error) {
            console.error('게임 메시지 처리 중 오류:', error);
        }
    }
    
    // state:update 이벤트 핸들러 추가
    handleStateUpdate(data) {
        try {
            console.log('게임 상태 업데이트 처리:', data);
            
            // 플레이어 정보 업데이트
            if (data.player) {
                this.handlePlayerUpdate(data.player);
            }
            
            // 적 정보 업데이트
            if (data.enemy) {
                this.handleEnemyUpdate(data.enemy);
            }
            
            // 게임 단계 업데이트
            if (data.gamePhase !== undefined) {
                this.updateEnemyVisibility(data.gamePhase);
            }
            
            // 스테이지 정보 업데이트
            if (data.stage !== undefined) {
                if (this.elements.stageInfo) {
                    this.elements.stageInfo.textContent = `스테이지: ${data.stage}`;
                }
            }
            
            // 보스 정보 표시
            if (data.isBossBattle !== undefined && data.enemy) {
                if (data.isBossBattle) {
                    console.log('보스 전투 UI 업데이트');
                    // 보스 UI 강조 효과 등 추가
                    if (this.elements.enemyContainer) {
                        this.elements.enemyContainer.classList.add('boss-battle');
                    }
                } else {
                    if (this.elements.enemyContainer) {
                        this.elements.enemyContainer.classList.remove('boss-battle');
                    }
                }
            }
        } catch (error) {
            console.error('상태 업데이트 처리 중 오류:', error);
        }
    }
    
    // 컴포넌트 정리 메서드 추가
    cleanup() {
        // 이 컴포넌트에 연결된 모든 이벤트 리스너 제거
        this.#eventEmitter.removeAllListeners(this);
    }

    ensureActionButtonExists() {
        if (!this.elements.actionButton) {
            console.warn('액션 버튼 요소가 초기화되지 않았습니다. 다시 찾는 중...');
            const actionButton = document.getElementById('action-button');
            if (actionButton) {
                this.elements.actionButton = actionButton;
                console.log('액션 버튼 요소를 찾았습니다.');
            } else {
                console.error('액션 버튼 요소를 찾을 수 없습니다. DOM에 해당 요소가 없습니다.');
            }
        }
        return !!this.elements.actionButton;
    }

    // 비상용 메시지 표시 메서드 추가
    displayEmergencyMessage(message, type) {
        try {
            console.log('비상용 메시지 표시 시도');
            // 최소한의 기능으로 메시지 표시 시도
            const logContainerElement = document.getElementById('log-container');
            if (logContainerElement) {
                const messageElement = document.createElement('div');
                messageElement.textContent = typeof message === 'string' ? message : JSON.stringify(message);
                messageElement.style.color = type === MESSAGE_TYPES.ERROR ? 'red' : 'white';
                logContainerElement.appendChild(messageElement);
                console.log('비상용 메시지 표시 성공');
            } else {
                console.error('로그 컨테이너를 찾을 수 없어 비상용 메시지도 표시할 수 없습니다.');
            }
        } catch (error) {
            console.error('비상용 메시지 표시 중 오류:', error);
        }
    }

    // logContainer가 존재하는지 확인하고 없으면 생성 시도
    ensureLogContainerExists() {
        if (!this.elements.logContainer) {
            console.warn('로그 컨테이너가 초기화되지 않았습니다. 다시 찾는 중...');
            const logContainer = document.getElementById('log-container');
            if (logContainer) {
                this.elements.logContainer = logContainer;
                console.log('로그 컨테이너를 찾았습니다.');
            } else {
                console.error('로그 컨테이너를 찾을 수 없습니다. DOM에 해당 요소가 없습니다.');
                
                // 로그 컨테이너가 없으면 생성 시도
                try {
                    const gameContainer = document.querySelector('.game-container') || document.body;
                    const newLogContainer = document.createElement('div');
                    newLogContainer.id = 'log-container';
                    newLogContainer.className = 'log-container';
                    newLogContainer.style.height = '200px';
                    newLogContainer.style.overflowY = 'auto';
                    newLogContainer.style.border = '1px solid #333';
                    newLogContainer.style.padding = '10px';
                    newLogContainer.style.margin = '10px 0';
                    
                    gameContainer.appendChild(newLogContainer);
                    this.elements.logContainer = newLogContainer;
                    console.log('새 로그 컨테이너를 생성했습니다.');
                } catch (error) {
                    console.error('로그 컨테이너 생성 실패:', error);
                }
            }
        }
        return !!this.elements.logContainer;
    }

    // 타이핑 효과를 구현하는 메서드 완전 재작성 (더 견고한 버전)
    typewriterEffect(element, text, speed = 30, onComplete = null) {
        // 완전히 새로운 변수와 디버깅 정보
        const startTime = new Date().getTime();
        console.log(`타이핑 효과 시작 [${startTime}]: 글자 수: ${text.length}`);
        
        // 타이핑 중 플래그 설정
        this.isTypingInProgress = true;
        
        // 기존 타이핑 중단
        if (this.typewriterTimer) {
            clearTimeout(this.typewriterTimer);
            console.log('이전 타이핑 효과를 중단했습니다.');
        }
        
        // 타이핑 완료 안됨 상태 표시용 안전 장치
        this.typingTimeoutId = setTimeout(() => {
            if (this.isTypingInProgress) {
                console.warn('타이핑이 8초 이상 진행 중입니다. 강제 완료합니다.');
                element.textContent = text;
                this.isTypingInProgress = false;
                if (onComplete && typeof onComplete === 'function') {
                    onComplete();
                }
            }
        }, 8000); // 8초 타임아웃
        
        let i = 0;
        // 요소 상태 확인
        if (!element) {
            console.error('타이핑 효과 대상 요소가 없습니다!');
            this.isTypingInProgress = false;
            return;
        }
        
        // 요소 내용 초기화
        element.textContent = '';
        
        // 타이핑 진행 상태 로깅용 타이머
        const progressTimer = setInterval(() => {
            if (this.isTypingInProgress) {
                const percentage = Math.round((i / text.length) * 100);
                console.log(`타이핑 진행: ${percentage}% (${i}/${text.length})`);
            } else {
                clearInterval(progressTimer);
            }
        }, 1000);
        
        // 한 글자씩 추가하는 함수
        const typeNextCharacter = () => {
            if (i < text.length) {
                // 요소가 DOM에 여전히 있는지 확인
                if (!document.body.contains(element)) {
                    console.error('타이핑 대상 요소가 DOM에서 제거되었습니다!');
                    this.isTypingInProgress = false;
                    clearInterval(progressTimer);
                    clearTimeout(this.typingTimeoutId);
                    return;
                }
                
                // 텍스트 추가 및 카운터 증가
                element.textContent += text.charAt(i);
                i++;
                
                // 요소가 스크롤 가능하면 자동 스크롤 처리
                if (element.scrollHeight > element.clientHeight) {
                    element.scrollTop = element.scrollHeight;
                }
                
                // 각 5번째 글자마다 현재 내용 확인
                if (i % 5 === 0) {
                    console.log(`현재 타이핑 내용(${i}글자): ${element.textContent.substring(0, 20)}...`);
                }
                
                // 다음 글자 처리 예약
                this.typewriterTimer = setTimeout(typeNextCharacter, speed);
            } else {
                // 타이핑 완료
                const endTime = new Date().getTime();
                const duration = endTime - startTime;
                console.log(`타이핑 효과 완료 [${endTime}]: 소요 시간: ${duration}ms`);
                
                // 최종 텍스트 확인
                console.log(`최종 타이핑 내용: ${element.textContent.substring(0, 30)}...`);
                
                // 타이밍 관련 타이머 정리
                clearInterval(progressTimer);
                clearTimeout(this.typingTimeoutId);
                
                // 타이핑 완료 플래그 설정
                this.isTypingInProgress = false;
                
                // 타이핑 완료 후 콜백 실행
                if (onComplete && typeof onComplete === 'function') {
                    console.log('타이핑 완료 콜백 실행');
                    onComplete();
                }
            }
        };
        
        // 타이핑 시작 (약간의 지연 추가)
        setTimeout(() => {
            console.log('첫 글자 타이핑 시작...');
            typeNextCharacter();
        }, 50);
    }

    // updateNarrativeStatus 메서드 수정
    async updateNarrativeStatus(message, append = false, context = null) {
        try {
            console.log(`[디버그] updateNarrativeStatus 호출: ${message.substring(0, 30)}... (append: ${append})`);
            
            if (!this.elements.statusNarrative) {
                console.error('[오류] 상태창 요소가 없습니다!');
                return;
            }
            
            // 메시지 배열이 없으면 초기화
            if (!this.narrativeMessages) {
                this.narrativeMessages = [];
            }
            
            // 전투 메시지가 아니고 append가 false인 경우 메시지 배열 초기화
            const isBattleContext = context && context.includes('battle');
            if (!isBattleContext && !append) {
                this.narrativeMessages = [];
            }
            
            // 메시지 추가 또는 교체
            if (append || isBattleContext) {
                // 중복 방지
                if (!this.narrativeMessages.includes(message)) {
                    this.narrativeMessages.push(message);
                }
            } else {
                // 교체 모드
                this.narrativeMessages = [message];
            }
            
            // 메시지 배열이 너무 길어지면 이전 메시지 제거
            const maxMessages = 10; // 최대 메시지 수 제한
            if (this.narrativeMessages.length > maxMessages) {
                this.narrativeMessages = this.narrativeMessages.slice(-maxMessages);
            }
            
            // 기존 메시지와 새 메시지를 분리
            const existingMessages = this.narrativeMessages.slice(0, -1).join('\n\n');
            const newMessage = this.narrativeMessages[this.narrativeMessages.length - 1];
            
            // 기존 메시지는 그대로 유지하고 새 메시지만 타이핑 효과 적용
            this.elements.statusNarrative.innerHTML = existingMessages ? existingMessages + '\n\n' : '';
            
            // 새 메시지에만 타이핑 효과 적용
            await this.typewriterEffect(
                this.elements.statusNarrative,
                newMessage,
                15,
                () => {
                    this.elements.statusNarrative.scrollTop = this.elements.statusNarrative.scrollHeight;
                }
            );
            
        } catch (error) {
            console.error('[오류] 내러티브 상태 업데이트 중 오류:', error);
        }
    }

    // 상태창 컨테이너 생성 메서드 추가
    createStatusContainer() {
        try {
            console.log('상태창 컨테이너를 강제로 새로 생성합니다');
            // 캐릭터 상태창 컨테이너 생성
            const statsContainer = document.createElement('div');
            statsContainer.className = 'character-stats terminal forced-created';
            statsContainer.style.backgroundColor = '#003300';
            statsContainer.style.color = '#33ff33';
            statsContainer.style.padding = '10px';
            statsContainer.style.borderRadius = '5px';
            statsContainer.style.height = '150px';
            statsContainer.style.overflowY = 'auto';
            statsContainer.style.fontFamily = 'monospace';
            statsContainer.style.width = '100%';
            statsContainer.style.marginTop = '10px';
            statsContainer.style.boxSizing = 'border-box';
            statsContainer.style.border = '1px solid #00ff00';
            
            // 게임 컨테이너 또는 body에 추가
            const gameContainer = document.querySelector('.game-container') || 
                                document.getElementById('playerStats') || 
                                document.body;
            gameContainer.appendChild(statsContainer);
            
            // 상태창 요소 참조 저장
            this.elements.statusNarrative = statsContainer;
            console.log('강제 생성된 상태창 참조:', this.elements.statusNarrative);
            
            return statsContainer;
        } catch (error) {
            console.error('상태창 강제 생성 중 오류:', error);
            return null;
        }
    }

    // 내러티브 업데이트 핸들러 수정
    handleNarrativeUpdate(data) {
        try {
            console.log('[디버그] handleNarrativeUpdate 호출:', JSON.stringify({
                message: data?.message?.substring(0, 30) + '...',
                context: data?.context, 
                append: data?.append
            }));
            
            if (data && data.message) {
                // 전투 관련 메시지인지 확인
                const isBattleMessage = data.context && 
                    (data.context.includes('battle') || data.context.includes('attack'));
                
                // 메시지 처리 방식 결정
                if (isBattleMessage) {
                    // 전투 메시지는 누적
                    this.addToNarrativeQueue(data.message, true, data.context);
                } else {
                    // 전투가 아닌 메시지는 교체 (append가 true로 명시되지 않은 경우)
                    this.addToNarrativeQueue(data.message, data.append === true, data.context);
                }
                
                // 큐 처리가 진행 중이 아니면 시작
                if (!this.isProcessingNarrativeQueue) {
                    console.log('[디버그] 내러티브 큐 처리 시작');
                    this.processNarrativeQueue();
                }
                
                // 전투 메시지는 로그에도 추가
                if (isBattleMessage) {
                    console.log('[디버그] 전투 메시지를 로그에도 추가');
                    this.addLogMessage(data.message, 'battle');
                }
            }
        } catch (error) {
            console.error('[오류] 내러티브 업데이트 처리 중 오류:', error);
        }
    }

    // addToNarrativeQueue 메서드 개선
    addToNarrativeQueue(message, append = false, context = null) {
        try {
            // 큐에 아이템 추가
            this.narrativeMessageQueue.push({ message, append, context });
            console.log(`[디버그] 내러티브 큐에 메시지 추가됨 (현재 ${this.narrativeMessageQueue.length}개)`);
            
            // 큐가 처리 중이 아니면 처리 시작
            if (!this.isProcessingNarrativeQueue) {
                console.log('[디버그] 큐 처리를 바로 시작합니다');
                // 즉시 처리 시작
                setTimeout(() => this.processNarrativeQueue(), 0);
            } else {
                console.log('[디버그] 큐 처리가 이미 진행 중입니다');
            }
        } catch (error) {
            console.error('[오류] 내러티브 큐에 메시지 추가 중 오류:', error);
        }
    }

    // 내러티브 메시지 큐 처리 메서드
    async processNarrativeQueue() {
        if (this.isProcessingNarrativeQueue || this.narrativeMessageQueue.length === 0) {
            return;
        }
        
        try {
            this.isProcessingNarrativeQueue = true;
            console.log('내러티브 메시지 큐 처리 시작 (남은 메시지: ' + this.narrativeMessageQueue.length + '개)');
            
            // 큐에서 다음 메시지 가져오기
            const nextItem = this.narrativeMessageQueue.shift();
            
            // 타이핑 효과가 진행 중이면 완료될 때까지 대기
            if (this.isTypingInProgress) {
                console.log('타이핑 진행 중, 완료 대기...');
                await this.waitForTypingToComplete();
            }
            
            // 내러티브 업데이트 처리
            console.log('큐에서 다음 메시지 처리:', nextItem.message.substring(0, 30) + '...');
            await this.updateNarrativeStatus(nextItem.message, nextItem.append, nextItem.context);
            
            // 업데이트 후 플래그 초기화
            this.isProcessingNarrativeQueue = false;
            
            // 큐에 더 메시지가 있으면 계속 처리
            if (this.narrativeMessageQueue.length > 0) {
                // 약간의 지연 후 다음 메시지 처리 (타이핑 효과를 위한 여유)
                setTimeout(() => this.processNarrativeQueue(), 100);
            }
        } catch (error) {
            console.error('내러티브 메시지 큐 처리 중 오류:', error);
            this.isProcessingNarrativeQueue = false;
            
            // 오류가 발생해도 계속 처리 시도
            if (this.narrativeMessageQueue.length > 0) {
                setTimeout(() => this.processNarrativeQueue(), 500);
            }
        }
    }

    // 타이핑 효과가 완료될 때까지 기다리는 유틸리티 메서드
    waitForTypingToComplete() {
        return new Promise(resolve => {
            const checkTyping = () => {
                if (!this.isTypingInProgress) {
                    resolve();
                } else {
                    setTimeout(checkTyping, 100);
                }
            };
            checkTyping();
        });
    }

    // battle:start 이벤트 핸들러 추가
    handleBattleStart(data) {
        try {
            console.log('UI: 전투 시작 처리:', data);
            
            // 캐릭터 상태창 업데이트
            if (data.enemy) {
                this.handleEnemyUpdate(data.enemy);
            }
            
            if (data.player) {
                this.handlePlayerUpdate(data.player);
            }
            
            // 전투 UI 요소 표시
            this.updateEnemyVisibility('battle');
            
            // 전투 시작 상태 메시지 (character-stats terminal에 표시)
            const enemy = data.enemy;
            if (enemy) {
                const battleNarrative = `${enemy.name}와의 전투가 시작되었다. 극지의 기사는 이 싸움에서 반드시 승리해야 한다.`;
                this.updateNarrativeStatus(battleNarrative, true); // 추가 모드로 변경
            }
        } catch (error) {
            console.error('전투 시작 UI 처리 중 오류:', error);
        }
    }

    // 모든 내러티브 메시지를 합쳐서 강제로 다시 표시하는 메서드
    refreshNarrativeStatus() {
        try {
            console.log('상태창 메시지 새로고침 시작...');
            console.log('현재 저장된 메시지:', this.narrativeMessages?.length || 0, '개');
            
            if (!this.elements.statusNarrative) {
                console.error('상태창 요소가 없습니다. 생성 시도...');
                this.createStatusContainer();
                
                if (!this.elements.statusNarrative) {
                    console.error('상태창 요소 생성 실패!');
                    return;
                }
            }
            
            // 메시지 배열이 비어있을 때만 기본 메시지 추가
            if (!this.narrativeMessages || this.narrativeMessages.length === 0) {
                console.warn('저장된 메시지가 없어 기본 메시지만 표시합니다');
                this.narrativeMessages = ["=== 게임 상태 ==="];
            } else {
                // 헤더 메시지가 없으면 추가
                const hasHeader = this.narrativeMessages.some(msg => msg.trim() === "=== 게임 상태 ===");
                if (!hasHeader) {
                    this.narrativeMessages.unshift("=== 게임 상태 ===");
                }
            }
            
            // 이미 저장된 메시지가 있으면 전부 합쳐서 표시
            const combinedMessage = this.narrativeMessages.join('\n\n');
            
            // 내용 직접 설정 (타이핑 효과 없이)
            this.elements.statusNarrative.textContent = combinedMessage;
            
            // 스크롤을 맨 아래로
            this.elements.statusNarrative.scrollTop = this.elements.statusNarrative.scrollHeight;
        } catch (error) {
            console.error('상태창 메시지 새로고침 중 오류:', error);
        }
    }

    // 로그 메시지를 내러티브에도 추가하는 유틸리티 메서드
    addLogAndNarrative(message, logType = 'narrative', context = 'battle', append = true) {
        try {
            // 로그에 추가
            this.addLogMessage(message, logType);
            
            // 내러티브에도 추가
            this.addToNarrativeQueue(message, append, context);
            
            return true;
        } catch (error) {
            console.error('[오류] 로그 및 내러티브 추가 중 오류:', error);
            return false;
        }
    }

    // 로그 메시지 핸들러 추가
    handleLogMessage(data) {
        try {
            if (data && data.message) {
                // 로그에 메시지 추가
                this.addLogMessage(data.message, data.type || 'narrative');
            }
        } catch (error) {
            console.error('[오류] 로그 메시지 처리 중 오류:', error);
        }
    }
}