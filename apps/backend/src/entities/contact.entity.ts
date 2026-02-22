import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Share } from './share.entity';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  host: string;

  @Column('integer')
  port: number;

  @Column()
  publicKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Share, (share) => share.fromContact)
  sharesReceived: Share[];

  @OneToMany(() => Share, (share) => share.toContact)
  sharesSent: Share[];
}
