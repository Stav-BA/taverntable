/**
 * CoreTab — main layout for the Core tab
 */

import React from 'react';
import type { Character } from '../../types';
import type { useCharacterCalcs } from '../../hooks/useCharacterCalcs';
import type { useCharacter } from '../../hooks/useCharacter';
import AbilityBlock from './AbilityBlock';
import CombatStats from './CombatStats';
import HPTracker from './HPTracker';
import SavingThrows from './SavingThrows';
import SkillsList from './SkillsList';
import DeathSaves from './DeathSaves';
import ConditionTracker from './ConditionTracker';

type Calcs = ReturnType<typeof useCharacterCalcs>;
type Hooks = ReturnType<typeof useCharacter>;

interface CoreTabProps {
  character: Character;
  calcs: Calcs;
  hooks: Hooks;
}

export default function CoreTab({ character, calcs, hooks }: CoreTabProps) {
  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {/* Left Column */}
      <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AbilityBlock character={character} calcs={calcs} hooks={hooks} />
        <SavingThrows calcs={calcs} />
      </div>

      {/* Middle Column */}
      <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CombatStats calcs={calcs} />
        <HPTracker
          maxHP={calcs.maxHP}
          currentHP={character.currentHP}
          tempHP={character.tempHP}
          onDamage={hooks.damage}
          onHeal={hooks.heal}
          onTempHP={hooks.setTempHP}
          isDying={character.currentHP === 0}
          deathSaves={character.deathSaves}
          onDeathSave={hooks.addDeathSave}
          onResetDeathSaves={hooks.resetDeathSaves}
        />
        <ConditionTracker
          conditions={character.conditions}
          onAdd={hooks.addCondition}
          onRemove={hooks.removeCondition}
          exhaustionLevel={character.exhaustionLevel}
          onExhaustionChange={level => hooks.update('exhaustionLevel', level)}
        />
      </div>

      {/* Right Column */}
      <div style={{ flex: '1 1 280px' }}>
        <SkillsList
          character={character}
          calcs={calcs}
          onToggleProficiency={hooks.toggleSkillProficiency}
          onToggleExpertise={hooks.toggleSkillExpertise}
        />
      </div>
    </div>
  );
}
