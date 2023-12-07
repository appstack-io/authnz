import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class RpcAuthExternalInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const rpcContext = context.switchToRpc().getContext();
    rpcContext.set('external', true);
    rpcContext.set('noAuth', true);
    return next.handle();
  }
}
