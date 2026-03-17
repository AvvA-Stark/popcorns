#!/usr/bin/env node

/**
 * Generate synthetic movie reviews for seed data
 * 
 * Usage: node scripts/generate-reviews.js
 * Output: data/movie_reviews.json
 */

const fs = require('fs');
const path = require('path');

// Pool of review snippets
const reviewSnippets = [
  "Absolutely loved it! A masterpiece.",
  "Great storytelling and cinematography.",
  "One of the best films I've seen this year.",
  "Incredible performances all around.",
  "Visually stunning and emotionally powerful.",
  "A must-watch for any movie lover.",
  "The plot twists kept me on the edge of my seat.",
  "Amazing direction and perfect pacing.",
  "The cast chemistry was perfect.",
  "Beautifully shot, captivating story.",
  "Exceeded all my expectations!",
  "A rollercoaster of emotions.",
  "Brilliantly executed from start to finish.",
  "The soundtrack alone is worth it.",
  "I'll be thinking about this one for a while.",
  "Pure entertainment from beginning to end.",
  "The special effects were mind-blowing.",
  "A perfect blend of action and drama.",
  "Heartwarming and beautifully crafted.",
  "Couldn't take my eyes off the screen.",
  "A cinematic triumph!",
  "Solid performances and great writing.",
  "Everything I wanted and more.",
  "An instant classic in my book.",
  "The perfect movie for a night in.",
  "Loved every minute of it!",
  "Powerful storytelling at its finest.",
  "A visual feast with substance.",
  "The director nailed it.",
  "One of those rare perfect films.",
  "Pretty good overall, worth watching.",
  "Enjoyed it more than I expected.",
  "Some great moments throughout.",
  "A solid entry in the genre.",
  "Well-made with a few standout scenes.",
  "Entertaining despite minor flaws.",
  "Good but not great.",
  "Decent watch, has its moments.",
  "Worth a viewing if you're a fan.",
  "Not bad, pretty enjoyable.",
  "Had potential but fell a bit short.",
  "Watchable but forgettable.",
  "It was okay, nothing special.",
  "Mixed feelings but decent overall.",
  "Could have been better but still fun."
];

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random date within the last 90 days
 */
function randomDate() {
  const now = new Date();
  const daysAgo = randomInt(0, 90);
  const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return date.toISOString();
}

/**
 * Generate a random author name
 */
function randomAuthor() {
  const num = randomInt(100, 999);
  return `User${num}`;
}

/**
 * Generate a single review
 */
function generateReview() {
  return {
    author: randomAuthor(),
    rating: randomInt(4, 10),
    text: reviewSnippets[randomInt(0, reviewSnippets.length - 1)],
    created_at: randomDate()
  };
}

/**
 * Main function
 */
function main() {
  const projectRoot = path.join(__dirname, '..');
  const moviesPath = path.join(projectRoot, 'data', 'popular-movies.json');
  const outputPath = path.join(projectRoot, 'data', 'movie_reviews.json');

  // Read movie IDs
  if (!fs.existsSync(moviesPath)) {
    console.error(`Error: ${moviesPath} not found`);
    process.exit(1);
  }

  const movieIds = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));
  console.log(`Generating reviews for ${movieIds.length} movies...`);

  // Generate reviews
  const reviews = {};
  movieIds.forEach(movieId => {
    reviews[`movie_id_${movieId}`] = [
      generateReview(),
      generateReview(),
      generateReview()
    ];
  });

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(reviews, null, 2), 'utf8');
  
  const stats = {
    movies: movieIds.length,
    reviews: movieIds.length * 3,
    fileSize: (fs.statSync(outputPath).size / 1024).toFixed(2) + ' KB'
  };

  console.log('✅ Reviews generated successfully!');
  console.log(`   Movies: ${stats.movies}`);
  console.log(`   Reviews: ${stats.reviews}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   File size: ${stats.fileSize}`);
}

// Run
main();
