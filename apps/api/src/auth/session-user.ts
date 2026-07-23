import type { UserSession } from '@thallesp/nestjs-better-auth';

import { UnauthorizedException } from '@nestjs/common';

export function requireUserId(session: null | undefined | UserSession): string {
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedException('Authentication required');
  }

  return userId;
}
