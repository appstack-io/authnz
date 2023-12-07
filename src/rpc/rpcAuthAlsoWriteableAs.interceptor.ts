import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as get from 'lodash.get';

@Injectable()
export class RpcAuthAlsoWriteableAsInterceptor implements NestInterceptor {
  constructor(private writeableAs: { entity: string; entityIdPath: string }) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const rpcContext = context.switchToRpc().getContext();
    const input = context.getArgs()[0];
    const writeableAs = {
      entity: this.writeableAs.entity,
      entityId: get(input, this.writeableAs.entityIdPath),
    };
    rpcContext.set('writeableAs', writeableAs);
    return next.handle();
  }
}
