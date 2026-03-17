/**
 * Popcorn Rating Utility
 * Visualizes movie ratings as popcorn emojis
 */

import React from 'react';
import { View, Text } from 'react-native';

/**
 * Renders movie rating as popcorn emojis
 * @param rating - Movie rating (0-10 scale)
 * @returns React nodes with popcorn emojis
 * 
 * Rules:
 * - Rating >= 8.2 → 🍿🍿🍿 (3 full, solid)
 * - Rating 6.8-8.1 → 🍿🍿 (2 full, solid)
 * - Rating < 6.8 → 🍿🍿🍿 with last two having opacity 0.3 (dimmer)
 */
export const renderPopcornRating = (rating: number, size: number = 16): React.ReactElement => {
  const popcorns: React.ReactNode[] = [];

  if (rating >= 8.2) {
    // 3 full popcorns
    for (let i = 0; i < 3; i++) {
      popcorns.push(
        <Text key={i} style={{ fontSize: size, opacity: 1 }}>
          🍿
        </Text>
      );
    }
  } else if (rating >= 6.8) {
    // 2 full popcorns + 1 dimmed
    for (let i = 0; i < 2; i++) {
      popcorns.push(
        <Text key={i} style={{ fontSize: size, opacity: 1 }}>
          🍿
        </Text>
      );
    }
    popcorns.push(
      <Text key={2} style={{ fontSize: size, opacity: 0.3 }}>
        🍿
      </Text>
    );
  } else {
    // 1 full + 2 dimmed popcorns
    popcorns.push(
      <Text key={0} style={{ fontSize: size, opacity: 1 }}>
        🍿
      </Text>
    );
    for (let i = 1; i < 3; i++) {
      popcorns.push(
        <Text key={i} style={{ fontSize: size, opacity: 0.3 }}>
          🍿
        </Text>
      );
    }
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: -8 }}>
      {popcorns}
    </View>
  );
};
