import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      console.log(`Starting registration for: ${dto.email}`);
      
      // Check if email exists
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email already registered');

      const tenantName = dto.tenantName || 'Default';
      
      // Create or reuse tenant (Case-insensitive lookup)
      let tenant = await this.prisma.tenant.findFirst({
        where: { name: { equals: tenantName, mode: 'insensitive' } },
      });
      
      if (!tenant) {
        console.log(`Creating new tenant: ${tenantName}`);
        const slug = tenantName.toLowerCase().trim().replace(/\s+/g, '-');
        
        tenant = await this.prisma.tenant.create({
          data: {
            name: tenantName,
            slug: slug,
          },
        });
      }

      console.log(`Hashing password...`);
      const hashed = await bcrypt.hash(dto.password, 12);

      console.log(`Creating user record...`);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashed,
          firstName: dto.firstName,
          lastName: dto.lastName,
          tenantId: tenant.id,
        },
      });

      console.log(`Signing JWT token...`);
      return this.signToken(user.id, user.email, user.role, user.tenantId, user.firstName, user.lastName);
    } catch (error) {
      console.error('❌ Registration Error Detail:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        dto: { ...dto, password: '***' }
      });
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role, user.tenantId, user.firstName, user.lastName);
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true },
    });
  }

  private async signToken(userId: string, email: string, role: string, tenantId: string, firstName: string, lastName: string) {
    const payload = { sub: userId, email, role, tenantId, firstName, lastName };
    const token = await this.jwt.signAsync(payload);
    return { access_token: token, user: { id: userId, email, role, tenantId, firstName, lastName } };
  }
}
