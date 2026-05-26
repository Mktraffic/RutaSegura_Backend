import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { LoginDto } from "./dto/login.dto";
import { RequestUser } from "./interfaces/jwt-payload.interface";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("profile")
  profile(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user.userId);
  }

  @Roles("coordinator", "coordinador")
  @Get("rbac/coordinator")
  onlyCoordinator() {
    return {
      message: "Acceso permitido para coordinator",
    };
  }

  @Roles("driver", "conductor")
  @Get("rbac/driver")
  onlyDriver() {
    return {
      message: "Acceso permitido para driver",
    };
  }
}