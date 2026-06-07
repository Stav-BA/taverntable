import DiceRenderer from '@/canvas/DiceRenderer';
import type { DiceRollResult } from '@/stores/gameStore';

interface Props {
  result: DiceRollResult | null;
  onDismiss: () => void;
}

export default function RollResult({ result, onDismiss }: Props) {
  return <DiceRenderer result={result} onDismiss={onDismiss} />;
}
