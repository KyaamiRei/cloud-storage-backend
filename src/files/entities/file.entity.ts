import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ default: false })
  isFolder: boolean;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => File, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: File;

  @ManyToOne(() => User, (user) => user.files)
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
