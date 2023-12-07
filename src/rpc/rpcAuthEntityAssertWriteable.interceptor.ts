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
import { RpcPermissionDeniedException } from './rpcPermissionDeniedException';

@Injectable()
export class RpcAuthEntityAssertWriteableInterceptor
  implements NestInterceptor
{
  private authUtils = new RpcAuthUtils();
  private permissionServiceClient: PermissionServiceClient;

  constructor(private clientService: ClientService) {
    this.permissionServiceClient =
      this.clientService.getServiceInternalClient<PermissionServiceClient>(
        PermissionServiceDefinition,
      );
  }

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
          this.permissionServiceClient.validateOne(
            {
              permitted,
              entity: entity,
              entityId: entityId,
              action: 'write',
            },
            { metadata },
          ),
        );
      }
      if (asEntity && asEntityId) {
        validations.push(
          this.permissionServiceClient.validateOne(
            {
              permitted,
              entity: asEntity,
              entityId: asEntityId,
              action: 'write',
            },
            { metadata },
          ),
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
