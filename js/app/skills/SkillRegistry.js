import { SKILL_TEMPLATES, SKILL_VARIANTS, ENEMY_PRESETS } from './skillDefinitions.js';

const cloneValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(cloneValue);
    }
    if (value && typeof value === 'object') {
        return { ...value };
    }
    return value;
};

const cloneEffects = (effects = []) => effects.map(effect => ({ ...effect, value: cloneValue(effect.value) }));

export class SkillRegistry {
    constructor({ templates = SKILL_TEMPLATES, variants = SKILL_VARIANTS, presets = ENEMY_PRESETS } = {}) {
        this.templates = new Map();
        this.variants = new Map();
        this.variantsByOwner = new Map();
        this.variantsByType = new Map();
        this.presets = new Map();

        this.loadTemplates(templates);
        this.loadVariants(variants);
        this.loadPresets(presets);
    }

    loadTemplates(templates) {
        Object.values(templates || {}).forEach(template => {
            if (!template || !template.type) {
                return;
            }
            this.templates.set(template.type, {
                type: template.type,
                defaultName: template.defaultName || template.type,
                effects: cloneEffects(template.effects || []),
                condition: template.condition || null,
                metadata: template.metadata ? { ...template.metadata } : {}
            });
        });
    }

    loadVariants(variants) {
        (variants || []).forEach(variant => this.registerVariant(variant));
    }

    loadPresets(presets) {
        Object.entries(presets || {}).forEach(([name, entries]) => {
            this.presets.set(name, entries.map(entry => ({ ...entry })));
        });
    }

    registerVariant(variant = {}) {
        if (!variant.key || !variant.type || !variant.owner) {
            return;
        }

        const normalized = {
            key: variant.key,
            type: variant.type,
            owner: variant.owner,
            name: variant.name,
            weight: variant.weight,
            requirements: variant.requirements ? { ...variant.requirements } : {},
            availability: variant.availability ? { ...variant.availability } : {},
            condition: variant.condition || null,
            metadata: variant.metadata ? { ...variant.metadata } : {}
        };

        this.variants.set(normalized.key, normalized);

        if (!this.variantsByOwner.has(normalized.owner)) {
            this.variantsByOwner.set(normalized.owner, new Set());
        }
        this.variantsByOwner.get(normalized.owner).add(normalized.key);

        if (!this.variantsByType.has(normalized.type)) {
            this.variantsByType.set(normalized.type, new Set());
        }
        this.variantsByType.get(normalized.type).add(normalized.key);
    }

    getDefinition(type) {
        const template = this.templates.get(type);
        if (!template) {
            return null;
        }
        return {
            type: template.type,
            name: template.defaultName,
            effects: cloneEffects(template.effects),
            condition: template.condition,
            metadata: { ...template.metadata }
        };
    }

    getVariantByKey(key, context = {}) {
        const variant = this.variants.get(key);
        if (!variant) {
            return null;
        }
        if (!this.variantIsAvailable(variant, context)) {
            return null;
        }
        return this.composeVariant(variant, context, context.weightOverride);
    }

    getVariantsByType(type, context = {}) {
        const keys = this.variantsByType.get(type);
        if (!keys) {
            return [];
        }
        return Array.from(keys)
            .map(key => this.variants.get(key))
            .filter(variant => this.variantIsAvailable(variant, context))
            .map(variant => this.composeVariant(variant, context));
    }

    getPlayerSkills({ player, includeLocked = false } = {}) {
        return this.getVariantsForOwner('player', { player, includeLocked });
    }

    getEnemySkills({ enemy, player, isBoss = false, stage, includeLocked = false } = {}) {
        return this.getVariantsForOwner('enemy', { enemy, player, isBoss, stage, includeLocked });
    }

    getVariantsForOwner(owner, context = {}) {
        const keys = this.variantsByOwner.get(owner);
        if (!keys) {
            return [];
        }
        return Array.from(keys)
            .map(key => this.variants.get(key))
            .filter(variant => {
                if (!variant) {
                    return false;
                }
                return this.variantIsAvailable(variant, context);
            })
            .map(variant => this.composeVariant(variant, context));
    }

    getEnemyPreset(name, context = {}) {
        const entries = this.presets.get(name) || [];
        return entries
            .map(entry => {
                const variant = this.variants.get(entry.key);
                if (!variant) {
                    return null;
                }
                if (!this.variantIsAvailable(variant, context)) {
                    return null;
                }
                return this.composeVariant(variant, context, entry.weight);
            })
            .filter(Boolean);
    }

    composeVariant(variant, context = {}, weightOverride) {
        const template = this.templates.get(variant.type) || {};
        return {
            key: variant.key,
            type: variant.type,
            owner: variant.owner,
            name: variant.name || template.defaultName || variant.type,
            weight: typeof weightOverride === 'number' ? weightOverride : (variant.weight ?? template.metadata?.defaultWeight ?? 1),
            effects: cloneEffects(template.effects || []),
            condition: variant.condition || template.condition || null,
            metadata: { ...template.metadata, ...variant.metadata },
            requirements: { ...variant.requirements },
            availability: { ...variant.availability }
        };
    }

    variantIsAvailable(variant, context = {}) {
        const availability = variant.availability || {};
        const requirements = variant.requirements || {};
        const { includeLocked = false } = context;

        if (availability.bossOnly && !context.isBoss) {
            return false;
        }
        if (availability.normalOnly && context.isBoss) {
            return false;
        }
        if (availability.minStage && typeof context.stage === 'number' && context.stage < availability.minStage) {
            return false;
        }

        if (!includeLocked) {
            if (variant.owner === 'player') {
                const player = context.player;
                if (!this.meetsLevelRequirement(player, requirements)) {
                    return false;
                }
            }
            if (variant.owner === 'enemy') {
                const enemy = context.enemy;
                if (!this.meetsLevelRequirement(enemy, requirements)) {
                    return false;
                }
            }
        }

        return true;
    }

    meetsLevelRequirement(entity, requirements = {}) {
        const { minLevel, maxLevel } = requirements;
        if (!minLevel && !maxLevel) {
            return true;
        }
        if (!entity) {
            return false;
        }
        const level = entity.level ?? 0;
        if (minLevel && level < minLevel) {
            return false;
        }
        if (maxLevel && level > maxLevel) {
            return false;
        }
        return true;
    }
}

export const skillRegistry = new SkillRegistry();


