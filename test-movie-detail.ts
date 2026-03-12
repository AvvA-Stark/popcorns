/**
 * Test script for Phase 3 Movie Detail Modal
 * Tests new TMDB API methods: credits, videos, complete details
 */

import { tmdb } from './lib/tmdb';

const MOVIE_ID = 299536; // Avengers: Infinity War - good test case with lots of cast, trailers, providers

async function testMovieDetailAPIs() {
  console.log('🍿 Testing Movie Detail APIs (Phase 3)...\n');

  try {
    // Test 1: Get movie credits
    console.log('1️⃣ Testing getMovieCredits()...');
    const credits = await tmdb.getMovieCredits(MOVIE_ID);
    console.log(`✅ Found ${credits.cast.length} cast members`);
    console.log(`   Top 3 actors:`);
    credits.cast.slice(0, 3).forEach((actor) => {
      console.log(`   - ${actor.name} as ${actor.character}`);
    });
    console.log();

    // Test 2: Get videos
    console.log('2️⃣ Testing getVideos()...');
    const videos = await tmdb.getVideos(MOVIE_ID);
    console.log(`✅ Found ${videos.length} videos`);
    const trailer = tmdb.getYouTubeTrailer(videos);
    if (trailer) {
      console.log(`   Official Trailer: "${trailer.name}"`);
      console.log(`   YouTube URL: https://www.youtube.com/watch?v=${trailer.key}`);
    }
    console.log();

    // Test 3: Get watch providers
    console.log('3️⃣ Testing getWatchProviders()...');
    const providers = await tmdb.getWatchProviders(MOVIE_ID);
    const usProviders = providers['US'];
    if (usProviders?.flatrate) {
      console.log(`✅ Available on ${usProviders.flatrate.length} streaming services (US):`);
      usProviders.flatrate.forEach((provider) => {
        console.log(`   - ${provider.provider_name}`);
      });
    } else {
      console.log('   No streaming providers found for US');
    }
    console.log();

    // Test 4: Get complete movie details (the main method)
    console.log('4️⃣ Testing getMovieDetailsComplete()...');
    const completeDetails = await tmdb.getMovieDetailsComplete(MOVIE_ID);
    console.log(`✅ Complete details loaded:`);
    console.log(`   Title: ${completeDetails.title}`);
    console.log(`   Year: ${completeDetails.release_date?.split('-')[0]}`);
    console.log(`   Rating: ${completeDetails.vote_average.toFixed(1)} ⭐`);
    console.log(`   Runtime: ${completeDetails.runtime} minutes`);
    console.log(`   Genres: ${completeDetails.genres.map((g) => g.name).join(', ')}`);
    console.log(`   Cast: ${completeDetails.credits?.cast.length || 0} actors`);
    console.log(`   Videos: ${completeDetails.videos?.length || 0} trailers/clips`);
    console.log(`   Watch Providers: ${Object.keys(completeDetails.watchProviders || {}).length} countries`);
    console.log();

    // Test 5: Get profile URL
    console.log('5️⃣ Testing getProfileUrl()...');
    const firstActor = credits.cast[0];
    if (firstActor.profile_path) {
      const profileUrl = tmdb.getProfileUrl(firstActor.profile_path);
      console.log(`✅ Profile URL for ${firstActor.name}:`);
      console.log(`   ${profileUrl}`);
    }
    console.log();

    console.log('🎉 All Phase 3 API tests passed! Ready to build the modal UI.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testMovieDetailAPIs();
