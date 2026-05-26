import { BadRequestException, ValidationError } from "@nestjs/common";

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

function mapConstraintMessage(
  fieldPath: string,
  rule: string,
  rawMessage: string,
): string {
  const field = fieldPath || "Este campo";

  if (rule === "isNotEmpty") {
    return `${field} es obligatorio`;
  }

  if (rule === "isString") {
    return `${field} debe ser un texto`;
  }

  if (rule === "isEmail") {
    return `${field} debe tener un correo valido`;
  }

  if (rule === "isInt") {
    return `${field} debe ser un numero entero`;
  }

  if (rule === "isDateString") {
    return `${field} debe tener formato de fecha valido (YYYY-MM-DD)`;
  }

  if (rule === "min") {
    const match = /must not be less than\s+(-?\d+(?:\.\d+)?)/i.exec(rawMessage);
    return match
      ? `${field} debe ser mayor o igual a ${match[1]}`
      : `${field} tiene un valor menor al permitido`;
  }

  if (rule === "max") {
    const match = /must not be greater than\s+(-?\d+(?:\.\d+)?)/i.exec(rawMessage);
    return match
      ? `${field} debe ser menor o igual a ${match[1]}`
      : `${field} tiene un valor mayor al permitido`;
  }

  if (rule === "minLength") {
    const match = /must be longer than or equal to\s+(\d+)\s+characters/i.exec(
      rawMessage,
    );
    return match
      ? `${field} debe tener al menos ${match[1]} caracteres`
      : `${field} no cumple la longitud minima`;
  }

  if (rule === "maxLength") {
    const match = /must be shorter than or equal to\s+(\d+)\s+characters/i.exec(
      rawMessage,
    );
    return match
      ? `${field} no puede superar ${match[1]} caracteres`
      : `${field} supera la longitud permitida`;
  }

  if (rule === "whitelistValidation") {
    return `${field} no es un campo permitido`;
  }

  return `${field} tiene un valor no valido`;
}

function collectValidationErrors(
  errors: ValidationError[],
  parentPath = "",
): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const [rule, message] of Object.entries(error.constraints)) {
        messages.push(mapConstraintMessage(path, rule, toText(message)));
      }
    }

    if (error.children?.length) {
      messages.push(...collectValidationErrors(error.children, path));
    }
  }

  return messages;
}

export function buildValidationException(errors: ValidationError[]) {
  const messages = collectValidationErrors(errors);

  return new BadRequestException({
    success: false,
    message: "Revisa los datos ingresados",
    errors: messages.length
      ? [...new Set(messages)]
      : ["Hay campos con valores no validos"],
  });
}
