import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() body: any) {
    const { email, password, roles } = body;
    return this.authService.signUp(email, password, roles);
  }

  @Post('signin')
  signIn(@Body() body: any) {
    const { email, password } = body;
    return this.authService.signIn(email, password);
  }

  @Post('refresh')
  refresh(@Body() body: any) {
    const { refreshToken } = body;
    return this.authService.refresh(refreshToken);
  }
}
