/**
 * Test script for TMDB API client
 * Run with: npx ts-node test-tmdb.ts
 */

import { tmdb } from './lib/tmdb';

async function testTMDB() {
  console.log('🎬 Testing TMDB API Client...\n');

  try {
    // Test 1: Fetch trending movies
    console.log('📊 Fetching trending movies...');
    const trending = await tmdb.getTrendingMovies('week');
    console.log(`✅ Success! Loaded ${trending.length} trending movies\n`);

    // Display first 5 movies
    console.log('🎥 Top 5 Trending Movies:');
    trending.slice(0, 5).forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
      console.log(`   ⭐ ${movie.vote_average.toFixed(1)} | 📊 Popularity: ${movie.popularity.toFixed(0)}`);
      console.log(`   Poster: ${tmdb.getPosterUrl(movie.poster_path, 'small')}`);
      console.log('');
    });

    // Test 2: Get movie details for the first trending movie
    if (trending.length > 0) {
      const firstMovie = trending[0];
      console.log(`📝 Fetching details for: ${firstMovie.title}...`);
      const details = await tmdb.getMovieDetails(firstMovie.id);
      console.log(`✅ Success!`);
      console.log(`   Runtime: ${details.runtime} minutes`);
      console.log(`   Genres: ${details.genres.map(g => g.name).join(', ')}`);
      console.log(`   Tagline: ${details.tagline || 'N/A'}`);
      console.log('');

      // Test 3: Get watch providers
      console.log(`🎮 Fetching streaming providers...`);
      const providers = await tmdb.getWatchProviders(firstMovie.id);
      const usProviders = providers['US'];
      if (usProviders) {
        console.log(`✅ Success!`);
        if (usProviders.flatrate) {
          console.log(`   Streaming: ${usProviders.flatrate.map(p => p.provider_name).join(', ')}`);
        }
        if (usProviders.rent) {
          console.log(`   Rent: ${usProviders.rent.map(p => p.provider_name).join(', ')}`);
        }
      } else {
        console.log(`   No US providers found`);
      }
      console.log('');
    }

    // Test 4: Search for a movie
    console.log('🔍 Searching for "Inception"...');
    const searchResults = await tmdb.searchMovies('Inception');
    console.log(`✅ Success! Found ${searchResults.length} results`);
    if (searchResults.length > 0) {
      const inception = searchResults[0];
      console.log(`   Top result: ${inception.title} (${inception.release_date?.substring(0, 4)})`);
      console.log(`   Rating: ⭐ ${inception.vote_average.toFixed(1)}`);
    }
    console.log('');

    console.log('🎉 All tests passed! TMDB API client is working correctly.');
  } catch (error) {
    console.error('❌ Error testing TMDB API:', error);
    process.exit(1);
  }
}

testTMDB();
