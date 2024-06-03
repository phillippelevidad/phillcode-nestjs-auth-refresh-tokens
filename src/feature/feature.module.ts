import { AuthModule } from 'src/auth/auth.module';
import { Module } from '@nestjs/common';
import { FeatureController } from './feature.controller';

@Module({
  imports: [AuthModule],
  controllers: [FeatureController],
})
export class FeatureModule {}
