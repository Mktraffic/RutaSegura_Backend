import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  JwtPayload,
  RequestUser,
} from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ??
        process.env.JWT_SECRET ??
        "dev-access-secret-change-me",
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        status: true,
        role: { select: { name: true } },
      },
    });

    if (!user || !user.role) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      throw new UnauthorizedException("User is inactive");
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };
  }
}