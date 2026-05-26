import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = String(user?.role ?? "").toLowerCase();
    const hasRole = requiredRoles
      .map((role) => role.toLowerCase())
      .includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException("No tienes permisos para realizar esta accion");
    }

    return true;
  }
}