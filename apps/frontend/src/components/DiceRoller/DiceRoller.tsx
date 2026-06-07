import { useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit } from '@/lib/socket';
import RollResult from './RollResult';
import type { DiceRollResult } from '@/stores/gameStore';

const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
type DieType = (typeof DICE_TYPES)[number];

interface DiceSelection {
  die: DieType;
  count: number;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function parseSides(die: DieType): number {
  return parseInt(die.slice(1));
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function DiceRoller() {
  const [selections, setSelections] = useState<DiceSelection[]>([]);
  const [modifier, setModifier] = useState(0);
  const [currentResult, setCurrentResult] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const addDiceRoll = useGameStore((s) => s.addDiceRoll);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);

  const addDie = (die: DieType) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.die === die);
      if (existing) {
        return prev.map((s) => s.die === die ? { ...s, count: s.count + 1 } : s);
      }
      return [...prev, { die, count: 1 }];
    });
  };

  const removeDie = (die: DieType) => {
    setSelections((prev) => {
      const existing = prev.find((s) => s.die === die);
      if (!existing) return prev;
      if (existing.count <= 1) return prev.filter((s) => s.die !== die);
      return prev.map((s) => s.die === die ? { ...s, count: s.count - 1 } : s);
    });
  };

  const clearDice = () => {
    setSelections([]);
    setModifier(0);
  };

  const expressionString = () => {
    const diceParts = selections.map((s) => `${s.count}${s.die}`).join('+');
    if (!diceParts) return '';
    if (modifier === 0) return diceParts;
    return `${diceParts}${modifier > 0 ? '+' : ''}${modifier}`;
  };

  const handleRoll = useCallback(() => {
    if (selections.length === 0 || isRolling || !player) return;

    setIsRolling(true);

    // Compute rolls client-side (server validates/broadcasts)
    const rolls = selections.map((s) => ({
      die: s.die,
      results: Array.from({ length: s.count }, () => rollDie(parseSides(s.die))),
    }));

    const total =
      rolls.reduce((sum, r) => sum + r.results.reduce((s, v) => s + v, 0), 0) + modifier;

    const result: DiceRollResult = {
      id: generateId(),
      playerId: player.id,
      playerName: player.name,
      expression: expressionString(),
      rolls,
      modifier,
      total,
      timestamp: Date.now(),
    };

    // Emit to server
    socketEmit.diceRoll(result.expression, result.modifier, result.id);

    // Optimistically show result
    addDiceRoll(result);
    addChatMessage({
      id: `roll-${result.id}`,
      type: 'roll',
      playerId: player.id,
      playerName: player.name,
      text: `rolled ${result.expression}: **${result.total}**`,
      rollResult: result,
      timestamp: result.timestamp,
    });

    setTimeout(() => {
      setCurrentResult(result);
      setIsRolling(false);
    }, 300);
  }, [selections, modifier, isRolling, player, addDiceRoll, addChatMessage]);

  const expression = expressionString();

  return (
    <>
      {/* Roll result popup */}
      <RollResult result={currentResult} onDismiss={() => setCurrentResult(null)} />

      <div
        className="flex items-center gap-2 px-3 py-2 h-full"
        style={{ background: 'rgba(45,27,0,0.6)', borderTop: '1px solid rgba(201,162,39,0.3)' }}
      >
        {/* Dice buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          {DICE_TYPES.map((die) => {
            const sel = selections.find((s) => s.die === die);
            return (
              <div key={die} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => addDie(die)}
                  onContextMenu={(e) => { e.preventDefault(); removeDie(die); }}
                  title={`Click: add ${die}, Right-click: remove`}
                  className="dice-face"
                  style={{
                    width: 40,
                    height: 40,
                    fontSize: '0.65rem',
                    borderRadius: 4,
                    position: 'relative',
                    borderColor: sel ? '#c9a227' : undefined,
                    boxShadow: sel ? '0 0 8px rgba(201,162,39,0.5)' : undefined,
                  }}
                >
                  {sel && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full font-cinzel font-bold text-xs flex items-center justify-center"
                      style={{ background: '#c9a227', color: '#2d1b00', lineHeight: 1 }}
                    >
                      {sel.count}
                    </span>
                  )}
                  {die}
                </button>
              </div>
            );
          })}
        </div>

        {/* Modifier */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setModifier((m) => m - 1)}
            className="w-6 h-6 font-cinzel font-bold text-sm flex items-center justify-center"
            style={{
              background: 'rgba(139,26,26,0.5)',
              border: '1px solid rgba(139,26,26,0.8)',
              color: '#f4e4bc',
              cursor: 'pointer',
            }}
          >
            -
          </button>
          <div
            className="font-cinzel text-sm font-bold px-2 py-0.5"
            style={{
              background: 'rgba(45,27,0,0.5)',
              border: '1px solid rgba(201,162,39,0.3)',
              color: modifier > 0 ? '#2d8a2d' : modifier < 0 ? '#8b1a1a' : 'rgba(244,228,188,0.6)',
              minWidth: 32,
              textAlign: 'center',
            }}
          >
            {modifier >= 0 ? `+${modifier}` : modifier}
          </div>
          <button
            onClick={() => setModifier((m) => m + 1)}
            className="w-6 h-6 font-cinzel font-bold text-sm flex items-center justify-center"
            style={{
              background: 'rgba(45,80,22,0.5)',
              border: '1px solid rgba(45,80,22,0.8)',
              color: '#f4e4bc',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>

        {/* Expression display */}
        <div
          className="flex-1 font-cinzel text-xs text-center hidden sm:block"
          style={{ color: expression ? '#c9a227' : 'rgba(244,228,188,0.3)' }}
        >
          {expression || 'Select dice to roll'}
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-shrink-0">
          {selections.length > 0 && (
            <button
              onClick={clearDice}
              className="font-cinzel text-xs px-2 py-2"
              style={{
                background: 'transparent',
                border: '1px solid rgba(139,26,26,0.5)',
                color: 'rgba(244,228,188,0.5)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
          <button
            onClick={handleRoll}
            disabled={selections.length === 0 || isRolling}
            className="font-cinzel font-bold text-sm px-4 py-2 uppercase tracking-wider"
            style={{
              background:
                selections.length > 0 && !isRolling
                  ? 'linear-gradient(135deg, #c9a227 0%, #a8831a 100%)'
                  : 'rgba(201,162,39,0.2)',
              color:
                selections.length > 0 && !isRolling ? '#2d1b00' : 'rgba(201,162,39,0.4)',
              border: '2px solid rgba(201,162,39,0.5)',
              cursor: selections.length > 0 && !isRolling ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
              animation: isRolling ? 'diceRoll 0.4s ease-in-out' : 'none',
            }}
          >
            {isRolling ? '🎲' : '🎲 Roll!'}
          </button>
        </div>
      </div>
    </>
  );
}
