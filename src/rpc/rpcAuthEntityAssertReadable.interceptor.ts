import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  ClientService,
  PermissionServiceClient,
  PermissionServiceDefinition,
} from '@appstack-io/client';
import { RpcException } from '@nestjs/microservices';
import * as grpc from '@grpc/grpc-js';
import { Metadata } from 'nice-grpc';
import { RpcAuthUtils } from './rpcAuthUtils';
import { catchError, from, map, mergeMap, throwError } from 'rxjs';
import { RpcPermissionDeniedException } from './rpcPermissionDeniedException';

@Injectable()
export class RpcAuthEntityAssertReadableInterceptor implements NestInterceptor {
  private authUtils = new RpcAuthUtils();
  private permissionServiceClient: PermissionServiceClient;

  constructor(private clientService: ClientService) {
    this.permissionServiceClient =
      this.clientService.getServiceInternalClient<PermissionServiceClient>(
        PermissionServiceDefinition,
      );
  }

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
            await this.permissionServiceClient.validateOne(
              {
                permitted,
                entity: asEntity || entity,
                entityId: asEntityId || id,
                action: 'read',
              },
              { metadata },
            );
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
