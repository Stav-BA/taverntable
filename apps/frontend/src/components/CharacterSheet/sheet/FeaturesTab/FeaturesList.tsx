/**
 * FeaturesList — Class features + species traits + feats
 */

import React, { useState } from 'react';
import type { Character, Feature } from '../../types';
import { SRD_CLASSES, SRD_SPECIES } from '../../types';

interface FeaturesListProps { character: Character; }

const SOURCE_LABELS: Record<Feature['source'], string> = {
  class: 'Class Feature', species: 'Species Trait', background: 'Background', feat: 'Feat',
};

const SOURCE_COLORS: Record<Feature['source'], string> = {
  class: '#2D5016', species: '#1A3A6B', background: '#8B6914', feat: '#8B1A1A',
};

// Derived features from character data
function getDerivedFeatures(character: Character): Feature[] {
  const features: Feature[] = [];

  // Class features level 1
  const classData = SRD_CLASSES.find(c => c.name === character.class);
  if (classData) {
    if (character.class === 'Barbarian') {
      features.push({ id: 'rage', name: 'Rage', source: 'class', description: 'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action. While raging, you gain advantage on Strength checks and saving throws, a bonus to melee weapon damage rolls, and resistance to bludgeoning, piercing, and slashing damage.', level: 1 });
      features.push({ id: 'unarmored-defense-barb', name: 'Unarmored Defense', source: 'class', description: 'While you are not wearing any armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier.', level: 1 });
    }
    if (character.class === 'Fighter') {
      features.push({ id: 'fighting-style', name: 'Fighting Style', source: 'class', description: 'You adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting.', level: 1 });
      features.push({ id: 'second-wind', name: 'Second Wind', source: 'class', description: 'You have a limited well of stamina you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.', level: 1 });
    }
    if (character.class === 'Rogue') {
      features.push({ id: 'sneak-attack', name: 'Sneak Attack', source: 'class', description: 'Beginning at 1st level, you know how to strike subtly and exploit a foe\'s distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll.', level: 1 });
      features.push({ id: 'thieves-cant', name: "Thieves' Cant", source: 'class', description: 'During your rogue training you learned thieves\' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.', level: 1 });
      features.push({ id: 'expertise-rogue', name: 'Expertise', source: 'class', description: 'At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves\' tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.', level: 1 });
    }
    if (character.class === 'Wizard') {
      features.push({ id: 'arcane-recovery', name: 'Arcane Recovery', source: 'class', description: 'You have learned to regain some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can choose expended spell slots to recover.', level: 1 });
    }
    if (character.class === 'Cleric') {
      features.push({ id: 'divine-domain', name: 'Divine Domain', source: 'class', description: 'Choose one domain related to your deity. Your choice grants you domain spells and other features when you choose it at 1st level.', level: 1 });
    }
    if (character.class === 'Bard') {
      features.push({ id: 'bardic-inspiration', name: 'Bardic Inspiration', source: 'class', description: 'You can inspire others through stirring words or music. To do so, you use a bonus action on your turn to choose one creature other than yourself within 60 feet of you. That creature gains one Bardic Inspiration die (d6).', level: 1 });
    }
    if (character.class === 'Paladin') {
      features.push({ id: 'divine-sense', name: 'Divine Sense', source: 'class', description: 'The presence of strong evil registers on your senses like a noxious odor. As an action, you can open your awareness to detect such forces.', level: 1 });
      features.push({ id: 'lay-on-hands', name: 'Lay on Hands', source: 'class', description: 'Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest. With that pool, you can restore a total number of hit points equal to your paladin level × 5.', level: 1 });
    }
    if (character.class === 'Druid') {
      features.push({ id: 'wild-shape', name: 'Wild Shape', source: 'class', description: 'Starting at 2nd level, you can use your action to magically assume the shape of a beast that you have seen before.', level: 2 });
    }
    if (character.class === 'Ranger') {
      features.push({ id: 'favored-enemy', name: 'Favored Enemy', source: 'class', description: 'Beginning at 1st level, you have significant experience studying, tracking, hunting, and even talking to a certain type of enemy. Choose a type of favored enemy: aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead.', level: 1 });
    }
    if (character.class === 'Monk') {
      features.push({ id: 'unarmored-defense-monk', name: 'Unarmored Defense', source: 'class', description: 'While you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.', level: 1 });
      features.push({ id: 'martial-arts', name: 'Martial Arts', source: 'class', description: 'Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons. You can use Dexterity instead of Strength for the attack and damage rolls of your unarmed strikes and monk weapons. You can roll a d4 in place of the normal damage of your unarmed strike.', level: 1 });
    }
    if (character.class === 'Sorcerer') {
      features.push({ id: 'sorcerous-origin', name: 'Sorcerous Origin', source: 'class', description: 'Choose a sorcerous origin, which describes the source of your innate magical power: Draconic Bloodline, Wild Magic, or another origin. Your choice grants you features when you choose it at 1st level and again at 6th, 14th, and 18th level.', level: 1 });
    }
    if (character.class === 'Warlock') {
      features.push({ id: 'otherworldly-patron', name: 'Otherworldly Patron', source: 'class', description: 'At 1st level, you have struck a bargain with an otherworldly being of your choice. Your choice of patron grants you features at 1st level and again at 6th, 10th, and 14th level.', level: 1 });
      features.push({ id: 'pact-magic', name: 'Pact Magic', source: 'class', description: 'Your arcane research and the magic bestowed on you by your patron have given you facility with spells. See Spells Rules for the general rules of spellcasting and the Spells Listing for the warlock spell list.', level: 1 });
    }

    // Proficiencies as a feature
    features.push({
      id: 'saving-throw-profs',
      name: `${character.class} Proficiencies`,
      source: 'class',
      description: `Armour: ${character.class === 'Barbarian' || character.class === 'Fighter' || character.class === 'Paladin' ? 'All armour, shields' : character.class === 'Cleric' || character.class === 'Druid' || character.class === 'Ranger' ? 'Light and medium armour, shields' : 'Light armour'}. Weapons: ${character.class === 'Fighter' ? 'All simple and martial weapons' : 'Simple weapons'}. Saving Throws: ${classData.savingThrows.join(', ')}.`,
      level: 1,
    });
  }

  // Species traits
  const speciesData = SRD_SPECIES.find(s => s.name === character.species);
  if (speciesData) {
    speciesData.traits.forEach((trait, i) => {
      features.push({
        id: `species-${i}`,
        name: trait,
        source: 'species',
        description: `${trait} is a racial trait of ${character.species}s. See the Player's Handbook for full details.`,
      });
    });
  }

  return features;
}

