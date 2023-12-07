import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as get from 'lodash.get';

@Injectable()
export class RpcAuthReadableAsInterceptor implements NestInterceptor {
  constructor(private readableAs: { entity: string; entityIdPath: string }) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const rpcContext = context.switchToRpc().getContext();
    const input = context.getArgs()[0];
    const readableAs = {
      entity: this.readableAs.entity,
      entityId: get(input, this.readableAs.entityIdPath),
    };
    rpcContext.set('readableAs', readableAs);
    return next.handle();
  }
}
