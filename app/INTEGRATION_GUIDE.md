# Synthetic Reviews Integration Guide

## Overview

This guide explains how to integrate the synthetic movie reviews into the movie detail screen.

## Current State

The movie detail screen (`app/movie/[id].tsx`) currently:
- Loads user reviews from AsyncStorage (`@popcorns_reviews`)
- Shows "no reviews" when the array is empty
- Allows users to add their own reviews

## Integration Steps

### 1. Import the synthetic reviews

At the top of `app/movie/[id].tsx`, add:

```typescript
import movieReviews from '@/data/movie_reviews.json';
```

### 2. Update the review loading logic

Find the `loadReviews` function (around line 200) and modify it to merge synthetic + real reviews:

```typescript
const loadReviews = async () => {
  try {
    // Load real user reviews from AsyncStorage
    const reviewsJson = await AsyncStorage.getItem('@popcorns_reviews');
    let realReviews: UserReview[] = [];
    if (reviewsJson) {
      const allReviews: UserReview[] = JSON.parse(reviewsJson);
      realReviews = allReviews.filter(r => r.movieId === Number(id));
    }

    // Load synthetic reviews for this movie
    const syntheticKey = `movie_id_${id}`;
    const syntheticReviews = movieReviews[syntheticKey] || [];
    
    // Convert synthetic reviews to UserReview format
    const convertedSynthetic: UserReview[] = syntheticReviews.map(sr => ({
      movieId: Number(id),
      rating: sr.rating,
      text: sr.text,
      date: sr.created_at,
      author: sr.author, // Add this field to UserReview interface
      isSynthetic: true,  // Flag to differentiate
    }));

    // Merge: real reviews first, then synthetic
    const allReviews = [...realReviews, ...convertedSynthetic];
    setReviews(allReviews);
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
};
```

### 3. Update the UserReview interface

Modify the `UserReview` interface (around line 35):

```typescript
interface UserReview {
  movieId: number;
  rating: number; // 1-10
  text: string;
  date: string;
  author?: string;      // Add this
  isSynthetic?: boolean; // Add this
}
```

### 4. (Optional) Display synthetic review differently

In the review display section (around line 669), you can add visual distinction:

```typescript
{reviews.map((review, index) => (
  <View key={index} style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      {renderStars(review.rating, 14)}
      <Text style={styles.reviewRating}>{review.rating}/10</Text>
      <Text style={styles.reviewDate}>
        {new Date(review.date).toLocaleDateString()}
      </Text>
      {review.isSynthetic && (
        <Text style={styles.syntheticBadge}>Seed</Text>
      )}
    </View>
    {review.author && !review.isSynthetic && (
      <Text style={styles.reviewAuthor}>{review.author}</Text>
    )}
    {review.text && (
      <Text style={styles.reviewText}>{review.text}</Text>
    )}
  </View>
))}
```

### 5. (Optional) Add badge styling

```typescript
syntheticBadge: {
  backgroundColor: Colors.accent + '40',
  color: Colors.accent,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  fontSize: 10,
  fontWeight: '600',
  marginLeft: 8,
},
```

## Simpler Approach (MVP)

If you want to keep it simple for MVP:

1. Just merge the reviews without any badges
2. Don't differentiate between synthetic and real
3. Synthetic reviews will seed the "empty state" until real users add their own

This gives immediate content without UI complexity.

## Testing

1. Clear AsyncStorage reviews: Delete app or clear storage
2. Open any movie from `popular-movies.json`
3. Should see 3 synthetic reviews
4. Add your own review
5. Should see your review + synthetic ones

## Expanding the Dataset

To add more movies:
```bash
# Edit data/popular-movies.json, add more TMDB IDs
node scripts/generate-reviews.js
```

Current dataset: 20 movies, 60 reviews (~10 KB)

## Notes

- Synthetic reviews use random dates (last 90 days)
- Ratings range from 4-10 (no terrible reviews in seed data)
- Authors are User + random 3-digit number
- Real user reviews will appear first in the merged list
