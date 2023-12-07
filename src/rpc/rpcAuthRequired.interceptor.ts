import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcAuthUtils } from './rpcAuthUtils';
import { RpcPermissionDeniedException } from '@appstack-io/exceptions';

@Injectable()
export class RpcAuthRequiredInterceptor implements NestInterceptor {
  private authUtils = new RpcAuthUtils();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const { decoded, external } = this.authUtils.extractAuth(context);

    if (!external) return next.handle();

    if (!decoded) {
      throw new RpcPermissionDeniedException();
    }

    return next.handle();
  }
}
