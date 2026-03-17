/**
 * i18n Configuration
 * Sets up i18next with AsyncStorage persistence for language selection
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// English translations (base/fallback)
const en = {
  translation: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Try Again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      remove: 'Remove',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      autoDetect: 'Auto-detect',
      useDeviceLocation: 'Use your device location',
    },

    // Tabs
    tabs: {
      discover: 'Discover',
      series: 'Series',
      watchlist: 'Watchlist',
      search: 'Search',
      profile: 'Profile',
    },

    // Regions
    regions: {
      US: 'United States',
      GB: 'United Kingdom',
      DE: 'Germany',
      ES: 'Spain',
      IT: 'Italy',
      BG: 'Bulgaria',
      FR: 'France',
      CA: 'Canada',
      AU: 'Australia',
      NL: 'Netherlands',
      SE: 'Sweden',
      NO: 'Norway',
      DK: 'Denmark',
      FI: 'Finland',
      PL: 'Poland',
      RO: 'Romania',
      GR: 'Greece',
      PT: 'Portugal',
      CH: 'Switzerland',
      AT: 'Austria',
    },
    regionDescription: 'Choose your region to see available streaming providers',

    // Discovery Screen
    discovery: {
      title: 'Popcorns',
      loadingMovies: 'Loading movies...',
      actionHintDislike: 'Dislike',
      actionHintSuperLike: 'Super Like',
      actionHintLike: 'Like',
      filterMovies: 'Filter Movies',
      clearAll: 'Clear All',
      applyFilters: 'Apply Filters',
      noResults: 'No movies found',
      noResultsSubtext: 'Try adjusting your filters',
      refresh: 'Refresh',
      loadingMore: 'Loading more...',

      // Filters
      filterGenres: 'Genres',
      filterYear: 'Year: {{from}} — {{to}}',
      filterActor: 'Actor',
      filterSearchActor: 'Search actor name...',
      filterClear: 'Clear',
      filterProvider: 'Streaming Provider',
      filterRating: 'Minimum Rating: {{value}}',
      filterAvailability: 'Available in {{region}}',
      filterToggleAvailable: 'Available in {{region}}',
      yearFrom: 1900,
      yearTo: new Date().getFullYear(),

      // Toast messages
      addedToWatchlist: 'Added "{{title}}" to watchlist',
      superLiked: '⭐ Super-liked "{{title}}"!',
      failedToAddWatchlist: 'Failed to add to watchlist',
    },

    // Series Screen (similar structure to discovery)
    series: {
      title: 'Series',
      loadingSeries: 'Loading TV series...',
      filterSeries: 'Filter TV Series',
      actionHintDislike: 'Dislike',
      actionHintSuperLike: 'Super Like',
      actionHintLike: 'Like',
      clearAll: 'Clear All',
      applyFilters: 'Apply Filters',
      noResults: 'No series found',
      noResultsSubtext: 'Try adjusting your filters',
      loadingMore: 'Loading more...',
    },

    // Watchlist Screen
    watchlist: {
      title: 'Your Watchlist',
      subtitle: 'Movies you want to watch',
      stats: '{{count}} movies',
      statsDetail: '⭐ {{count}} super likes',
      emptyTitle: 'Your watchlist is empty',
      emptyText: 'Start discovering movies and swipe right to add them here',
      hintLike: 'Like',
      hintSuperLike: 'Super Like',
      pullToRefresh: 'Pull down to refresh',
      removeConfirm: 'Remove "{{title}}" from your watchlist?',
      removeButton: 'Remove',
      removedMessage: 'Removed "{{title}}" from watchlist',
      failedToRemove: 'Failed to remove from watchlist',
      addedDate: 'Added: {{date}}',
    },

    // Profile Screen
    profile: {
      headerBio: 'Swipe • Discover • Watch',
      memberSince: 'Member since {{date}}',
      unknownDate: 'Unknown',
      daysActive: 'Days Active',
      watchlistItems: 'Watchlist Items',
      superLikes: 'Super Likes',
      totalSwipes: 'Movies Discovered',
      likes: 'Likes',
      passes: 'Passes',
      notYourVibe: 'Not your vibe',
      matchPercentage: '{{percent}}% match',
      favoriteGenres: 'Favorite Genres',
      settings: 'Settings',
      language: 'Language',
      region: 'Region',
      selectLanguage: 'Select Language',
      selectRegion: 'Select Region',
      emptyStateTitle: 'Start Discovering!',
      emptyStateText: 'Swipe through movies to build your profile and see your stats here',
      startSwiping: 'Start Discovering!',
      genreRank: '#{{rank}}',
      genreLikes: '{{count}} likes',
    },

    // Movie Detail Screen
    movieDetail: {
      loading: 'Loading movie details...',
      error: 'Failed to load movie details. Please try again.',
      notFound: 'Movie not found',
      tryAgain: 'Try Again',
      overview: 'Overview',
      noOverview: 'No overview available.',
      cast: 'Cast',
      similarMovies: 'Similar Movies',
      noSimilarMovies: 'No similar movies found',
      whereToWatch: 'Where to Watch',
      availableIn: 'in {{region}} ({{code}})',
      notAvailable: 'Not available for streaming',
      trailer: 'Trailer',
      watchTrailer: 'Watch Trailer',
      userReviews: 'User Reviews',
      addReview: '+ Add Review',
      cancelReview: '✕ Cancel',
      yourRating: 'Your Rating (1-10)',
      yourReview: 'Your Review (Optional)',
      shareThoughts: 'Share your thoughts...',
      submitReview: 'Submit Review',
      noReviews: 'No reviews yet',
      beFirst: 'Share your thoughts and be the first to review!',
      writeFirstReview: '✍️ Write First Review',
      removeFromWatchlist: '✓ Remove from Watchlist',
      addToWatchlist: '+ Add to Watchlist',
      openProvider: 'Open {{provider}}',
      loadingTrailer: 'Loading trailer...',
      trailerError: 'Could not load trailer',
      reviewBlocked: 'Review Blocked',
      profanityDetected: 'Your review contains inappropriate language. Please remove profanity and try again.',
      linksNotAllowed: 'Reviews cannot contain links. Please remove any URLs and try again.',
    },

    // Tutorial Overlay
    tutorial: {
      title: 'How to Swipe',
      hint: 'Tap anywhere to skip',
      nope: 'NOPE',
      like: 'LIKE',
      superLike: 'SUPER LIKE',
    },

    // Toast Notifications
    toast: {
      success: 'success',
      error: 'error',
      info: 'info',
    },

    // Error Messages
    errors: {
      network: 'Network error. Please check your connection.',
      server: 'Server error. Please try again later.',
      unknown: 'An unknown error occurred.',
      loadingFailed: 'Failed to load. Please try again.',
    },
  },
};

// German translations
const de = {
  translation: {
    common: {
      loading: 'Laden...',
      error: 'Ein Fehler ist aufgetreten',
      retry: 'Erneut versuchen',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      remove: 'Entfernen',
      close: 'Schließen',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
      ok: 'OK',
      autoDetect: 'Automatische Erkennung',
      useDeviceLocation: 'Standort des Geräts verwenden',
    },

    tabs: {
      discover: 'Entdecken',
      series: 'Serien',
      watchlist: 'Merkliste',
      search: 'Suche',
      profile: 'Profil',
    },

    regions: {
      US: 'Vereinigte Staaten',
      GB: 'Vereinigtes Königreich',
      DE: 'Deutschland',
      ES: 'Spanien',
      IT: 'Italien',
      BG: 'Bulgarien',
      FR: 'Frankreich',
      CA: 'Kanada',
      AU: 'Australien',
      NL: 'Niederlande',
      SE: 'Schweden',
      NO: 'Norwegen',
      DK: 'Dänemark',
      FI: 'Finnland',
      PL: 'Polen',
      RO: 'Rumänien',
      GR: 'Griechenland',
      PT: 'Portugal',
      CH: 'Schweiz',
      AT: 'Österreich',
    },
    regionDescription: 'Wählen Sie Ihre Region, um verfügbare Streaming-Anbieter zu sehen',

    discovery: {
      title: 'Popcorns',
      loadingMovies: 'Filme werden geladen...',
      actionHintDislike: 'Ablehnen',
      actionHintSuperLike: 'Super Like',
      actionHintLike: 'Like',
      filterMovies: 'Filme filtern',
      clearAll: 'Alle löschen',
      applyFilters: 'Filter anwenden',
      noResults: 'Keine Filme gefunden',
      noResultsSubtext: 'Versuchen Sie, Ihre Filter anzupassen',
      refresh: 'Aktualisieren',
      loadingMore: 'Mehr laden...',

      filterGenres: 'Genres',
      filterYear: 'Jahr: {{from}} — {{to}}',
      filterActor: 'Schauspieler',
      filterSearchActor: 'Schauspielername suchen...',
      filterClear: 'Löschen',
      filterProvider: 'Streaming-Anbieter',
      filterRating: 'Mindestbewertung: {{value}}',
      filterAvailability: 'Verfügbar in {{region}}',
      filterToggleAvailable: 'Verfügbar in {{region}}',
      yearFrom: 1900,
      yearTo: new Date().getFullYear(),

      addedToWatchlist: '"{{title}}" zur Merkliste hinzugefügt',
      superLiked: '⭐ "{{title}}" super geliked!',
      failedToAddWatchlist: 'Hinzufügen zur Merkliste fehlgeschlagen',
    },

    series: {
      title: 'Serien',
      loadingSeries: 'Serien werden geladen...',
      filterSeries: 'Serien filtern',
      actionHintDislike: 'Ablehnen',
      actionHintSuperLike: 'Super Like',
      actionHintLike: 'Like',
      clearAll: 'Alle löschen',
      applyFilters: 'Filter anwenden',
      noResults: 'Keine Serien gefunden',
      noResultsSubtext: 'Versuchen Sie, Ihre Filter anzupassen',
      loadingMore: 'Mehr laden...',
    },

    watchlist: {
      title: 'Ihre Merkliste',
      subtitle: 'Filme, die Sie sehen möchten',
      stats: '{{count}} Filme',
      statsDetail: '⭐ {{count}} Super Likes',
      emptyTitle: 'Ihre Merkliste ist leer',
      emptyText: 'Beginnen Sie, Filme zu entdecken und swipen Sie nach rechts, um sie hier hinzuzufügen',
      hintLike: 'Like',
      hintSuperLike: 'Super Like',
      pullToRefresh: 'Zum Aktualisieren nach unten ziehen',
      removeConfirm: '"{{title}}" von Ihrer Merkliste entfernen?',
      removeButton: 'Entfernen',
      removedMessage: '"{{title}}" von Merkliste entfernt',
      failedToRemove: 'Entfernen von Merkliste fehlgeschlagen',
      addedDate: 'Hinzugefügt: {{date}}',
    },

    profile: {
      headerBio: 'Swipe • Entdecken • Ansehen',
      memberSince: 'Mitglied seit {{date}}',
      unknownDate: 'Unbekannt',
      daysActive: 'Tage aktiv',
      watchlistItems: 'Merkliste Einträge',
      superLikes: 'Super Likes',
      totalSwipes: 'Entdeckte Filme',
      likes: 'Likes',
      passes: 'Ablehnungen',
      notYourVibe: 'Nicht dein Ding',
      matchPercentage: '{{percent}}% Match',
      favoriteGenres: 'Lieblingsgenres',
      settings: 'Einstellungen',
      language: 'Sprache',
      region: 'Region',
      selectLanguage: 'Sprache auswählen',
      selectRegion: 'Region auswählen',
      emptyStateTitle: 'Beginnen Sie zu entdecken!',
      emptyStateText: 'Swipen Sie durch Filme, um Ihr Profil aufzubauen und Ihre Statistiken zu sehen',
      startSwiping: 'Beginnen Sie zu entdecken!',
      genreRank: '#{{rank}}',
      genreLikes: '{{count}} Likes',
    },

    movieDetail: {
      loading: 'Filmdetails werden geladen...',
      error: 'Filmdetails konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
      notFound: 'Film nicht gefunden',
      tryAgain: 'Erneut versuchen',
      overview: 'Übersicht',
      noOverview: 'Keine Übersicht verfügbar.',
      cast: 'Cast',
      similarMovies: 'Ähnliche Filme',
      noSimilarMovies: 'Keine ähnlichen Filme gefunden',
      whereToWatch: 'Wo zu sehen',
      availableIn: 'in {{region}} ({{code}})',
      notAvailable: 'Nicht zum Streamen verfügbar',
      trailer: 'Trailer',
      watchTrailer: 'Trailer ansehen',
      userReviews: 'Benutzerbewertungen',
      addReview: '+ Bewertung hinzufügen',
      cancelReview: '✕ Abbrechen',
      yourRating: 'Ihre Bewertung (1-10)',
      yourReview: 'Ihre Bewertung (Optional)',
      shareThoughts: 'Teilen Sie Ihre Gedanken...',
      submitReview: 'Bewertung absenden',
      noReviews: 'Noch keine Bewertungen',
      beFirst: 'Teilen Sie Ihre Gedanken und seien Sie der erste, der eine Bewertung schreibt!',
      writeFirstReview: '✍️ Erste Bewertung schreiben',
      removeFromWatchlist: '✓ Von Merkliste entfernen',
      addToWatchlist: '+ Zur Merkliste hinzufügen',
      openProvider: '{{provider}} öffnen',
      loadingTrailer: 'Trailer wird geladen...',
      trailerError: 'Trailer konnte nicht geladen werden',
      reviewBlocked: 'Bewertung blockiert',
      profanityDetected: 'Ihre Bewertung enthält unangemessene Sprache. Bitte entfernen Sie Schimpfwörter und versuchen Sie es erneut.',
      linksNotAllowed: 'Bewertungen dürfen keine Links enthalten. Bitte entfernen Sie URLs und versuchen Sie es erneut.',
    },

    tutorial: {
      title: 'Wie man swipet',
      hint: 'Tippen Sie zum Überspringen',
      nope: 'NEIN',
      like: 'LIKE',
      superLike: 'SUPER LIKE',
    },

    toast: {
      success: 'Erfolg',
      error: 'Fehler',
      info: 'Info',
    },

    errors: {
      network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
      server: 'Serverfehler. Bitte versuchen Sie es später erneut.',
      unknown: 'Ein unbekannter Fehler ist aufgetreten.',
      loadingFailed: 'Laden fehlgeschlagen. Bitte versuchen Sie es erneut.',
    },
  },
};

// Spanish translations
const es = {
  translation: {
    common: {
      loading: 'Cargando...',
      error: 'Ha ocurrido un error',
      retry: 'Intentar de nuevo',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      remove: 'Quitar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      ok: 'OK',
      autoDetect: 'Detección automática',
      useDeviceLocation: 'Usar ubicación del dispositivo',
    },

    tabs: {
      discover: 'Descubrir',
      series: 'Series',
      watchlist: 'Lista',
      search: 'Buscar',
      profile: 'Perfil',
    },

    regions: {
      US: 'Estados Unidos',
      GB: 'Reino Unido',
      DE: 'Alemania',
      ES: 'España',
      IT: 'Italia',
      BG: 'Bulgaria',
      FR: 'Francia',
      CA: 'Canadá',
      AU: 'Australia',
      NL: 'Países Bajos',
      SE: 'Suecia',
      NO: 'Noruega',
      DK: 'Dinamarca',
      FI: 'Finlandia',
      PL: 'Polonia',
      RO: 'Rumanía',
      GR: 'Grecia',
      PT: 'Portugal',
      CH: 'Suiza',
      AT: 'Austria',
    },
    regionDescription: 'Elige tu región para ver los servicios de streaming disponibles',

    discovery: {
      title: 'Popcorns',
      loadingMovies: 'Cargando películas...',
      actionHintDislike: 'No me gusta',
      actionHintSuperLike: 'Super Me Gusta',
      actionHintLike: 'Me gusta',
      filterMovies: 'Filtrar películas',
      clearAll: 'Limpiar todo',
      applyFilters: 'Aplicar filtros',
      noResults: 'No se encontraron películas',
      noResultsSubtext: 'Intente ajustar sus filtros',
      refresh: 'Actualizar',
      loadingMore: 'Cargando más...',

      filterGenres: 'Géneros',
      filterYear: 'Año: {{from}} — {{to}}',
      filterActor: 'Actor',
      filterSearchActor: 'Buscar actor...',
      filterClear: 'Limpiar',
      filterProvider: 'Servicio de streaming',
      filterRating: 'Valoración mínima: {{value}}',
      filterAvailability: 'Disponible en {{region}}',
      filterToggleAvailable: 'Disponible en {{region}}',
      yearFrom: 1900,
      yearTo: new Date().getFullYear(),

      addedToWatchlist: '"{{title}}" añadida a tu lista',
      superLiked: '⭐ ¡Super me gusta "{{title}}"!',
      failedToAddWatchlist: 'Error al añadir a la lista',
    },

    series: {
      title: 'Series',
      loadingSeries: 'Cargando series...',
      filterSeries: 'Filtrar series',
      actionHintDislike: 'No me gusta',
      actionHintSuperLike: 'Super Me Gusta',
      actionHintLike: 'Me gusta',
      clearAll: 'Limpiar todo',
      applyFilters: 'Aplicar filtros',
      noResults: 'No se encontraron series',
      noResultsSubtext: 'Intente ajustar sus filtros',
      loadingMore: 'Cargando más...',
    },

    watchlist: {
      title: 'Tu Lista',
      subtitle: 'Películas que quieres ver',
      stats: '{{count}} películas',
      statsDetail: '⭐ {{count}} super me gusta',
      emptyTitle: 'Tu lista está vacía',
      emptyText: 'Comienza a descubrir películas y desliza a la derecha para añadirlas aquí',
      hintLike: 'Me gusta',
      hintSuperLike: 'Super Me Gusta',
      pullToRefresh: 'Tira hacia abajo para actualizar',
      removeConfirm: '¿Quitar "{{title}}" de tu lista?',
      removeButton: 'Quitar',
      removedMessage: '"{{title}}" quitada de la lista',
      failedToRemove: 'Error al quitar de la lista',
      addedDate: 'Añadido: {{date}}',
    },

    profile: {
      headerBio: 'Desliza • Descubre • Ve',
      memberSince: 'Miembro desde {{date}}',
      unknownDate: 'Desconocido',
      daysActive: 'Días activo',
      watchlistItems: 'Elementos en lista',
      superLikes: 'Super Me Gusta',
      totalSwipes: 'Películas descubiertas',
      likes: 'Me gusta',
      passes: 'No me gusta',
      notYourVibe: 'No es tu estilo',
      matchPercentage: '{{percent}}% coincidencia',
      favoriteGenres: 'Géneros favoritos',
      settings: 'Configuración',
      language: 'Idioma',
      region: 'Región',
      selectLanguage: 'Seleccionar idioma',
      selectRegion: 'Seleccionar región',
      emptyStateTitle: '¡Comienza a descubrir!',
      emptyStateText: 'Desliza a través de películas para construir tu perfil y ver tus estadísticas aquí',
      startSwiping: '¡Comienza a descubrir!',
      genreRank: '#{{rank}}',
      genreLikes: '{{count}} me gusta',
    },

    movieDetail: {
      loading: 'Cargando detalles de la película...',
      error: 'No se pudieron cargar los detalles. Inténtelo de nuevo.',
      notFound: 'Película no encontrada',
      tryAgain: 'Intentar de nuevo',
      overview: 'Sinopsis',
      noOverview: 'No hay sinopsis disponible.',
      cast: 'Reparto',
      similarMovies: 'Películas similares',
      noSimilarMovies: 'No se encontraron películas similares',
      whereToWatch: 'Dónde ver',
      availableIn: 'en {{region}} ({{code}})',
      notAvailable: 'No disponible para streaming',
      trailer: 'Tráiler',
      watchTrailer: 'Ver tráiler',
      userReviews: 'Reseñas de usuarios',
      addReview: '+ Añadir reseña',
      cancelReview: '✕ Cancelar',
      yourRating: 'Tu valoración (1-10)',
      yourReview: 'Tu reseña (Opcional)',
      shareThoughts: 'Comparte tus pensamientos...',
      submitReview: 'Enviar reseña',
      noReviews: 'No hay reseñas aún',
      beFirst: '¡Comparte tus pensamientos y sé el primero en reseñar!',
      writeFirstReview: '✍️ Escribe la primera reseña',
      removeFromWatchlist: '✓ Quitar de la lista',
      addToWatchlist: '+ Añadir a la lista',
      openProvider: 'Abrir {{provider}}',
      loadingTrailer: 'Cargando tráiler...',
      trailerError: 'No se pudo cargar el tráiler',
      reviewBlocked: 'Reseña bloqueada',
      profanityDetected: 'Tu reseña contiene lenguaje inapropiado. Por favor, elimina las palabras ofensivas e inténtalo de nuevo.',
      linksNotAllowed: 'Las reseñas no pueden contener enlaces. Por favor, elimina las URLs e inténtalo de nuevo.',
    },

    tutorial: {
      title: 'Cómo deslizar',
      hint: 'Toca para omitir',
      nope: 'NO',
      like: 'ME GUSTA',
      superLike: 'SUPER ME GUSTA',
    },

    toast: {
      success: 'éxito',
      error: 'error',
      info: 'info',
    },

    errors: {
      network: 'Error de red. Compruebe su conexión.',
      server: 'Error del servidor. Inténtelo más tarde.',
      unknown: 'Se ha producido un error desconocido.',
      loadingFailed: 'Error al cargar. Inténtelo de nuevo.',
    },
  },
};

// Italian translations
const it = {
  translation: {
    common: {
      loading: 'Caricamento...',
      error: 'Si è verificato un errore',
      retry: 'Riprova',
      cancel: 'Annulla',
      save: 'Salva',
      delete: 'Elimina',
      remove: 'Rimuovi',
      close: 'Chiudi',
      confirm: 'Conferma',
      yes: 'Sì',
      no: 'No',
      ok: 'OK',
      autoDetect: 'Rilevamento automatico',
      useDeviceLocation: 'Usa posizione del dispositivo',
    },

    tabs: {
      discover: 'Scopri',
      series: 'Serie',
      watchlist: 'Lista',
      search: 'Cerca',
      profile: 'Profilo',
    },

    regions: {
      US: 'Stati Uniti',
      GB: 'Regno Unito',
      DE: 'Germania',
      ES: 'Spagna',
      IT: 'Italia',
      BG: 'Bulgaria',
      FR: 'Francia',
      CA: 'Canada',
      AU: 'Australia',
      NL: 'Paesi Bassi',
      SE: 'Svezia',
      NO: 'Norvegia',
      DK: 'Danimarca',
      FI: 'Finlandia',
      PL: 'Polonia',
      RO: 'Romania',
      GR: 'Grecia',
      PT: 'Portogallo',
      CH: 'Svizzera',
      AT: 'Austria',
    },
    regionDescription: 'Scegli la tua regione per vedere i servizi di streaming disponibili',

    discovery: {
      title: 'Popcorns',
      loadingMovies: 'Caricamento film...',
      actionHintDislike: 'Non mi piace',
      actionHintSuperLike: 'Super Mi Piace',
      actionHintLike: 'Mi piace',
      filterMovies: 'Filtra film',
      clearAll: 'Pulisci tutto',
      applyFilters: 'Applica filtri',
      noResults: 'Nessun film trovato',
      noResultsSubtext: 'Prova ad aggiustare i filtri',
      refresh: 'Aggiorna',
      loadingMore: 'Caricando altri...',

      filterGenres: 'Generi',
      filterYear: 'Anno: {{from}} — {{to}}',
      filterActor: 'Attore',
      filterSearchActor: 'Cerca attore...',
      filterClear: 'Pulisci',
      filterProvider: 'Servizio streaming',
      filterRating: 'Valutazione minima: {{value}}',
      filterAvailability: 'Disponibile in {{region}}',
      filterToggleAvailable: 'Disponibile in {{region}}',
      yearFrom: 1900,
      yearTo: new Date().getFullYear(),

      addedToWatchlist: '"{{title}}" aggiunto alla lista',
      superLiked: '⭐ Super mi piace "{{title}}"!',
      failedToAddWatchlist: 'Aggiunta alla lista fallita',
    },

    series: {
      title: 'Serie',
      loadingSeries: 'Caricamento serie...',
      filterSeries: 'Filtra serie',
      actionHintDislike: 'Non mi piace',
      actionHintSuperLike: 'Super Mi Piace',
      actionHintLike: 'Mi piace',
      clearAll: 'Pulisci tutto',
      applyFilters: 'Applica filtri',
      noResults: 'Nessuna serie trovata',
      noResultsSubtext: 'Prova ad aggiustare i filtri',
      loadingMore: 'Caricando altri...',
    },

    watchlist: {
      title: 'La tua Lista',
      subtitle: 'Film che vuoi guardare',
      stats: '{{count}} film',
      statsDetail: '⭐ {{count}} super mi piace',
      emptyTitle: 'La tua lista è vuota',
      emptyText: 'Inizia a scoprire film e scorri a destra per aggiungerli qui',
      hintLike: 'Mi piace',
      hintSuperLike: 'Super Mi Piace',
      pullToRefresh: 'Tira giù per aggiornare',
      removeConfirm: 'Rimuovere "{{title}}" dalla tua lista?',
      removeButton: 'Rimuovi',
      removedMessage: '"{{title}}" rimosso dalla lista',
      failedToRemove: 'Rimozione dalla lista fallita',
      addedDate: 'Aggiunto: {{date}}',
    },

    profile: {
      headerBio: 'Scorri • Scopri • Guarda',
      memberSince: 'Membro dal {{date}}',
      unknownDate: 'Sconosciuto',
      daysActive: 'Giorni attivo',
      watchlistItems: 'Elementi lista',
      superLikes: 'Super Mi Piace',
      totalSwipes: 'Film scoperti',
      likes: 'Mi piace',
      passes: 'Non mi piace',
      notYourVibe: 'Non fa per te',
      matchPercentage: '{{percent}}% corrispondenza',
      favoriteGenres: 'Generi preferiti',
      settings: 'Impostazioni',
      language: 'Lingua',
      region: 'Regione',
      selectLanguage: 'Seleziona lingua',
      selectRegion: 'Seleziona regione',
      emptyStateTitle: 'Inizia a scoprire!',
      emptyStateText: 'Scorri i film per costruire il tuo profilo e vedere le tue statistiche qui',
      startSwiping: 'Inizia a scoprire!',
      genreRank: '#{{rank}}',
      genreLikes: '{{count}} mi piace',
    },

    movieDetail: {
      loading: 'Caricamento dettagli film...',
      error: 'Impossibile caricare i dettagli. Riprova.',
      notFound: 'Film non trovato',
      tryAgain: 'Riprova',
      overview: 'Trama',
      noOverview: 'Nessuna trama disponibile.',
      cast: 'Cast',
      similarMovies: 'Film simili',
      noSimilarMovies: 'Nessun film simile trovato',
      whereToWatch: 'Dove guardare',
      availableIn: 'in {{region}} ({{code}})',
      notAvailable: 'Non disponibile in streaming',
      trailer: 'Trailer',
      watchTrailer: 'Guarda trailer',
      userReviews: 'Recensioni utenti',
      addReview: '+ Aggiungi recensione',
      cancelReview: '✕ Annulla',
      yourRating: 'La tua valutazione (1-10)',
      yourReview: 'La tua recensione (Opzionale)',
      shareThoughts: 'Condividi i tuoi pensieri...',
      submitReview: 'Invia recensione',
      noReviews: 'Nessuna recensione ancora',
      beFirst: 'Condividi i tuoi pensieri e sii il primo a recensire!',
      writeFirstReview: '✍️ Scrivi la prima recensione',
      removeFromWatchlist: '✓ Rimuovi dalla lista',
      addToWatchlist: '+ Aggiungi alla lista',
      openProvider: 'Apri {{provider}}',
      loadingTrailer: 'Caricamento trailer...',
      trailerError: 'Impossibile caricare il trailer',
      reviewBlocked: 'Recensione bloccata',
      profanityDetected: 'La tua recensione contiene linguaggio inappropriato. Per favore, rimuovi le parolacce e riprova.',
      linksNotAllowed: 'Le recensioni non possono contenere link. Per favore, rimuovi gli URL e riprova.',
    },

    tutorial: {
      title: 'Come scorrere',
      hint: 'Tocca per saltare',
      nope: 'NO',
      like: 'MI PIACE',
      superLike: 'SUPER MI PIACE',
    },

    toast: {
      success: 'successo',
      error: 'errore',
      info: 'info',
    },

    errors: {
      network: 'Errore di rete. Controlla la connessione.',
      server: 'Errore del server. Riprova più tardi.',
      unknown: 'Si è verificato un errore sconosciuto.',
      loadingFailed: 'Caricamento fallito. Riprova.',
    },
  },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      de: de,
      es: es,
      it: it,
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
  });

// Function to change language and persist to AsyncStorage
export const changeLanguage = async (lng: string) => {
  await i18n.changeLanguage(lng);
  try {
    // Save language only, preserving existing region
    const settingsJson = await AsyncStorage.getItem('@popcorns:user_settings');
    const currentSettings = settingsJson ? JSON.parse(settingsJson) : { language: 'en', region: 'US' };
    await AsyncStorage.setItem('@popcorns:user_settings', JSON.stringify({
      ...currentSettings,
      language: lng,
    }));
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

// Initialize language from saved settings
export const initializeI18n = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem('@popcorns:user_settings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      if (settings.language && ['en', 'de', 'es', 'it'].includes(settings.language)) {
        await i18n.changeLanguage(settings.language);
      }
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
};

export default i18n;