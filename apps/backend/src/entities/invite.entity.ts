import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
