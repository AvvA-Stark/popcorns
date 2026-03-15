/**
 * Tests for region.ts
 * Testing region detection logic with caching
 */

import { getLocales } from 'expo-localization';

// Mock expo-localization
jest.mock('expo-localization');

describe('region.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('getRegion', () => {
    it('should return region from regionCode if not US', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'bg-BG',
            languageCode: 'bg',
            regionCode: 'BG',
          },
        ]);

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('BG');
        expect(getLocales).toHaveBeenCalled();
      });
    });

    it('should parse region from languageTag if regionCode is US', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'en-GB',
            languageCode: 'en',
            regionCode: 'US', // Default/fallback regionCode
          },
        ]);

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('GB');
      });
    });

    it('should parse region from languageTag with underscore separator', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'fr_FR',
            languageCode: 'fr',
            regionCode: 'US',
          },
        ]);

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('FR');
      });
    });

    it('should use IP-based detection if locale methods fail', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'en',
            languageCode: 'en',
            regionCode: 'US',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ country_code: 'CA' }),
        });

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('CA');
        expect(global.fetch).toHaveBeenCalledWith(
          'https://ipapi.co/json/',
          expect.objectContaining({
            headers: { 'User-Agent': 'Popcorns-App/1.0' }
          })
        );
      });
    });

    it('should fallback to US if all methods fail', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'en',
            languageCode: 'en',
            regionCode: null,
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('US');
      });
    });

    it('should fallback to US if IP API returns invalid data', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'en',
            languageCode: 'en',
            regionCode: 'US',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ country_code: null }),
        });

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('US');
      });
    });

    it('should handle IP API network errors gracefully', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'en',
            languageCode: 'en',
            regionCode: 'US',
          },
        ]);

        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('US');
      });
    });

    it('should cache the region after first detection', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'de-DE',
            languageCode: 'de',
            regionCode: 'DE',
          },
        ]);

        const { getRegion } = require('../region');
        
        const region1 = await getRegion();
        const region2 = await getRegion();
        const region3 = await getRegion();

        expect(region1).toBe('DE');
        expect(region2).toBe('DE');
        expect(region3).toBe('DE');
        
        // getLocales should only be called once due to caching
        expect(getLocales).toHaveBeenCalledTimes(1);
      });
    });

    it('should return uppercase region codes', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockReturnValue([
          {
            languageTag: 'en-gb',
            languageCode: 'en',
            regionCode: 'us',
          },
        ]);

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('GB');
        expect(region).toMatch(/^[A-Z]{2}$/);
      });
    });

    it('should handle unexpected errors during detection', async () => {
      await jest.isolateModulesAsync(async () => {
        (getLocales as jest.Mock).mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        const { getRegion } = require('../region');
        const region = await getRegion();

        expect(region).toBe('US');
      });
    });
  });
});