export default function FeaturesList({ character }: FeaturesListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterSource, setFilterSource] = useState<Feature['source'] | 'all'>('all');

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const derived = getDerivedFeatures(character);
  const allFeatures = [...derived, ...character.features];

  const filtered = filterSource === 'all'
    ? allFeatures
    : allFeatures.filter(f => f.source === filterSource);

  const sources: Array<{ id: Feature['source'] | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'class', label: 'Class' },
    { id: 'species', label: 'Species' },
    { id: 'background', label: 'Background' },
    { id: 'feat', label: 'Feats' },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSource(s.id as any)}
            style={{
              background: filterSource === s.id ? '#2D1B00' : '#EDD9A3',
              color: filterSource === s.id ? '#C9A227' : '#5A3E1B',
              border: '2px solid #2D1B00', borderRadius: 6,
              padding: '5px 14px', cursor: 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 12,
              letterSpacing: '0.03em',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#EDD9A3', border: '2px solid #2D1B00', borderRadius: 8, padding: 24, textAlign: 'center', color: '#8B6914', fontStyle: 'italic' }}>
          No features to display.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(feature => {
            const isExpanded = expanded.has(feature.id);
            const color = SOURCE_COLORS[feature.source];
            return (
              <div
                key={feature.id}
                style={{
                  background: '#EDD9A3',
                  border: `2px solid ${isExpanded ? color : '#2D1B0044'}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => toggle(feature.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    background: color, color: '#FFF',
                    borderRadius: 12, padding: '1px 10px',
                    fontSize: 10, fontFamily: "'Cinzel', serif",
                    whiteSpace: 'nowrap',
                  }}>
                    {SOURCE_LABELS[feature.source]}
                  </div>
                  <span style={{ flex: 1, fontFamily: "'Cinzel', serif", fontSize: 14, color: '#2D1B00' }}>
                    {feature.name}
                  </span>
                  {feature.level && (
                    <span style={{ fontSize: 12, color: '#8B6914' }}>Level {feature.level}</span>
                  )}
                  <span style={{ fontSize: 12, color: '#5A3E1B' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
                  <div style={{
                    padding: '0 16px 14px',
                    fontSize: 14, color: '#2D1B00',
                    lineHeight: 1.7,
                    borderTop: `1px solid ${color}33`,
                    background: '#F4E4BC',
                  }}>
                    {feature.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
