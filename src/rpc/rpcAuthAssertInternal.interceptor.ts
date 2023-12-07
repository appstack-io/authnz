import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcAuthUtils } from './rpcAuthUtils';
import { RpcPermissionDeniedException } from './rpcPermissionDeniedException';

@Injectable()
export class RpcAuthAssertInternalInterceptor implements NestInterceptor {
  private authUtils = new RpcAuthUtils();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const external = this.authUtils.rpcIsExternal(context);

    if (!external) return next.handle();

    throw new RpcPermissionDeniedException();
  }
}
