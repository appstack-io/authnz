import { RpcException } from '@nestjs/microservices';
import * as grpc from '@grpc/grpc-js';

export class RpcPermissionDeniedException extends RpcException {
  constructor() {
    super({
      message: 'permission denied',
      code: grpc.status.PERMISSION_DENIED,
    });
  }
}
