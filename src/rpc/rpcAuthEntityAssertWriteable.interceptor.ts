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
import { RpcPermissionDeniedException } from '@appstack-io/exceptions';
import { PermissionLogic } from '@appstack-io/permissions/dist/permission.logic';

@Injectable()
export class RpcAuthEntityAssertWriteableInterceptor
  implements NestInterceptor
{
  private authUtils = new RpcAuthUtils();

  constructor(private permissions: PermissionLogic) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const { jwt, decoded, external, permitted, entity, entityId } =
      this.authUtils.extractAuth(context);

    const rpcContext = context.switchToRpc().getContext();
    const writeableAs = rpcContext.get('writeableAs') || [{}];
    if (writeableAs.length === 0) {
      writeableAs.push({});
    }
    const { entity: asEntity, entityId: asEntityId } = writeableAs[0];

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

    try {
      const metadata = new Metadata();
      metadata.set('jwt', jwt);
      const validations = [];
      if (entity && entityId) {
        validations.push(
          this.permissions.validateOne({
            permitted,
            entity: entity,
            entityId: entityId,
            action: 'write',
          }),
        );
      }
      if (asEntity && asEntityId) {
        validations.push(
          this.permissions.validateOne({
            permitted,
            entity: asEntity,
            entityId: asEntityId,
            action: 'write',
          }),
        );
      }
      await firstResolve(validations);
      return next.handle();
    } catch (e) {
      throw new RpcPermissionDeniedException();
    }
  }
}

function firstResolve<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let rejectionCount = 0;
    const rejectionErrors: any[] = [];

    promises.forEach((promise) => {
      promise.then(resolve).catch((error) => {
        rejectionErrors.push(error);
        rejectionCount++;
        if (rejectionCount === promises.length) {
          reject(new Error('All promises were rejected'));
        }
      });
    });
  });
}
