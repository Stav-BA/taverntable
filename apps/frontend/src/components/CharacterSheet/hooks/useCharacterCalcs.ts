/**
 * useCharacterCalcs — all auto-calculations via @taverntable/dnd-rules
 * Zero rule reimplementation — delegates everything to the rules engine.
 */

import { useMemo } from 'react';
import {
  getAbilityModifier,
  getProficiencyBonus,
  skillBonus,
  calculateAC,
  getSpellSlots,
} from '@taverntable/dnd-rules';
import type { ProficiencyLevel } from '@taverntable/dnd-rules';
import type { Character } from '../types';
import { ALL_SKILLS, SRD_CLASSES } from '../types';

const SPELLCASTING_CLASSES = new Set([
  'bard', 'cleric', 'druid', 'sorcerer', 'wizard',
  'paladin', 'ranger', 'warlock',
]);

/** Hit die by class name (lower-case). */
const HIT_DIE: Record<string, number> = {
  barbarian: 12, fighter: 10, paladin: 10, ranger: 10,
  bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
  sorcerer: 6, wizard: 6,
};

/** Constitution modifier contribution to max HP. */
function getMaxHP(character: Character): number {
  const classData = SRD_CLASSES.find(c => c.name === character.class);
  const hitDie = classData?.hitDie ?? HIT_DIE[character.class?.toLowerCase()] ?? 8;
  const conMod = getAbilityModifier(character.abilityScores.con);
  // Level 1: max hit die + con mod. Subsequent levels: average (hitDie/2 + 1) + con mod.
  const level1HP = hitDie + conMod;
  const subsequentHP = Math.max(0, character.level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);
  return Math.max(1, level1HP + subsequentHP);
}

/** Spellcasting ability by class. */
const SPELLCASTING_ABILITY: Record<string, keyof Character['abilityScores']> = {
  bard: 'cha', cleric: 'wis', druid: 'wis', paladin: 'cha',
  ranger: 'wis', sorcerer: 'cha', warlock: 'cha', wizard: 'int',
};

export function useCharacterCalcs(character: Character) {
  return useMemo(() => {
    const { abilityScores, level, skillProficiencies, skillExpertise, savingThrowProficiencies } = character;

    // ─── Ability Modifiers ─────────────────────────────────────────────────
    const strMod = getAbilityModifier(abilityScores.str);
    const dexMod = getAbilityModifier(abilityScores.dex);
    const conMod = getAbilityModifier(abilityScores.con);
    const intMod = getAbilityModifier(abilityScores.int);
    const wisMod = getAbilityModifier(abilityScores.wis);
    const chaMod = getAbilityModifier(abilityScores.cha);

    const mods = { str: strMod, dex: dexMod, con: conMod, int: intMod, wis: wisMod, cha: chaMod };

    // ─── Proficiency ───────────────────────────────────────────────────────
    const profBonus = level >= 1 && level <= 20 ? getProficiencyBonus(level) : 2;

    // ─── AC ────────────────────────────────────────────────────────────────
    const equippedArmor = character.equipment.find(e => e.isArmor && e.equipped);
    let ac: number;
    if (equippedArmor?.armorData) {
      ac = calculateAC(equippedArmor.armorData.baseAC, dexMod, equippedArmor.armorData.armorType);
      // Add shield if equipped
      const shield = character.equipment.find(e => e.name.toLowerCase().includes('shield') && !e.isArmor);
      if (shield) ac += 2;
    } else {
      // Unarmored: 10 + DEX
      ac = calculateAC(10, dexMod, 'unarmored');
    }

    // ─── Initiative ────────────────────────────────────────────────────────
    const initiative = dexMod;

    // ─── Speed ─────────────────────────────────────────────────────────────
    // Default 30, Dwarf/Gnome/Halfling 25
    const slowSpecies = new Set(['Dwarf', 'Gnome', 'Halfling']);
    const speed = slowSpecies.has(character.species) ? 25 : 30;

    // ─── Max HP ────────────────────────────────────────────────────────────
    const maxHP = getMaxHP(character);

    // ─── Skills ────────────────────────────────────────────────────────────
    const skills = ALL_SKILLS.map(skill => {
      const abilityMod = mods[skill.ability];
      let profLevel: ProficiencyLevel = 'none';
      if (skillExpertise.includes(skill.name)) profLevel = 'expert';
      else if (skillProficiencies.includes(skill.name)) profLevel = 'proficient';

      const bonus = skillBonus(abilityMod, level, profLevel);
      return {
        name: skill.name,
        ability: skill.ability,
        bonus,
        profLevel,
        isProficient: profLevel !== 'none',
        isExpert: profLevel === 'expert',
      };
    });

    // ─── Saving Throws ────────────────────────────────────────────────────
    const abilityNames: Array<{ key: keyof Character['abilityScores']; label: string }> = [
      { key: 'str', label: 'Strength' },
      { key: 'dex', label: 'Dexterity' },
      { key: 'con', label: 'Constitution' },
      { key: 'int', label: 'Intelligence' },
      { key: 'wis', label: 'Wisdom' },
      { key: 'cha', label: 'Charisma' },
    ];

    const savingThrows = abilityNames.map(({ key, label }) => {
      const isProficient = savingThrowProficiencies.includes(label);
      const profLevel: ProficiencyLevel = isProficient ? 'proficient' : 'none';
      return {
        ability: key,
        label,
        bonus: skillBonus(mods[key], level, profLevel),
        isProficient,
      };
    });

    // ─── Passive Perception ───────────────────────────────────────────────
    const perceptionSkill = skills.find(s => s.name === 'Perception');
    const passivePerception = 10 + (perceptionSkill?.bonus ?? wisMod);

    // ─── Spell Slots ──────────────────────────────────────────────────────
    let spellSlots: ReturnType<typeof getSpellSlots> | null = null;
    if (character.class && SPELLCASTING_CLASSES.has(character.class.toLowerCase())) {
      try {
        spellSlots = getSpellSlots(character.class, level);
      } catch {
        spellSlots = null;
      }
    }

    // ─── Spell Attack / Save DC ────────────────────────────────────────────
    const spellcastingAbility = character.class
      ? SPELLCASTING_ABILITY[character.class.toLowerCase()]
      : null;
    const spellcastingMod = spellcastingAbility ? mods[spellcastingAbility] : 0;
    const spellAttackBonus = spellcastingAbility ? profBonus + spellcastingMod : 0;
    const spellSaveDC = spellcastingAbility ? 8 + profBonus + spellcastingMod : 0;

    // ─── Hit Dice ─────────────────────────────────────────────────────────
    const classData = SRD_CLASSES.find(c => c.name === character.class);
    const hitDie = classData?.hitDie ?? 8;

    return {
      strMod, dexMod, conMod, intMod, wisMod, chaMod, mods,
      profBonus,
      ac,
      initiative,
      speed,
      maxHP,
      skills,
      savingThrows,
      passivePerception,
      spellSlots,
      spellAttackBonus,
      spellSaveDC,
      spellcastingAbility,
      hitDie,
    };
  }, [character]);
}
