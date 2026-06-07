/**
 * FeaturesTab — wrapper
 */

import React from 'react';
import type { Character } from '../../types';
import FeaturesList from './FeaturesList';

interface FeaturesTabProps { character: Character; }

export default function FeaturesTab({ character }: FeaturesTabProps) {
  return <FeaturesList character={character} />;
}
