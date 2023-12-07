import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as get from 'lodash.get';

@Injectable()
export class RpcAuthAlsoOwnedByInterceptor implements NestInterceptor {
  constructor(
    private ownedBy: { permittedEntity: string; permittedEntityIdPath: string },
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const rpcContext = context.switchToRpc().getContext();
    const input = context.getArgs()[0];
    const ownedBy = {
      permittedEntity: this.ownedBy.permittedEntity,
      permittedEntityId: get(input, this.ownedBy.permittedEntityIdPath),
    };
    rpcContext.set('ownedBy', ownedBy);
    return next.handle();
  }
}
