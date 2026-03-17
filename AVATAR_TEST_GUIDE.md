# Avatar Feature Test Guide 🧪

## Quick Test Steps

### 1. Build & Run the App
```bash
cd projects/popcorns/app
npx expo start
```

### 2. Navigate to Profile Tab
- Open the app in Expo Go (or simulator)
- Tap the Profile tab (bottom navigation)

### 3. Test Avatar Upload
**Initial State:**
- ✅ Should see default 👤 icon in circular avatar
- ✅ Should see "📷 Change Photo" button
- ✅ Should NOT see "Remove" button (no avatar yet)

**Upload Flow:**
1. Tap the avatar OR "Change Photo" button
2. If prompted, grant photo library permission
3. Select an image from gallery
4. Crop/adjust image in 1:1 square if needed
5. Confirm selection

**Expected Result:**
- ✅ Avatar updates immediately with selected photo
- ✅ "Remove" button appears next to "Change Photo"
- ✅ Avatar maintains circular shape
- ✅ Image fits properly within circle

### 4. Test Persistence
1. Close the app completely (swipe away)
2. Reopen the app
3. Navigate to Profile tab

**Expected Result:**
- ✅ Custom avatar still displays (loaded from AsyncStorage)
- ✅ "Remove" button still visible

### 5. Test Avatar Removal
1. Tap "Remove" button
2. Confirm deletion in alert dialog

**Expected Result:**
- ✅ Avatar reverts to default 👤 icon
- ✅ "Remove" button disappears
- ✅ Only "Change Photo" button visible

### 6. Test Avatar Re-upload
1. Upload a different image
2. Verify it replaces the previous one

**Expected Result:**
- ✅ New avatar displays
- ✅ Old avatar is gone (replaced, not duplicated)

### 7. Test Permissions Denial
1. Clear app data/reinstall to reset permissions
2. Deny photo library access when prompted
3. Try to change avatar

**Expected Result:**
- ✅ Shows permission required alert
- ✅ Explains why permission is needed
- ✅ App doesn't crash

## Edge Cases to Check

### Empty State
- ✅ Fresh install shows default icon
- ✅ No errors in console

### Large Images
- ✅ High-resolution photos are compressed to 70% quality
- ✅ No memory issues or crashes
- ✅ Reasonable file size in AsyncStorage

### Image Aspect Ratios
- ✅ Portrait images crop properly
- ✅ Landscape images crop properly
- ✅ Square images display perfectly
- ✅ All maintain 1:1 circular appearance

### Rapid Actions
- ✅ Tapping avatar multiple times doesn't crash
- ✅ Changing avatar quickly works fine
- ✅ Remove → Upload → Remove sequence works

## Debugging

### Check AsyncStorage
```javascript
// In app console or debugger:
import AsyncStorage from '@react-native-async-storage/async-storage';

// View saved avatar
AsyncStorage.getItem('user_avatar').then(console.log);

// Clear saved avatar
AsyncStorage.removeItem('user_avatar').then(() => console.log('Cleared'));
```

### Common Issues

**Avatar doesn't load on restart:**
- Check AsyncStorage key is `user_avatar`
- Verify `loadAvatar()` is called in `useEffect` and `useFocusEffect`

**Image picker doesn't open:**
- Check permissions in device settings
- Ensure `expo-image-picker` is installed correctly

**Avatar appears distorted:**
- Verify `overflow: 'hidden'` on avatar container
- Check `borderRadius: 50` on avatarImage style

**App crashes on image selection:**
- Check base64 conversion is working
- Verify quality setting (0.7) is reasonable
- Test with smaller images first

## Success Criteria

All these should pass:
- ✅ Can select image from gallery
- ✅ Avatar displays immediately
- ✅ Avatar persists after app restart
- ✅ Can remove avatar
- ✅ Can change avatar multiple times
- ✅ Permissions handled gracefully
- ✅ No console errors
- ✅ UI looks good (circular, centered, proper sizing)
- ✅ Buttons appear/disappear correctly
- ✅ Works on both iOS and Android (if testing both)

## Next Steps (Future)

When ready to add cloud sync:
1. Upload base64 to Supabase Storage
2. Save URL in user profile
3. Sync across devices
4. Add loading states during upload
5. Handle upload errors gracefully

---

**Status**: Feature implemented and ready for testing! 🚀
