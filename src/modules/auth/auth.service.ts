import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        personId: true,
        status: true,
        role: { select: { name: true } },
        person: {
          select: {
            firstName: true,
            middleName: true,
            firstLastname: true,
            secondLastname: true,
          },
        },
      },
    });

    if (!user || !user.role) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      throw new UnauthorizedException("Usuario inactivo");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    const expiresInRaw = process.env.JWT_ACCESS_EXPIRES_IN ?? "1h";
    const expiresInSeconds = this.parseTtlToSeconds(expiresInRaw);
    const accessToken = await this.jwtService.signAsync(payload, {
      secret:
        process.env.JWT_ACCESS_SECRET ??
        process.env.JWT_SECRET ??
        "dev-access-secret-change-me",
      expiresIn: expiresInSeconds,
    });

    const fullName = [
      user.person.firstName,
      user.person.middleName,
      user.person.firstLastname,
      user.person.secondLastname,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: expiresInRaw,
      expiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        personId: user.personId,
        fullName,
        role: user.role.name,
        status: user.status,
      },
    };
  }

  async getProfile(userId: number) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        role: { select: { id: true, name: true } },
        person: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            firstLastname: true,
            secondLastname: true,
            phone: true,
          },
        },
      },
    });
  }

  private parseTtlToSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) {
      return 3600;
    }

    const value = Number(match[1]);
    const unit = match[2];
    const factor: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * factor[unit];
  }
}