# 🍿 Popcorns

A Tinder-style movie discovery app built with React Native and Expo.

Swipe through movies, build your watchlist, and discover where to stream your next favorite film.

## Tech Stack

- **React Native** + **Expo** (iOS primary, web secondary)
- **Expo Router** - File-based routing
- **TypeScript** - Type-safe development
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Swipe gestures
- **Supabase** - Backend (auth, database)
- **TMDB API** - Movie data & streaming availability

## Project Status

### ✅ Completed

- [x] Expo project initialization
- [x] Core dependencies installed
- [x] Project structure created
- [x] TMDB API client implemented & tested
  - Trending movies
  - Movie details
  - Search
  - Watch providers (streaming availability)
- [x] Color palette & configuration
- [x] Basic tab navigation (Discover, Watchlist, Profile)
- [x] Movie detail screen (placeholder)
- [x] Supabase client setup (skeleton)

### 🚧 In Progress / TODO

- [ ] **Swipe gestures** - Implement card swiping with react-native-gesture-handler
- [ ] **Animations** - Smooth card animations with react-native-reanimated
- [ ] **Supabase integration** - User authentication, watchlist, reviews
- [ ] **Movie card stack** - Visual card stack with proper z-indexing
- [ ] **Full movie details screen** - Complete implementation with streaming info
- [ ] **Watchlist persistence** - Save/load from Supabase
- [ ] **User profiles** - Authentication & user data
- [ ] **Reviews system** - Rating & reviewing movies
- [ ] **Filters** - Genre, year, rating filters for discovery
- [ ] **Search UI** - Movie search interface

## Project Structure

```
app/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Bottom tab navigation
│   │   ├── _layout.tsx      # Tab layout config
│   │   ├── index.tsx        # Discovery/Swipe screen ⭐
│   │   ├── watchlist.tsx    # User's saved movies
│   │   └── profile.tsx      # User profile & settings
│   ├── movie/
│   │   └── [id].tsx         # Movie detail screen (dynamic route)
│   └── _layout.tsx          # Root layout
├── components/
│   ├── MovieCard.tsx        # Swipeable movie card
│   └── SwipeStack.tsx       # Card stack manager (TODO)
├── lib/
│   ├── tmdb.ts             # TMDB API client ✅
│   └── supabase.ts         # Supabase client (skeleton)
├── constants/
│   ├── Colors.ts           # App color palette
│   └── Config.ts           # Configuration (API keys, etc.)
└── test-tmdb.ts            # TMDB API test script

```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for mobile testing)

### Installation

```bash
cd /data/.openclaw/workspace/projects/popcorns/app
npm install
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### Testing TMDB API

```bash
npx tsx test-tmdb.ts
```

## Configuration

### TMDB API

API key is already configured in `constants/Config.ts`:
- Key: `0f70669d098d1035815e7617d15a206c`
- No additional setup required ✅

### Supabase

To enable backend features:

1. Create a Supabase project at https://supabase.com
2. Create a `.env` file:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Implement authentication and database operations in `lib/supabase.ts`

## API Client Usage

### TMDB Client

```typescript
import { tmdb } from './lib/tmdb';

// Get trending movies
const movies = await tmdb.getTrendingMovies('week');

// Get movie details
const details = await tmdb.getMovieDetails(movieId);

// Search movies
const results = await tmdb.searchMovies('Inception');

// Get streaming providers
const providers = await tmdb.getWatchProviders(movieId);

// Get poster URL
const posterUrl = tmdb.getPosterUrl(movie.poster_path, 'large');
```

## Next Steps (Priority Order)

1. **Implement swipe gestures** - Core feature, highest priority
2. **Add card animations** - Make the experience smooth and delightful
3. **Supabase authentication** - Enable user accounts
4. **Watchlist functionality** - Let users save movies
5. **Complete movie details screen** - Show full info + streaming
6. **Polish UI/UX** - Refine animations, transitions, loading states

## Development Notes

- The project uses **Expo Router** for navigation (file-based routing)
- **TypeScript** is configured for type safety
- **Dark theme** is the default (defined in `constants/Colors.ts`)
- **TMDB API** has been tested and works correctly
- **Expo constants** are used for environment variables

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TMDB API Docs](https://developer.themoviedb.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)

---

**Built with ❤️ by Eva**
