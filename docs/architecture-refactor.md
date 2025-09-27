# Domain/Application Layer Refactor

## ��ǥ
- GameState�� ������ ����ҿ� ���� ������ ��Ģ�� ����
- ���� ������ BattleContext, ���� ������ RewardContext�� �̵�
- GameLifecycle�� BattleController�� �帧 ��� ����ϰ� UI�� ������ ������ �и�

## ���� ���
- **BattleContext**: ����/�� ���¿� ���� ��� ���, ���� ��ü
- **RewardContext**: ���� ���� �� ���� ��Ģ ���, ��� ��� ��ȯ
- **GameLifecycle**: ������ ��ȯ �Ѱ�, ���ؽ�Ʈ�� �� ����
- **BattleController**: BattleContext�� ����� ���� ����, �񵿱� �帧 ����
- **GameViewPort**: UI �������� �����ؾ� �� �ݹ� ����

## �ܰ躰 ��ȯ
1. ���� GameState���� �Ŵ��� ����/�̺�Ʈ ���� ����
2. BattleManager ������ BattleContext�� ����
3. RewardSystem�� ���� ó���� RewardContext�� �̵�
4. Game.js�� GameLifecycle/BattleController ������� �籸��
5. UIManager�� GameViewPort �ݹ��� �����ϵ��� ����� �ۼ�
