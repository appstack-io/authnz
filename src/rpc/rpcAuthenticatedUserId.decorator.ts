import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RpcAuthUtils } from './rpcAuthUtils';

const authUtils = new RpcAuthUtils();

export const RpcAuthenticatedUserId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const { permitted } = authUtils.getAuthData(context);
    const permittedUser = permitted.find((p) => p.permittedEntity === 'user');
    return permittedUser.permittedEntityId;
  },
);
