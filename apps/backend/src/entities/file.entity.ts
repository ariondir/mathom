import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Share } from './share.entity';

export enum FileSection {
  AUDIO = 'audio',
  VIDEO = 'video',
  BOOK = 'book',
  OTHER = 'other',
}

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  mimeType: string;

  @Column('integer')
  size: number;

  @Column({ type: 'text', default: FileSection.OTHER })
  section: FileSection;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Share, (share) => share.file)
  shares: Share[];
}
