export class RewardContext {
    constructor({ rewardTable, player }) {
        this.rewardTable = rewardTable;
        this.player = player;
        this.availableRewards = [];
    }

    generate(options = {}) {
        this.availableRewards = this.rewardTable.pick(options);
        return [...this.availableRewards];
    }

    apply(rewardKey, target) {
        const reward = this.availableRewards.find(item => item.key === rewardKey);
        if (!reward) {
            throw new Error(Unknown reward key: );
        }
        return reward.apply(target ?? this.player);
    }
}