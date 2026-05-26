import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

type ErrorBody = {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const payload = this.buildErrorBody(exception, request?.url || "");
    response.status(payload.statusCode).json(payload);
  }

  private buildErrorBody(exception: unknown, path: string): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const original = exception.getResponse();

      const normalized = this.normalizeHttpExceptionPayload(original);
      return {
        success: false,
        statusCode,
        message: normalized.message,
        ...(normalized.errors?.length ? { errors: normalized.errors } : {}),
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaKnownError(exception, path);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Revisa la informacion ingresada",
        errors: [
          "Hay datos incompletos o con formato no valido",
        ],
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Tuvimos un problema interno. Intenta nuevamente en unos minutos",
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private normalizeHttpExceptionPayload(response: string | object): {
    message: string;
    errors?: string[];
  } {
    if (typeof response === "string") {
      return { message: response };
    }

    const body = response as {
      message?: string | string[];
      error?: string;
      errors?: string[];
    };

    if (Array.isArray(body.message)) {
      return {
        message: "Revisa la informacion ingresada",
        errors: body.message,
      };
    }

    return {
      message: body.message || body.error || "No pudimos completar esta accion",
      ...(body.errors?.length ? { errors: body.errors } : {}),
    };
  }

  private mapPrismaKnownError(
    error: Prisma.PrismaClientKnownRequestError,
    path: string,
  ): ErrorBody {
    const target = this.extractTarget(error.meta?.target);

    if (error.code === "P2002") {
      return {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: "No pudimos guardar la informacion",
        errors: [
          target
            ? `Ya existe un registro con ese ${target}`
            : "Ya existe un registro con esos mismos datos",
        ],
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (error.code === "P2003") {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: "No pudimos completar esta accion",
        errors: [
          target
            ? `El valor de ${target} no existe o no es valido`
            : "Uno de los datos relacionados no existe",
        ],
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (error.code === "P2025") {
      return {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: "No encontramos la informacion que buscas",
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (error.code === "P2000") {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: "No pudimos guardar la informacion",
        errors: [
          target
            ? `El valor para ${target} es demasiado largo`
            : "Uno de los campos tiene mas caracteres de los permitidos",
        ],
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: "No pudimos completar esta accion",
      errors: ["Verifica los datos e intenta nuevamente"],
      timestamp: new Date().toISOString(),
      path,
    };
  }

  private extractTarget(target: unknown): string | null {
    if (Array.isArray(target) && target.length > 0) {
      return target.join(", ");
    }

    if (typeof target === "string" && target.trim()) {
      return target;
    }

    return null;
  }
}