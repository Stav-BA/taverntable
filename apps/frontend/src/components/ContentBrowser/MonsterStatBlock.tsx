import React from 'react';

interface MonsterStatBlockProps {
  monster: {
    name: string; size: string; type: string; alignment: string;
    ac: { value: number; notes?: string }[];
    hp: { average: number; formula: string };
    speed: { walk: number; fly?: number; swim?: number; climb?: number };
    abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
    savingThrows?: Record<string, number>;
    skills?: Record<string, number>;
    damageResistances?: string[]; damageImmunities?: string[]; conditionImmunities?: string[];
    senses?: string; languages?: string; cr: number | string; xp: number;
    traits?: { name: string; desc: string }[];
    actions?: { name: string; desc: string }[];
    legendaryActions?: { name: string; desc: string }[];
  };
  compact?: boolean;
}

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

export const MonsterStatBlock: React.FC<MonsterStatBlockProps> = ({ monster, compact }) => {
  const speeds = [
    monster.speed.walk && `${monster.speed.walk} ft.`,
    monster.speed.fly && `fly ${monster.speed.fly} ft.`,
    monster.speed.swim && `swim ${monster.speed.swim} ft.`,
    monster.speed.climb && `climb ${monster.speed.climb} ft.`,
  ].filter(Boolean).join(', ');

  return (
    <div className="font-serif text-[#1a0a00] border-2 border-[#922610] rounded shadow-lg bg-[#fdf1dc] max-w-sm">
      {/* Header */}
      <div className="bg-[#922610] px-4 py-2">
        <h2 className="text-white font-bold text-xl font-['Cinzel']">{monster.name}</h2>
        <p className="text-[#f5d7b5] text-sm italic">{monster.size} {monster.type}, {monster.alignment}</p>
      </div>

      <div className="px-4 py-2 space-y-1 text-sm">
        {/* Divider */}
        <hr className="border-[#922610] border-t-2 my-1" />

        <p><span className="font-bold">Armor Class</span> {monster.ac.map(a => `${a.value}${a.notes ? ` (${a.notes})` : ''}`).join(', ')}</p>
        <p><span className="font-bold">Hit Points</span> {monster.hp.average} ({monster.hp.formula})</p>
        <p><span className="font-bold">Speed</span> {speeds}</p>

        <hr className="border-[#922610] border-t-2 my-1" />

        {/* Ability scores */}
        <div className="grid grid-cols-6 gap-1 text-center text-xs">
          {(['str','dex','con','int','wis','cha'] as const).map(ab => (
            <div key={ab} className="flex flex-col">
              <span className="font-bold uppercase">{ab}</span>
              <span>{monster.abilityScores[ab]} ({mod(monster.abilityScores[ab])})</span>
            </div>
          ))}
        </div>

        <hr className="border-[#922610] border-t-2 my-1" />

        {monster.savingThrows && Object.keys(monster.savingThrows).length > 0 && (
          <p><span className="font-bold">Saving Throws</span>{' '}
            {Object.entries(monster.savingThrows).map(([k,v]) => `${k.charAt(0).toUpperCase()+k.slice(1)} +${v}`).join(', ')}
          </p>
        )}
        {monster.skills && Object.keys(monster.skills).length > 0 && (
          <p><span className="font-bold">Skills</span>{' '}
            {Object.entries(monster.skills).map(([k,v]) => `${k.charAt(0).toUpperCase()+k.slice(1)} +${v}`).join(', ')}
          </p>
        )}
        {monster.damageResistances?.length && <p><span className="font-bold">Damage Resistances</span> {monster.damageResistances.join('; ')}</p>}
        {monster.damageImmunities?.length && <p><span className="font-bold">Damage Immunities</span> {monster.damageImmunities.join(', ')}</p>}
        {monster.conditionImmunities?.length && <p><span className="font-bold">Condition Immunities</span> {monster.conditionImmunities.join(', ')}</p>}
        {monster.senses && <p><span className="font-bold">Senses</span> {monster.senses}</p>}
        {monster.languages && <p><span className="font-bold">Languages</span> {monster.languages}</p>}
        <p><span className="font-bold">Challenge</span> {monster.cr} ({monster.xp.toLocaleString()} XP)</p>

        {!compact && monster.traits?.length && (
          <>
            <hr className="border-[#922610] border-t-2 my-1" />
            {monster.traits.map(t => (
              <p key={t.name} className="text-xs"><span className="font-bold italic">{t.name}.</span> {t.desc}</p>
            ))}
          </>
        )}

        {!compact && monster.actions?.length && (
          <>
            <hr className="border-[#922610] border-t-2 my-1" />
            <h3 className="font-['Cinzel'] font-bold text-[#922610] uppercase text-xs tracking-widest">Actions</h3>
            {monster.actions.map(a => (
              <p key={a.name} className="text-xs"><span className="font-bold italic">{a.name}.</span> {a.desc}</p>
            ))}
          </>
        )}

        {!compact && monster.legendaryActions?.length && (
          <>
            <hr className="border-[#922610] border-t-2 my-1" />
            <h3 className="font-['Cinzel'] font-bold text-[#922610] uppercase text-xs tracking-widest">Legendary Actions</h3>
            {monster.legendaryActions.map(a => (
              <p key={a.name} className="text-xs"><span className="font-bold italic">{a.name}.</span> {a.desc}</p>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
