import { ExecutionContext } from '@nestjs/common';

export class AuthUtils {
  httpIsExternal(context: ExecutionContext): boolean {
    const httpContext = context.switchToHttp().getRequest();
    const external = httpContext.external;
    return external;
  }
}
