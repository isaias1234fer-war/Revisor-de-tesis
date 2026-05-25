import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { role, ...userData } = data;
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        role,
        password: hashedPassword,
      },
    });

    // Crear el perfil correspondiente según el rol
    if (role === Role.STUDENT) {
      await this.prisma.studentProfile.create({
        data: { userId: user.id }
      });
    } else if (role === Role.ADVISOR) {
      await this.prisma.advisorProfile.create({
        data: { userId: user.id }
      });
    } else if (role === Role.COORDINATOR) {
      await this.prisma.coordinatorProfile.create({
        data: { userId: user.id }
      });
    } else if (role === Role.ADMIN) {
      await this.prisma.adminProfile.create({
        data: { userId: user.id }
      });
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        advisorProfile: true,
        coordinatorProfile: true,
        adminProfile: true,
      },
    });
  }
}
