import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as grpc from '@grpc/grpc-js';
import { Metadata } from 'nice-grpc';
import { RpcAuthUtils } from './rpcAuthUtils';
import { catchError, from, map, mergeMap, throwError } from 'rxjs';
import { RpcPermissionDeniedException } from '@appstack-io/exceptions';
import { PermissionLogic } from '@appstack-io/permissions/dist/permission.logic';

@Injectable()
export class RpcAuthEntityAssertReadableInterceptor implements NestInterceptor {
  private authUtils = new RpcAuthUtils();

  constructor(private permissions: PermissionLogic) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const { jwt, decoded, external, permitted, entity } =
      this.authUtils.extractAuth(context);

    if (!external) return next.handle();

    if (!decoded) {
      throw new RpcException({
        message: 'authentication required',
        code: grpc.status.UNAUTHENTICATED,
      });
    }

    if (entity === 'permission') {
      throw new RpcException({
        message: 'permission denied',
        code: grpc.status.PERMISSION_DENIED,
      });
    }

    return next.handle().pipe(
      mergeMap((result) => {
        const metadata = new Metadata();
        metadata.set('jwt', jwt);
        return from(
          (async () => {
            const { id } = result;

            const rpcContext = context.switchToRpc().getContext();
            const readableAs = rpcContext.get('readableAs') || [{}];
            if (readableAs.length === 0) {
              readableAs.push({});
            }
            const { entity: asEntity, entityId: asEntityId } = readableAs[0];
            const validation = await this.permissions.validateOne({
              permitted,
              entity: asEntity || entity,
              entityId: asEntityId || id,
              action: 'read',
            });
            if (!validation?.validated) {
              throw new Error();
            }
          })(),
        ).pipe(
          map(() => result),
          catchError((e) => {
            throw new RpcPermissionDeniedException();
          }),
        );
      }),
      catchError((err: Error) => {
        return throwError(() => err);
      }),
    );
  }
}
