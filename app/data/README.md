# Synthetic Movie Reviews

This directory contains generated seed data for movie reviews.

## Files

- **`popular-movies.json`** - List of TMDB movie IDs to generate reviews for (currently 20 popular movies)
- **`movie_reviews.json`** - Generated synthetic reviews (3 per movie)

## Generating Reviews

To regenerate the reviews (or generate after adding more movies to `popular-movies.json`):

```bash
node scripts/generate-reviews.js
```

## Review Format

```json
{
  "movie_id_12345": [
    {
      "author": "User123",
      "rating": 8,
      "text": "Loved it!",
      "created_at": "2025-03-15T12:34:56Z"
    }
  ]
}
```

## Integration

In your movie detail screen (`app/movie/[id].tsx`), import and use the reviews:

```typescript
import movieReviews from '@/data/movie_reviews.json';

// In your component:
const syntheticReviews = movieReviews[`movie_id_${movieId}`] || [];
```

Merge these with any real user reviews from AsyncStorage for a complete reviews list.

## Customization

To add more movies:
1. Add TMDB IDs to `popular-movies.json`
2. Run `node scripts/generate-reviews.js`
3. Commit both files

To customize review content:
- Edit the `reviewSnippets` array in `scripts/generate-reviews.js`
- Adjust rating range (currently 4-10)
- Modify date range (currently last 90 days)

## File Size

Currently ~10 KB for 20 movies × 3 reviews. Can scale to 100s of movies without issues. If it grows beyond a few MB, consider adding `data/movie_reviews.json` to `.gitignore` and generating it as part of the build process.
