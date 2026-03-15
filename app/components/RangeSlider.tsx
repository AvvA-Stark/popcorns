/**
 * RangeSlider Component
 * Dual-thumb range slider using two overlapping sliders with proper gesture handling
 */

import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/Colors';

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  fromValue: number;
  toValue: number;
  step?: number;
  onFromChange: (value: number) => void;
  onToChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

export default function RangeSlider({
  minValue,
  maxValue,
  fromValue,
  toValue,
  step = 1,
  onFromChange,
  onToChange,
  minimumTrackTintColor = Colors.primary,
  maximumTrackTintColor = '#333333',
  thumbTintColor = Colors.primary,
}: RangeSliderProps) {
  // Track which thumb is being dragged (null = neither)
  const [activeThumb, setActiveThumb] = useState<'from' | 'to' | null>(null);

  const handleFromChange = (value: number) => {
    console.log('📍 FROM thumb moved:', value);
    // Ensure 'from' doesn't exceed 'to'
    const clampedValue = Math.min(value, toValue);
    onFromChange(clampedValue);
  };

  const handleToChange = (value: number) => {
    console.log('📍 TO thumb moved:', value);
    // Ensure 'to' doesn't go below 'from'
    const clampedValue = Math.max(value, fromValue);
    onToChange(clampedValue);
  };

  const handleFromStart = () => {
    console.log('🎯 FROM thumb grab started');
    setActiveThumb('from');
  };

  const handleToStart = () => {
    console.log('🎯 TO thumb grab started');
    setActiveThumb('to');
  };

  const handleEnd = () => {
    console.log('🎯 Thumb released');
    setActiveThumb(null);
  };

  // Dynamically adjust z-index based on which thumb is active
  const fromZIndex = activeThumb === 'from' ? 3 : 1;
  const toZIndex = activeThumb === 'to' ? 3 : 2;

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        {/* Track overlay to show the selected range */}
        <View style={styles.trackOverlay}>
          <View
            style={[
              styles.selectedRange,
              {
                left: `${((fromValue - minValue) / (maxValue - minValue)) * 100}%`,
                right: `${((maxValue - toValue) / (maxValue - minValue)) * 100}%`,
                backgroundColor: minimumTrackTintColor,
              },
            ]}
          />
        </View>

        {/* 'From' slider - z-index increases when dragging */}
        <Slider
          style={[styles.slider, { zIndex: fromZIndex, pointerEvents: activeThumb === 'to' ? 'none' : 'auto' }]}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={fromValue}
          onValueChange={handleFromChange}
          onSlidingStart={handleFromStart}
          onSlidingComplete={handleEnd}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor={maximumTrackTintColor}
          thumbTintColor={thumbTintColor}
        />

        {/* 'To' slider - z-index increases when dragging */}
        <Slider
          style={[styles.slider, { zIndex: toZIndex, pointerEvents: activeThumb === 'from' ? 'none' : 'auto' }]}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={toValue}
          onValueChange={handleToChange}
          onSlidingStart={handleToStart}
          onSlidingComplete={handleEnd}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor={thumbTintColor}
        />
      </View>

      <View style={styles.labelsContainer}>
        <Text style={styles.label}>{fromValue}</Text>
        <Text style={styles.label}>—</Text>
        <Text style={styles.label}>{toValue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sliderContainer: {
    position: 'relative',
    height: 50,
    justifyContent: 'center',
  },
  trackOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    alignSelf: 'center',
    zIndex: 0,
  },
  selectedRange: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  slider: {
    position: 'absolute',
    width: '100%',
    height: 50,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
});
