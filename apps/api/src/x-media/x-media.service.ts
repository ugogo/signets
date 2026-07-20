import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

const ALLOWED_HOST = /^([a-z0-9-]+\.)?(video|pbs)\.twimg\.com$/;

const UPSTREAM_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'last-modified',
] as const;

/** Hotlink proxy for X CDN URLs blocked by Referer checks in the browser. */
@Injectable()
export class XMediaService {
  validateTwimgUrl(rawUrl: string): URL {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid media URL');
    }

    if (url.protocol !== 'https:' || !ALLOWED_HOST.test(url.hostname)) {
      throw new BadRequestException('Unsupported X media URL');
    }

    return url;
  }

  async pipe(rawUrl: string, req: Request, res: Response): Promise<void> {
    const url = this.validateTwimgUrl(rawUrl);

    const headers: Record<string, string> = {
      Referer: 'https://x.com/',
      'User-Agent': 'Mozilla/5.0 (compatible; Signets/1.0)',
    };

    const range = req.headers.range;
    if (typeof range === 'string') {
      headers.Range = range;
    }

    const upstream = await fetch(url.toString(), { headers });
    if (!upstream.ok && upstream.status !== 206) {
      throw new BadGatewayException(
        `X media upstream request failed (${upstream.status})`,
      );
    }

    res.status(upstream.status);

    for (const name of UPSTREAM_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) {
        res.setHeader(name, value);
      }
    }

    if (!res.getHeader('cache-control')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body as ReadableStream).pipe(res);
  }
}
