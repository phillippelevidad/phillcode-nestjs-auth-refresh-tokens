/* eslint-disable @typescript-eslint/no-unused-vars */

import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { v4 as uuid } from 'uuid';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const scrypt = promisify(_scrypt);

const users = [];
const refreshTokens = [];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signUp(email: string, password: string, roles: string[] = []) {
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return new BadRequestException('Email in use');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const saltAndHash = `${salt}.${hash.toString('hex')}`;

    const user = {
      id: uuid(),
      email,
      password: saltAndHash,
      roles,
    };

    users.push(user);

    console.log('Signed up', user);
    const { password: _, ...result } = user;
    return result;
  }

  async signIn(email: string, password: string) {
    const user = users.find((user) => user.email === email);
    if (!user) {
      return new UnauthorizedException('Invalid credentials');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash != hash.toString('hex')) {
      return new UnauthorizedException('Invalid credentials');
    }

    console.log('Signed in', user);
    const payload = {
      username: user.email,
      sub: user.id,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      { expiresIn: '60s' },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '1h' },
    );

    refreshTokens.push({ value: refreshToken });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const storedToken = refreshTokens.find(
      (token) => token.value === refreshToken,
    );
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = this.jwtService.verify(refreshToken);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = users.find((user) => user.id === payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newPayload = {
      username: user.email,
      sub: user.id,
      roles: user.roles,
    };

    const newAccessToken = this.jwtService.sign(
      { ...newPayload, type: 'access' },
      { expiresIn: '60s' },
    );

    const newRefreshToken = this.jwtService.sign(
      { ...newPayload, type: 'refresh' },
      { expiresIn: '1h' },
    );

    storedToken.value = newRefreshToken;

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
