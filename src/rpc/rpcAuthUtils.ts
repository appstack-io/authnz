import { ExecutionContext } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as grpc from '@grpc/grpc-js';
import { RpcPermissionDeniedException } from './rpcPermissionDeniedException';
import * as jwtUtil from 'jsonwebtoken';

export type Permitted = {
  permittedEntityId: string;
  permittedEntity: string;
};

export type AuthData = {
  jwt: string;
  decoded: { sub: string };
  external?: boolean;
  permitted: Permitted[];
  entity: string;
  entityId: string;
};

export class RpcAuthUtils {
  extractAuth(context: ExecutionContext): AuthData {
    try {
      const external = this.rpcIsExternal(context);
      if (!external)
        return {
          decoded: { sub: '' },
          entity: '',
          entityId: '',
          jwt: '',
          permitted: [],
          external: false,
        };
      const rpcContext = context.switchToRpc().getContext();
      const jwt = rpcContext.get('jwt')[0];
      const decoded = jwtUtil.verify(jwt, process.env.JWT_SECRET, {
        complete: false,
      });
      const sub =
        typeof decoded.sub === 'function' ? decoded.sub() : decoded.sub;
      const permittedEntity = 'user';
      const entity = context
        .getClass()
        .name.replace('Controller', '')
        .toLowerCase();
      const entityId = context.getArgs()[0].id;

      this.removeNoAuth(context);
      const authData = {
        jwt,
        decoded: { sub },
        external,
        permitted: [{ permittedEntityId: sub, permittedEntity }],
        entity,
        entityId,
      };
      rpcContext.set('authData', authData);
      return authData;
    } catch (e) {
      if (e.message === 'invalid signature') {
        throw new RpcPermissionDeniedException();
      }
      throw new RpcException({
        message: 'authentication required',
        code: grpc.status.UNAUTHENTICATED,
      });
    }
  }

  getAuthData(context: ExecutionContext): AuthData {
    const rpcContext = context.switchToRpc().getContext();
    if (this.isAuth(context)) return rpcContext.get('authData')[0];
    throw new RpcPermissionDeniedException();
  }

  rpcIsExternal(context: ExecutionContext): boolean {
    const rpcContext = context.switchToRpc().getContext();
    const external = rpcContext
      .get('external')
      .some((value) => Boolean(value) === true);
    return external;
  }

  httpIsExternal(context: ExecutionContext): boolean {
    const httpContext = context.switchToHttp().getRequest();
    const external = httpContext.external;
    return external;
  }

  isAuth(context: ExecutionContext): boolean {
    const rpcContext = context.switchToRpc().getContext();
    const noAssertion = rpcContext
      .get('noAuth')
      .some((value) => Boolean(value) === true);
    return !noAssertion;
  }

  removeNoAuth(context: ExecutionContext) {
    const rpcContext = context.switchToRpc().getContext();
    rpcContext.remove('noAuth');
  }
}
