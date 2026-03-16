# Swipe Tutorial Animation

## Overview
First-run animated overlay that demonstrates swipe gestures to new users of the Discovery screen.

## Implementation

### Component: `SwipeTutorialOverlay.tsx`
Location: `components/SwipeTutorialOverlay.tsx`

### Features
- ✅ **First-run only**: Shows once per install using AsyncStorage flag
- ✅ **Smooth animations**: Built with React Native Reanimated
- ✅ **Gesture demonstration**: Shows left swipe (NOPE), right swipe (LIKE), and up swipe (SUPER LIKE)
- ✅ **Non-intrusive**: Can be dismissed early by tapping anywhere
- ✅ **Optimal duration**: ~2.5 seconds total animation time

### Animation Sequence

1. **Fade In** (0-0.2s)
   - Dark overlay appears
   - Title "How to Swipe" displays

2. **Cards Slide Up** (0.2-0.7s)
   - Stack of 3 mini cards slides up from bottom
   - Cards arranged in stacked perspective view

3. **Left Swipe Demo** (0.8-1.2s)
   - First card swipes left with rotation
   - "NOPE" label appears
   - Card fades out

4. **Right Swipe Demo** (1.5-1.9s)
   - Second card swipes right with rotation
   - "LIKE" label appears
   - Card fades out

5. **Up Swipe Demo** (2.2-2.6s)
   - Third card swipes up
   - "SUPER LIKE" label appears
   - Card fades out

6. **Fade Out** (2.8-3.1s)
   - Overlay fades away
   - User can start swiping

### Integration

The overlay is integrated into the Discovery screen (`app/(tabs)/index.tsx`):

```tsx
import SwipeTutorialOverlay from '../../components/SwipeTutorialOverlay';

// ... component code ...

return (
  <View style={styles.container}>
    {/* ... existing UI ... */}
    
    {/* Tutorial Overlay - shows once on first run */}
    <SwipeTutorialOverlay />
  </View>
);
```

### Storage Key
- **Key**: `@popcorns_tutorial_shown`
- **Value**: `'true'` after first view
- **Storage**: AsyncStorage (persists across app restarts)

### Early Dismissal
Users can tap anywhere on the overlay to skip the tutorial immediately.

### Testing
To reset and view the tutorial again during development:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear the tutorial flag
await AsyncStorage.removeItem('@popcorns_tutorial_shown');

// Then restart the app or navigate to Discovery screen
```

### Design Decisions

1. **Smaller Cards**: Tutorial cards are 35% of screen width (vs 90% for actual swipe cards) to clearly indicate it's a demonstration

2. **Dark Overlay**: 92% opacity black background ensures focus on the tutorial, not distracting from actual content

3. **Sequential Animation**: Each gesture is shown one at a time rather than simultaneously to avoid confusion

4. **Automatic Completion**: No button press required - tutorial auto-completes to reduce friction

5. **Tap to Skip**: Power users can dismiss immediately without waiting

## Performance
- Minimal bundle impact (~300 lines)
- Uses hardware-accelerated animations via Reanimated
- No network requests
- Single AsyncStorage check on mount

## Future Enhancements
Potential improvements for future iterations:

- [ ] Add option to replay tutorial from settings
- [ ] Localization support for multiple languages
- [ ] A/B test different animation speeds
- [ ] Track completion vs skip rate
