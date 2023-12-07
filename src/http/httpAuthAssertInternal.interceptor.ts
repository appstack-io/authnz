import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcAuthUtils } from '../rpc/rpcAuthUtils';

@Injectable()
export class HttpAuthAssertInternalInterceptor implements NestInterceptor {
  private authUtils = new RpcAuthUtils();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const external = this.authUtils.httpIsExternal(context);

    if (!external) return next.handle();

    throw new HttpException('permission denied', HttpStatus.FORBIDDEN);
  }
}
