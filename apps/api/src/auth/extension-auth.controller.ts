import type { Request, Response } from 'express';

import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllowAnonymous, AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';

import type { Auth } from './auth.js';

import { type Env, parseWebOrigins } from '../config/env.schema.js';

@AllowAnonymous()
@Controller('auth/extension')
export class ExtensionAuthController {
  constructor(
    private readonly authService: AuthService<Auth>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get('callback')
  async callback(
    @Query('redirect') redirect: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const fallbackRedirect = parseWebOrigins(
      this.config.get('WEB_ORIGIN', { infer: true }),
    )[0];
    const target =
      redirect && isAllowedRedirect(redirect) ? redirect : fallbackRedirect;

    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.session.token) {
      const errorUrl = new URL(target);
      errorUrl.searchParams.set('error', 'unauthenticated');
      res.redirect(errorUrl.toString());
      return;
    }

    const successUrl = new URL(target);
    successUrl.searchParams.set('session_token', session.session.token);
    res.redirect(successUrl.toString());
  }
}

function isAllowedRedirect(redirect: string): boolean {
  try {
    const url = new URL(redirect);
    return (
      url.protocol === 'https:' && url.hostname.endsWith('.chromiumapp.org')
    );
  } catch {
    return false;
  }
}
