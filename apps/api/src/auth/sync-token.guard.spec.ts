import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SyncTokenGuard } from './sync-token.guard';

function createContext(authHeader?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authHeader ? { authorization: authHeader } : {},
      }),
    }),
  } as ExecutionContext;
}

describe('SyncTokenGuard', () => {
  it('accepts a matching bearer token', () => {
    const guard = new SyncTokenGuard({
      get: () => 'secret-token',
    } as unknown as ConfigService);

    expect(guard.canActivate(createContext('Bearer secret-token'))).toBe(true);
  });

  it('rejects a missing bearer token', () => {
    const guard = new SyncTokenGuard({
      get: () => 'secret-token',
    } as unknown as ConfigService);

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid bearer token', () => {
    const guard = new SyncTokenGuard({
      get: () => 'secret-token',
    } as unknown as ConfigService);

    expect(() =>
      guard.canActivate(createContext('Bearer wrong-token')),
    ).toThrow(UnauthorizedException);
  });

  it('rejects when SYNC_TOKEN is not configured', () => {
    const guard = new SyncTokenGuard({
      get: () => undefined,
    } as unknown as ConfigService);

    expect(() =>
      guard.canActivate(createContext('Bearer secret-token')),
    ).toThrow('Sync token is not configured');
  });
});
