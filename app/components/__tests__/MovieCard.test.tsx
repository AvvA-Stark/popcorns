/**
 * Tests for MovieCard component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import MovieCard from '../MovieCard';
import { Movie } from '../../lib/tmdb';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('MovieCard', () => {
  const mockMovie: Movie = {
    id: 550,
    title: 'Fight Club',
    poster_path: '/path/to/poster.jpg',
    overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.',
    release_date: '1999-10-15',
    vote_average: 8.4,
    backdrop_path: '/backdrop.jpg',
    genre_ids: [18, 53],
    adult: false,
    original_language: 'en',
    original_title: 'Fight Club',
    popularity: 100,
    video: false,
    vote_count: 20000,
  };

  it('should render movie title', () => {
    const { getByText } = render(<MovieCard movie={mockMovie} />);
    
    expect(getByText('Fight Club')).toBeTruthy();
  });

  it('should display rating', () => {
    const { getByText } = render(<MovieCard movie={mockMovie} />);
    
    expect(getByText('⭐ 8.4')).toBeTruthy();
  });

  it('should display release year', () => {
    const { getByText } = render(<MovieCard movie={mockMovie} />);
    
    expect(getByText('1999')).toBeTruthy();
  });

  it('should display overview text', () => {
    const { getByText } = render(<MovieCard movie={mockMovie} />);
    
    expect(getByText(/An insomniac office worker/)).toBeTruthy();
  });

  it('should handle movie without release date', () => {
    const movieWithoutDate: Movie = {
      ...mockMovie,
      release_date: '',
    };

    const { getByText } = render(<MovieCard movie={movieWithoutDate} />);
    
    expect(getByText('N/A')).toBeTruthy();
  });

  it('should render info button', () => {
    const { getByText } = render(<MovieCard movie={mockMovie} />);
    
    expect(getByText('ℹ️')).toBeTruthy();
  });
});
