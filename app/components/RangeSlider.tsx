/**
 * RangeSlider Component
 * Dual-thumb range slider using two overlapping sliders
 */

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
  const handleFromChange = (value: number) => {
    // Ensure 'from' doesn't exceed 'to'
    if (value <= toValue) {
      onFromChange(value);
    }
  };

  const handleToChange = (value: number) => {
    // Ensure 'to' doesn't go below 'from'
    if (value >= fromValue) {
      onToChange(value);
    }
  };

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

        {/* 'From' slider (rendered first, on bottom layer) */}
        <Slider
          style={[styles.slider, styles.sliderBottom]}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={fromValue}
          onValueChange={handleFromChange}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor={maximumTrackTintColor}
          thumbTintColor={thumbTintColor}
        />

        {/* 'To' slider (rendered second, on top layer) */}
        <Slider
          style={[styles.slider, styles.sliderTop]}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={toValue}
          onValueChange={handleToChange}
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
    height: 40,
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
    height: 40,
  },
  sliderBottom: {
    zIndex: 1,
  },
  sliderTop: {
    zIndex: 2,
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
