# Oscar Winners Dataset

## Overview
This dataset contains Oscar (Academy Award) wins and nominations for 52 well-known films, mapped by TMDB ID.

## File Structure
- **Location:** `data/oscar_winners.json`
- **Format:** JSON object where keys are TMDB IDs (as strings)
- **Size:** ~30KB, 52 movies

## Data Structure
```json
{
  "<tmdbId>": {
    "wins": [
      {
        "category": "Best Picture",
        "year": 2024
      }
    ],
    "nominations": [
      {
        "category": "Best Actor",
        "year": 2024
      }
    ],
    "note": "Optional movie title for reference"
  }
}
```

## Coverage
- **Recent winners:** Oppenheimer (2024), Everything Everywhere All at Once (2023), CODA (2022), etc.
- **Classics:** The Godfather, Pulp Fiction, Schindler's List, Titanic, etc.
- **Animated:** Inside Out, Coco, Soul, Encanto, etc.
- **Years covered:** 1973-2024

## Usage
The `fetchMovieAwards(movieId)` method in `lib/tmdb.ts` automatically:
1. Checks AsyncStorage cache first (30-day TTL)
2. Loads this JSON file if cache miss
3. Returns awards for the movie (or empty arrays if not found)
4. Caches the result

## Integration
- **UI:** Trophy icon (🏆) appears on movie cards when awards exist
- **Detail view:** Awards section shows wins and nominations
- **Caching:** AsyncStorage prevents repeated file reads
- **Performance:** No API calls needed - instant local lookup

## Expansion
To add more movies:
1. Find the movie's TMDB ID
2. Look up its Oscar wins/nominations
3. Add entry to `oscar_winners.json` following the structure
4. Clear the AsyncStorage cache or wait for expiry

## Notes
- Dataset intentionally limited to ~50 films (covers most popular movies)
- Movies without entries show no trophy icon (expected behavior)
- Could be expanded via script or manual curation
- TMDB IDs must match exactly (check TMDB.org)

## Examples in Dataset
- **Oppenheimer** (577922): 7 wins, 6 nominations
- **Parasite** (496243): 4 wins (including Best Picture), 2 nominations
- **The Godfather** (238): 3 wins, 6 nominations
- **Titanic** (197): 11 wins, 3 nominations
- **The Shawshank Redemption** (278): 0 wins, 7 nominations

---
*Last updated: March 2026*
