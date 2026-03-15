/**
 * App configuration constants
 */

export const Config = {
  // TMDB API
  tmdb: {
    apiKey: '0f70669d098d1035815e7617d15a206c',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    posterSizes: {
      small: 'w342',
      medium: 'w500',
      large: 'w780',
      original: 'original',
    },
    backdropSizes: {
      small: 'w300',
      medium: 'w780',
      large: 'w1280',
      original: 'original',
    },
  },
  
  // Supabase (to be configured)
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // App settings
  app: {
    cardsToPreload: 10,
    swipeThreshold: 120,
    swipeVelocityThreshold: 0.5,
  },
};
