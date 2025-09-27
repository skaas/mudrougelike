# Domain/Application Layer Refactor

## 목표
- GameState는 데이터 저장소와 순수 도메인 규칙만 유지
- 전투 로직은 BattleContext, 보상 로직은 RewardContext로 이동
- GameLifecycle과 BattleController가 흐름 제어를 담당하고 UI와 도메인 계층을 분리

## 구성 요소
- **BattleContext**: 라운드/턴 상태와 전투 계산 담당, 순수 객체
- **RewardContext**: 보상 생성 및 적용 규칙 담당, 명령 기반 반환
- **GameLifecycle**: 페이즈 전환 총괄, 컨텍스트와 뷰 연결
- **BattleController**: BattleContext를 사용해 전투 진행, 비동기 흐름 관리
- **GameViewPort**: UI 계층에서 구현해야 할 콜백 집합

## 단계별 전환
1. 기존 GameState에서 매니저 생성/이벤트 의존 제거
2. BattleManager 로직을 BattleContext로 이전
3. RewardSystem의 보상 처리를 RewardContext로 이동
4. Game.js를 GameLifecycle/BattleController 기반으로 재구성
5. UIManager가 GameViewPort 콜백을 구현하도록 어댑터 작성
