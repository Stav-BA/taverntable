/**
 * useCharacter — TavernTable character state management
 * Wraps a Character in React state with typed update helpers.
 */

import { useState, useCallback } from 'react';
import type { Character, EquipmentItem, Feature, Spell } from '../types';
import { DEFAULT_CHARACTER } from '../types';

export function useCharacter(initial: Partial<Character> = {}) {
  const [character, setCharacter] = useState<Character>({ ...DEFAULT_CHARACTER, ...initial });

  const update = useCallback(<K extends keyof Character>(key: K, value: Character[K]) => {
    setCharacter(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAbilityScore = useCallback(
    (ability: keyof Character['abilityScores'], value: number) => {
      setCharacter(prev => ({
        ...prev,
        abilityScores: { ...prev.abilityScores, [ability]: value },
      }));
    },
    [],
  );

  // ─── HP ──────────────────────────────────────────────────────────────────
  const damage = useCallback((amount: number) => {
    setCharacter(prev => {
      let remaining = amount;
      let tempHP = prev.tempHP;
      if (tempHP > 0) {
        const absorbed = Math.min(tempHP, remaining);
        tempHP -= absorbed;
        remaining -= absorbed;
      }
      const currentHP = Math.max(0, prev.currentHP - remaining);
      return { ...prev, currentHP, tempHP };
    });
  }, []);

  const heal = useCallback((amount: number) => {
    setCharacter(prev => ({
      ...prev,
      currentHP: Math.min(prev.currentHP + amount, /* will be recalculated */ prev.currentHP + amount),
    }));
  }, []);

  const setTempHP = useCallback((amount: number) => {
    setCharacter(prev => ({ ...prev, tempHP: Math.max(prev.tempHP, amount) }));
  }, []);

  // ─── Death Saves ──────────────────────────────────────────────────────────
  const addDeathSave = useCallback((type: 'success' | 'failure') => {
    setCharacter(prev => ({
      ...prev,
      deathSaves: {
        ...prev.deathSaves,
        successes: type === 'success'
          ? Math.min(3, prev.deathSaves.successes + 1)
          : prev.deathSaves.successes,
        failures: type === 'failure'
          ? Math.min(3, prev.deathSaves.failures + 1)
          : prev.deathSaves.failures,
      },
    }));
  }, []);

  const resetDeathSaves = useCallback(() => {
    setCharacter(prev => ({ ...prev, deathSaves: { successes: 0, failures: 0 } }));
  }, []);

  // ─── Spell Slots ──────────────────────────────────────────────────────────
  const expendSpellSlot = useCallback((level: number) => {
    setCharacter(prev => ({
      ...prev,
      spellSlotsUsed: {
        ...prev.spellSlotsUsed,
        [level]: (prev.spellSlotsUsed[level] ?? 0) + 1,
      },
    }));
  }, []);

  const restoreSpellSlot = useCallback((level: number) => {
    setCharacter(prev => {
      const current = prev.spellSlotsUsed[level] ?? 0;
      if (current <= 0) return prev;
      return {
        ...prev,
        spellSlotsUsed: { ...prev.spellSlotsUsed, [level]: current - 1 },
      };
    });
  }, []);

  const restoreAllSpellSlots = useCallback(() => {
    setCharacter(prev => ({ ...prev, spellSlotsUsed: {} }));
  }, []);

  // ─── Conditions ──────────────────────────────────────────────────────────
  const addCondition = useCallback((condition: string) => {
    setCharacter(prev => {
      if (prev.conditions.includes(condition)) return prev;
      return { ...prev, conditions: [...prev.conditions, condition] };
    });
  }, []);

  const removeCondition = useCallback((condition: string) => {
    setCharacter(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c !== condition),
    }));
  }, []);

  // ─── Equipment ───────────────────────────────────────────────────────────
  const addEquipment = useCallback((item: EquipmentItem) => {
    setCharacter(prev => ({ ...prev, equipment: [...prev.equipment, item] }));
  }, []);

  const removeEquipment = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, equipment: prev.equipment.filter(e => e.id !== id) }));
  }, []);

  const updateEquipment = useCallback((id: string, changes: Partial<EquipmentItem>) => {
    setCharacter(prev => ({
      ...prev,
      equipment: prev.equipment.map(e => e.id === id ? { ...e, ...changes } : e),
    }));
  }, []);

  // ─── Spells ──────────────────────────────────────────────────────────────
  const addSpell = useCallback((spell: Spell) => {
    setCharacter(prev => {
      if (prev.spells.find(s => s.id === spell.id)) return prev;
      return { ...prev, spells: [...prev.spells, spell] };
    });
  }, []);

  const removeSpell = useCallback((id: string) => {
    setCharacter(prev => ({ ...prev, spells: prev.spells.filter(s => s.id !== id) }));
  }, []);

  const toggleSpellPrepared = useCallback((id: string) => {
    setCharacter(prev => ({
      ...prev,
      spells: prev.spells.map(s => s.id === id ? { ...s, prepared: !s.prepared } : s),
    }));
  }, []);

  // ─── Features ────────────────────────────────────────────────────────────
  const addFeature = useCallback((feature: Feature) => {
    setCharacter(prev => ({ ...prev, features: [...prev.features, feature] }));
  }, []);

  // ─── Skills & Proficiencies ───────────────────────────────────────────────
  const toggleSkillProficiency = useCallback((skill: string) => {
    setCharacter(prev => {
      const hasProficiency = prev.skillProficiencies.includes(skill);
      if (hasProficiency) {
        return {
          ...prev,
          skillProficiencies: prev.skillProficiencies.filter(s => s !== skill),
          skillExpertise: prev.skillExpertise.filter(s => s !== skill),
        };
      }
      return { ...prev, skillProficiencies: [...prev.skillProficiencies, skill] };
    });
  }, []);

  const toggleSkillExpertise = useCallback((skill: string) => {
    setCharacter(prev => {
      if (!prev.skillProficiencies.includes(skill)) return prev;
      const hasExpertise = prev.skillExpertise.includes(skill);
      return {
        ...prev,
        skillExpertise: hasExpertise
          ? prev.skillExpertise.filter(s => s !== skill)
          : [...prev.skillExpertise, skill],
      };
    });
  }, []);

  return {
    character,
    setCharacter,
    update,
    updateAbilityScore,
    damage,
    heal,
    setTempHP,
    addDeathSave,
    resetDeathSaves,
    expendSpellSlot,
    restoreSpellSlot,
    restoreAllSpellSlots,
    addCondition,
    removeCondition,
    addEquipment,
    removeEquipment,
    updateEquipment,
    addSpell,
    removeSpell,
    toggleSpellPrepared,
    addFeature,
    toggleSkillProficiency,
    toggleSkillExpertise,
  };
}
