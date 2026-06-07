import React from 'react';

interface Spell {
  name: string; level: number; school: string; castingTime: string;
  range: string; components: { verbal: boolean; somatic: boolean; material: boolean; materialDesc?: string };
  duration: string; concentration: boolean; ritual: boolean;
  description: string; atHigherLevels?: string; classes: string[];
}

const SCHOOL_COLORS: Record<string, string> = {
  Evocation: 'bg-red-700', Abjuration: 'bg-blue-700', Conjuration: 'bg-amber-700',
  Divination: 'bg-indigo-600', Enchantment: 'bg-pink-700', Illusion: 'bg-teal-700',
  Necromancy: 'bg-purple-800', Transmutation: 'bg-green-700',
};

export const SpellCard: React.FC<{ spell: Spell; compact?: boolean }> = ({ spell, compact }) => {
  const compStr = [
    spell.components.verbal && 'V',
    spell.components.somatic && 'S',
    spell.components.material && `M${spell.components.materialDesc ? ` (${spell.components.materialDesc})` : ''}`,
  ].filter(Boolean).join(', ');

  const levelStr = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;

  return (
    <div className="bg-[#fdf1dc] border border-[#c9a227] rounded-lg overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#2d1b00]">
        <span className={`text-white text-xs font-bold px-2 py-0.5 rounded ${SCHOOL_COLORS[spell.school] ?? 'bg-gray-700'}`}>
          {spell.school}
        </span>
        <h3 className="text-[#c9a227] font-['Cinzel'] font-bold flex-1">{spell.name}</h3>
        <span className="text-[#f5d7b5] text-xs">{levelStr}</span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div><span className="font-bold text-[#922610]">Casting Time</span><br />{spell.castingTime}</div>
          <div><span className="font-bold text-[#922610]">Range</span><br />{spell.range}</div>
          <div><span className="font-bold text-[#922610]">Components</span><br />{compStr}</div>
          <div><span className="font-bold text-[#922610]">Duration</span><br />{spell.duration}</div>
        </div>

        {/* Badges */}
        <div className="flex gap-1 flex-wrap">
          {spell.concentration && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">Concentration</span>}
          {spell.ritual && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">Ritual</span>}
          {spell.classes.map(c => (
            <span key={c} className="bg-[#2d1b00]/10 text-[#2d1b00] text-xs px-2 py-0.5 rounded-full capitalize">{c}</span>
          ))}
        </div>

        {!compact && (
          <>
            <p className="text-xs text-gray-800 leading-relaxed">{spell.description}</p>
            {spell.atHigherLevels && (
              <div className="bg-[#c9a227]/20 border border-[#c9a227]/40 rounded p-2">
                <span className="font-bold text-xs text-[#2d1b00]">At Higher Levels. </span>
                <span className="text-xs text-gray-800">{spell.atHigherLevels}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
