jest.mock('@signets/shared', () => ({
  isAllowedTwimgUrl: (url: string) => {
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === 'https:' &&
        /^([a-z0-9-]+\.)?(video|pbs)\.twimg\.com$/.test(parsed.hostname)
      );
    } catch {
      return false;
    }
  },
}));

import { XMediaService } from './x-media.service';

describe('XMediaService', () => {
  let service: XMediaService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new XMediaService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('validateTwimgUrl', () => {
    it('accepts pbs.twimg.com photo URLs', () => {
      const url = service.validateTwimgUrl(
        'https://pbs.twimg.com/media/abc.jpg?name=large',
      );
      expect(url.hostname).toBe('pbs.twimg.com');
    });

    it('accepts video.twimg.com URLs', () => {
      const url = service.validateTwimgUrl(
        'https://video.twimg.com/ext_tw_video/123.mp4',
      );
      expect(url.hostname).toBe('video.twimg.com');
    });

    it('rejects non-twimg hosts', () => {
      expect(() =>
        service.validateTwimgUrl('https://example.com/image.jpg'),
      ).toThrow('Unsupported X media URL');
    });

    it('rejects non-HTTPS URLs', () => {
      expect(() =>
        service.validateTwimgUrl('http://pbs.twimg.com/media/abc.jpg'),
      ).toThrow('Unsupported X media URL');
    });
  });

  describe('pipe', () => {
    it('rejects redirect responses to non-twimg hosts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        headers: new Headers({ location: 'https://example.com/evil.jpg' }),
        ok: false,
        status: 302,
      }) as typeof fetch;

      const req = { headers: {} } as Parameters<XMediaService['pipe']>[1];
      const res = {
        end: jest.fn(),
        getHeader: jest.fn(),
        setHeader: jest.fn(),
        status: jest.fn(),
      } as unknown as Parameters<XMediaService['pipe']>[2];

      await expect(
        service.pipe('https://pbs.twimg.com/media/abc.jpg', req, res),
      ).rejects.toThrow('Unsupported redirect target');
    });
  });
});
