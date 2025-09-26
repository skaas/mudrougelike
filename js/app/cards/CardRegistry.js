import { CARD_DEFINITIONS, CARD_RARITIES, COMMON_CARDS, RARE_CARDS } from './cardDefinitions.js';

const randomItem = (list = []) => {
    if (!list.length) {
        return null;
    }
    const index = Math.floor(Math.random() * list.length);
    return list[index];
};

export class CardRegistry {
    constructor(eventEmitter, { battleManager, rewardManager } = {}) {
        this.eventEmitter = eventEmitter;
        this.battleManager = battleManager;
        this.rewardManager = rewardManager;

        this.cards = new Map();
        this.cardsByRarity = new Map();
        this.activeCards = new Set();
        this.listeners = new Map();
        this.roundListeners = new Map();
        this.pendingOffers = [];
        this.pendingRareReward = false;

        CARD_DEFINITIONS.forEach((card) => this.registerCard(card));
    }

    registerCard(card) {
        if (!card || !card.key) {
            return;
        }
        this.cards.set(card.key, card);

        if (!this.cardsByRarity.has(card.rarity)) {
            this.cardsByRarity.set(card.rarity, []);
        }
        this.cardsByRarity.get(card.rarity).push(card);
    }

    drawCardOptions({ player, count = 3 } = {}) {
        const results = [];
        const usedKeys = new Set();

        const playerLevel = player?.level ?? 1;
        const rareChance = Math.min(0.15 + playerLevel * 0.02, 0.6);
        let raresRemaining = Math.random() < rareChance ? 1 : 0;

        while (results.length < count) {
            let pool = COMMON_CARDS;
            if (raresRemaining > 0) {
                pool = RARE_CARDS;
                raresRemaining -= 1;
            }

            const candidate = randomItem(pool.filter(card => !usedKeys.has(card.key)));
            if (!candidate) {
                break;
            }

            results.push(candidate);
            usedKeys.add(candidate.key);
        }

        if (results.length < count) {
            const commons = COMMON_CARDS.filter(card => !usedKeys.has(card.key));
            while (results.length < count && commons.length) {
                const card = commons.splice(Math.floor(Math.random() * commons.length), 1)[0];
                results.push(card);
                usedKeys.add(card.key);
            }
        }

        return results;
    }

    offerLevelUpCards(player) {
        const options = this.drawCardOptions({ player });
        const offer = {
            player,
            options,
            timestamp: Date.now()
        };
        this.pendingOffers.push(offer);
        this.eventEmitter.emit('cards:offer', offer);
        return options;
    }

    applyCard(cardKey, context = {}) {
        const card = this.cards.get(cardKey);
        if (!card) {
            throw new Error(`[CardRegistry] 알 수 없는 카드: ${cardKey}`);
        }

        const player = context.player;
        const applyContext = {
            ...context,
            registry: this,
            player,
            battleManager: this.battleManager,
            rewardManager: this.rewardManager
        };

        card.apply?.(applyContext);
        this.activeCards.add(card.key);
        this.eventEmitter.emit('cards:applied', { card, context: applyContext });
    }

    autoApplyFirstAvailable(player) {
        const offer = this.offerLevelUpCards(player);
        if (!offer.length) {
            return null;
        }
        const selected = offer[0];
        this.applyCard(selected.key, { player });
        return selected;
    }

    registerPlayerStrikeEffect(cardKey, handler) {
        if (!this.eventEmitter || this.listeners.has(cardKey)) {
            return;
        }
        const wrapped = (payload) => {
            handler?.({ ...payload, registry: this, player: payload.player });
        };
        this.listeners.set(cardKey, wrapped);
        this.eventEmitter.on('battle:player-strike', wrapped, this);
    }

    registerRoundStartEffect(cardKey, handler) {
        if (!this.eventEmitter || this.roundListeners.has(cardKey)) {
            return;
        }
        const wrapped = (payload) => {
            handler?.({ ...payload, registry: this, player: payload.player });
        };
        this.roundListeners.set(cardKey, wrapped);
        this.eventEmitter.on('battle:round-start', wrapped, this);
    }

    markNextChestAsRare() {
        this.pendingRareReward = true;
        if (this.rewardManager) {
            this.rewardManager.forceNextChestRare = true;
        }
        this.eventEmitter.emit('cards:rare-reward-flag', { active: true });
    }
}
