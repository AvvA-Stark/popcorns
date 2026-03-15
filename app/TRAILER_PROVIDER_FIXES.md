# Trailer & Provider Links - Bug Fixes

**Status:** ✅ Fixed, Committed & Pushed  
**Commit:** `dd0503c`  
**Date:** March 15, 2026

---

## What Was Fixed

### 1️⃣ Trailer Modal Issues

**Problems:**
- Using wrong YouTube URL format (watch URL instead of embed)
- Missing WebView configuration props
- No user-friendly error handling
- No loading indicator during video load

**Solutions:**
✅ Changed URL format to: `https://www.youtube.com/embed/${videoKey}?autoplay=1&playsinline=1`  
✅ Added WebView props:
   - `originWhitelist={['*']}`
   - `startInLoadingState={true}`
   - `allowsFullscreenVideo={true}`
   - `allowsInlineMediaPlayback={true}`
   - `mediaPlaybackRequiresUserAction={false}`

✅ Added error handling:
   - `Alert.alert('Error', 'Could not load trailer')` on WebView error
   - Automatic fallback to open YouTube app if embed fails
   - Proper error logging

✅ Loading indicator shows while trailer loads

---

### 2️⃣ Provider Link Issues

**Problems:**
- No way to debug which provider names TMDB is sending
- Missing URL validation before attempting to open
- Limited provider coverage (only 10 providers)
- No fallback mechanism if provider URL fails

**Solutions:**
✅ Added debug logging: `console.log('Provider pressed:', provider.provider_name)`  
   - Run the app, press a provider logo, check console to see exact name

✅ Added `canOpenURL` check before opening:
   ```typescript
   const canOpen = await Linking.canOpenURL(homepageUrl);
   if (canOpen) {
     // Open URL
   } else {
     // Fallback to JustWatch
   }
   ```

✅ Expanded provider mapping from 10 to **30+ streaming services**:
   - **Majors:** Netflix, Prime Video, Disney+, HBO Max, Hulu, Apple TV+
   - **Cable/Live:** Paramount+, Peacock, Showtime, Starz, FuboTV, Sling TV
   - **Specialty:** AMC+, Discovery+, ESPN+, Crunchyroll
   - **Free:** Tubi TV, Pluto TV, The Roku Channel, Plex
   - **Niche:** Shudder, Criterion Channel, MUBI
   - **Rental:** YouTube Premium, Google Play Movies, Vudu

✅ Fallback to JustWatch if:
   - Provider not in our mapping
   - URL cannot be opened

---

## How to Test

### Testing Trailer Modal

1. **Find a movie with a trailer:**
   - Open the app
   - Search for a popular movie (e.g., "Dune", "Oppenheimer", "Barbie")
   - Tap on the movie card

2. **Play the trailer:**
   - Scroll down to the "Trailer" section
   - Tap "▶️ Watch Trailer"
   - **Expected:** Modal opens, YouTube video loads and plays automatically

3. **Test fullscreen:**
   - Tap the fullscreen button in the video player
   - **Expected:** Video goes fullscreen, controls work properly

4. **Test close:**
   - Tap the ✕ button in top-right corner
   - **Expected:** Modal closes, back to movie details

5. **Test error handling:**
   - Turn off Wi-Fi/data temporarily
   - Try to play a trailer
   - **Expected:** Error alert shows, then tries to open YouTube app

---

### Testing Provider Links

1. **Check which providers are available:**
   - Open any movie detail page
   - Scroll to "Where to Watch" section
   - Note which provider logos are shown

2. **Test provider homepage links:**
   - Tap on a provider logo (e.g., Netflix, Prime Video)
   - **Expected:** Browser/app opens to the provider's homepage (NOT a search)

3. **Debug provider names:**
   - Open the console/logs while testing
   - Tap different provider logos
   - **Look for:** `Provider pressed: Netflix` (or similar)
   - **Check:** Does the logged name match our `PROVIDER_HOMEPAGE_URLS` keys?

4. **Test fallback:**
   - If you see a provider not opening correctly, check logs
   - **Should see:** Warning about missing mapping or URL failure
   - **Should happen:** JustWatch search opens as fallback

5. **Test various providers:**
   - Netflix → should open https://www.netflix.com/
   - Prime Video → should open https://www.primevideo.com/
   - Disney+ → should open https://www.disneyplus.com/
   - HBO Max / Max → should open https://www.max.com/
   - etc.

---

## Developer Notes

### Adding New Providers

If you encounter a provider that's not in the mapping:

1. **Check the console log** when tapping the provider logo:
   ```
   Provider pressed: Some New Service
   ```

2. **Add to PROVIDER_HOMEPAGE_URLS** in `app/movie/[id].tsx`:
   ```typescript
   const PROVIDER_HOMEPAGE_URLS: Record<string, string> = {
     // ... existing providers ...
     'Some New Service': 'https://www.somenewservice.com/',
   };
   ```

3. **Important:** Provider names are **case-sensitive** and must match TMDB exactly!

---

## Expected Console Output

When testing, you should see logs like:

```
Provider pressed: Netflix
Provider pressed: Amazon Prime Video
Provider pressed: Disney Plus
```

If a provider is missing:
```
No homepage URL configured for provider: SomeService
```

If URL validation fails:
```
Cannot open URL for Netflix: https://www.netflix.com/
```

---

## Known Limitations

- **Region-specific availability:** Providers shown depend on `region` setting in app
- **TMDB provider names:** We rely on TMDB's exact naming, which can vary
- **iOS vs Android:** Some URLs may behave differently across platforms
- **Deep links:** We open homepages, not direct movie links (would need provider-specific APIs)

---

## Files Changed

- `app/movie/[id].tsx` - Main movie detail screen with all fixes

---

## Next Steps

1. **Test on physical device** (trailer playback is best tested on real hardware)
2. **Monitor console logs** during testing to catch any unmapped providers
3. **Update provider mapping** as needed based on real usage data
4. **Consider provider deep links** in future (requires API integrations)

---

**Questions?** Check the commit diff or ping Ava for clarification! 🎬
