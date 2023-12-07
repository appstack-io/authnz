import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class HttpAuthInternalInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const httpContext = context.switchToHttp().getRequest();
    httpContext.internal = true;
    return next.handle();
  }
}
