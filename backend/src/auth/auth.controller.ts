import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Response, Request as ExpressRequest } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshCookieOptions() {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const refreshTokenExpiration =
      this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION') ?? 60 * 60 * 24 * 7;

    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProd,
      path: '/auth/refresh',
      maxAge: refreshTokenExpiration * 1000,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    res.cookie('refreshToken', result.refreshToken, this.getRefreshCookieOptions());
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    res.cookie('refreshToken', result.refreshToken, this.getRefreshCookieOptions());
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(
    @Request() req,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const request = req as ExpressRequest;
    const refreshToken =
      request.cookies?.refreshToken || refreshTokenDto?.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is missing');
    }

    const result = await this.authService.refreshTokens(req.user.id, refreshToken);
    res.cookie('refreshToken', result.refreshToken, this.getRefreshCookieOptions());
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', this.getRefreshCookieOptions());
    return this.authService.logout(req.user.id);
  }
}

