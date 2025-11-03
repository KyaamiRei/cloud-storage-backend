import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { File } from '../../files/entities/file.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 1073741824 }) // 1GB в байтах
  storageLimit: number;

  @Column({ default: 0 })
  usedStorage: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => File, (file) => file.user)
  files: File[];
}
