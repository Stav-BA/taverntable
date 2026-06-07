import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Isolated unit tests for dice logic — no DB / Redis needed
// ---------------------------------------------------------------------------

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function parseNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}

interface DieResult {
  die: number;
  roll: number;
}

function rollDice(count: number, sides: number, modifier: number): {
  notation: string;
  dice: DieResult[];
  modifier: number;
  total: number;
} {
  const dice: DieResult[] = [];
  for (let i = 0; i < count; i++) {
    dice.push({ die: sides, roll: Math.floor(Math.random() * sides) + 1 });
  }
  const diceSum = dice.reduce((acc, d) => acc + d.roll, 0);
  const total = diceSum + modifier;
  const notation = `${count}d${sides}${modifier > 0 ? '+' + modifier : modifier < 0 ? modifier : ''}`;
  return { notation, dice, modifier, total };
}

describe('Session code generation', () => {
  it('generates a 6-character code', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  it('only uses allowed characters', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      for (const char of code) {
        expect(CODE_CHARS).toContain(char);
      }
    }
  });

  it('never contains ambiguous characters', () => {
    const ambiguous = ['0', 'O', '1', 'I', 'L'];
    for (let i = 0; i < 200; i++) {
      const code = generateCode();
      for (const bad of ambiguous) {
        expect(code).not.toContain(bad);
      }
    }
  });
});

describe('Dice notation parser', () => {
  it('parses "1d20"', () => {
    const result = parseNotation('1d20');
    expect(result).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  it('parses "2d6+3"', () => {
    const result = parseNotation('2d6+3');
    expect(result).toEqual({ count: 2, sides: 6, modifier: 3 });
  });

  it('parses "4d4-1"', () => {
    const result = parseNotation('4d4-1');
    expect(result).toEqual({ count: 4, sides: 4, modifier: -1 });
  });

  it('returns null for invalid notation', () => {
    expect(parseNotation('abc')).toBeNull();
    expect(parseNotation('d20')).toBeNull();
    expect(parseNotation('2d')).toBeNull();
    expect(parseNotation('')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(parseNotation('2D6')).toEqual({ count: 2, sides: 6, modifier: 0 });
  });
});

describe('Dice roller', () => {
  it('rolls the correct number of dice', () => {
    const result = rollDice(3, 6, 0);
    expect(result.dice).toHaveLength(3);
  });

  it('each die roll is within valid range', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollDice(1, 20, 0);
      expect(result.dice[0].roll).toBeGreaterThanOrEqual(1);
      expect(result.dice[0].roll).toBeLessThanOrEqual(20);
    }
  });

  it('applies modifier correctly', () => {
    // Mock Math.random to always return 0.5 → roll = floor(0.5 * 6) + 1 = 4
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = rollDice(2, 6, 3);
    // Each die: floor(0.5 * 6) + 1 = 4 → sum = 8 + 3 = 11
    expect(result.total).toBe(11);
    spy.mockRestore();
  });

  it('total equals sum of dice plus modifier', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollDice(4, 6, 2);
      const expected = result.dice.reduce((acc, d) => acc + d.roll, 0) + 2;
      expect(result.total).toBe(expected);
    }
  });

  it('formats notation correctly with positive modifier', () => {
    const result = rollDice(1, 20, 5);
    expect(result.notation).toBe('1d20+5');
  });

  it('formats notation correctly with negative modifier', () => {
    const result = rollDice(2, 6, -2);
    expect(result.notation).toBe('2d6-2');
  });

  it('formats notation correctly with no modifier', () => {
    const result = rollDice(1, 8, 0);
    expect(result.notation).toBe('1d8');
  });
});
