import { Module } from '@nestjs/common';
import { RpcAuthAssertInternalInterceptor } from './rpcAuthAssertInternal.interceptor';
import { RpcAuthInternalInterceptor } from './rpcAuthInternal.interceptor';
import { RpcAuthEntityAssertWriteableInterceptor } from './rpcAuthEntityAssertWriteable.interceptor';
import { RpcAuthEntityAssertReadableInterceptor } from './rpcAuthEntityAssertReadable.interceptor';
import { RpcAuthEntityCreateOwnershipInterceptor } from './rpcAuthEntityCreateOwnership.interceptor';
import { RpcAuthExternalInterceptor } from './rpcAuthExternal.interceptor';
import { RpcAuthRequiredInterceptor } from './rpcAuthRequired.interceptor';

@Module({
  exports: [
    RpcAuthAssertInternalInterceptor,
    RpcAuthInternalInterceptor,
    RpcAuthEntityAssertWriteableInterceptor,
    RpcAuthEntityAssertReadableInterceptor,
    RpcAuthEntityCreateOwnershipInterceptor,
    RpcAuthExternalInterceptor,
    RpcAuthRequiredInterceptor,
  ],
})
export class RpcAuthModule {}

export * from './rpcAuthAssertInternal.interceptor';
export * from './rpcAuthInternal.interceptor';
export * from './rpcAuthEntityAssertWriteable.interceptor';
export * from './rpcAuthEntityAssertReadable.interceptor';
export * from './rpcAuthEntityCreateOwnership.interceptor';
export * from './rpcAuthExternal.interceptor';
export * from './rpcAuthRequired.interceptor';
export * from './rpcAuthenticatedUserId.decorator';
export * from './rpcAuthAlsoWriteableAs.interceptor';
export * from './rpcAuthReadableAs.interceptor';
