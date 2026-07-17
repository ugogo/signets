import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SyncTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    const header = request.headers.authorization;
    const expected = this.config.get<string>('SYNC_TOKEN');

    if (!expected) {
      throw new UnauthorizedException('Sync token is not configured');
    }

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);
    if (token !== expected) {
      throw new UnauthorizedException('Invalid sync token');
    }

    return true;
  }
}
