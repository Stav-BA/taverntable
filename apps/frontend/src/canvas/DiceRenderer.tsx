import { useState, useEffect, useRef } from 'react';
import type { DiceRollResult } from '@/stores/gameStore';

interface DiceRendererProps {
  result: DiceRollResult | null;
  onDismiss: () => void;
}

const DIE_FACES: Record<string, string[]> = {
  d4: ['▲', '▲', '▲', '▲'],
  d6: ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'],
  d8: ['◈', '◈', '◈', '◈', '◈', '◈', '◈', '◈'],
  d10: ['◇', '◇', '◇', '◇', '◇', '◇', '◇', '◇', '◇', '◇'],
  d12: ['⬡', '⬡', '⬡', '⬡', '⬡', '⬡', '⬡', '⬡', '⬡', '⬡', '⬡', '⬡'],
  d20: ['⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠', '⬠'],
  d100: ['◯'],
};

function DieBox({ die, results }: { die: string; results: number[] }) {
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setRolling(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-cinzel text-xs text-gold uppercase tracking-wider"
        style={{ textShadow: '0 0 6px rgba(201,162,39,0.5)' }}
      >
        {die}
      </span>
      <div className="flex gap-1 flex-wrap justify-center">
        {results.map((val, i) => (
          <div
            key={i}
            className="dice-face"
            style={{
              width: 44,
              height: 44,
              fontSize: '1rem',
              borderRadius: 4,
              animation: rolling ? `diceRoll 0.6s ease-in-out ${i * 0.1}s` : 'none',
              color:
                val === parseInt(die.replace('d', '')) ? '#FFD700' : // max roll = gold
                val === 1 ? '#DC143C' : // min roll = red
                '#C9A227',
              boxShadow:
                val === parseInt(die.replace('d', ''))
                  ? '0 0 12px rgba(255,215,0,0.6)'
                  : val === 1
                  ? '0 0 12px rgba(220,20,60,0.5)'
                  : undefined,
            }}
          >
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiceRenderer({ result, onDismiss }: DiceRendererProps) {
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!result) return;
    dismissTimer.current = setTimeout(() => {
      onDismiss();
    }, 4000);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [result, onDismiss]);

  if (!result) return null;

  const isCrit = result.rolls.some(
    (r) => r.die === 'd20' && r.results.includes(20)
  );
  const isFumble = result.rolls.some(
    (r) => r.die === 'd20' && r.results.includes(1)
  );

  return (
    <div className="roll-result-popup" onClick={onDismiss}>
      <div
        className="parchment-panel rounded-sm p-5 max-w-sm min-w-[280px]"
        style={{
          boxShadow: isCrit
            ? '0 0 40px rgba(255,215,0,0.5), 0 8px 32px rgba(0,0,0,0.7)'
            : isFumble
            ? '0 0 40px rgba(220,20,60,0.4), 0 8px 32px rgba(0,0,0,0.7)'
            : '0 8px 32px rgba(0,0,0,0.7)',
          border: isCrit
            ? '3px solid #FFD700'
            : isFumble
            ? '3px solid #DC143C'
            : '2px solid #c9a227',
        }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <p className="font-cinzel font-bold text-dark-brown text-sm uppercase tracking-wider">
            {result.playerName}
          </p>
          <p className="font-crimson text-medium-brown text-sm">{result.expression}</p>
        </div>

        {/* Individual dice */}
        <div className="flex gap-3 justify-center flex-wrap mb-4">
          {result.rolls.map((roll, i) => (
            <DieBox key={i} die={roll.die} results={roll.results} />
          ))}
        </div>

        {/* Modifier */}
        {result.modifier !== 0 && (
          <p className="text-center font-crimson text-medium-brown text-sm mb-2">
            Modifier: {result.modifier > 0 ? '+' : ''}{result.modifier}
          </p>
        )}

        {/* Crit / Fumble banner */}
        {isCrit && (
          <div
            className="text-center font-cinzel font-black uppercase tracking-widest text-sm py-1 mb-3"
            style={{
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255,215,0,0.8)',
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)',
            }}
          >
            ⭐ CRITICAL HIT! ⭐
          </div>
        )}
        {isFumble && (
          <div
            className="text-center font-cinzel font-black uppercase tracking-widest text-sm py-1 mb-3"
            style={{
              color: '#DC143C',
              textShadow: '0 0 20px rgba(220,20,60,0.8)',
              background: 'rgba(220,20,60,0.1)',
              border: '1px solid rgba(220,20,60,0.3)',
            }}
          >
            💀 CRITICAL FUMBLE
          </div>
        )}

        {/* Total */}
        <div
          className="text-center font-cinzel font-black text-5xl"
          style={{
            color: isCrit ? '#FFD700' : isFumble ? '#DC143C' : '#2D1B00',
            textShadow: isCrit
              ? '0 0 20px rgba(255,215,0,0.6)'
              : '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {result.total}
        </div>

        <p className="text-center font-crimson text-medium-brown text-xs mt-2 opacity-60">
          Click to dismiss
        </p>
      </div>
    </div>
  );
}
