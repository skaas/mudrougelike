export class LegacyRewardContextAdapter {
    constructor({ rewardSystem, state }) {
        this.rewardSystem = rewardSystem;
        this.state = state;
        this.lastRewards = [];
    }

    generate(context = {}) {
        const rewards = this.rewardSystem.generateRewardOptions(context) || [];
        this.lastRewards = rewards.map((reward) => {
            const key = reward.type ?? reward.key ?? reward.name;
            return {
                ...reward,
                key,
                apply: (applyContext = {}) => {
                    const result = this.rewardSystem.applyReward(key, {
                        ...context,
                        ...applyContext,
                        target: applyContext.target ?? this.state?.playerManager?.getPlayer?.()
                    }) || {};
                    return {
                        key,
                        reward,
                        message: typeof result.message === 'string' ? result.message : '',
                        raw: result
                    };
                }
            };
        });
        return this.lastRewards;
    }

    apply(rewardKey, context = {}) {
        return this.rewardSystem.applyReward(rewardKey, context);
    }

    clear() {
        this.rewardSystem.clearGeneratedRewards?.();
        this.lastRewards = [];
    }
}