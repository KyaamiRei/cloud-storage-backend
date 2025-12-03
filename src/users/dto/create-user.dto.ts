import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ default: 'test@mail.com' })
  email: string;

  @ApiProperty({ default: 'testName' })
  fullName: string;

  @ApiProperty({ default: '123123' })
  password: string;
}
