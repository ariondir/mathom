import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { File } from './file.entity';
import { Contact } from './contact.entity';

export enum ShareDirection {
  SENT = 'sent',
  RECEIVED = 'received',
}

export enum ShareStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

@Entity()
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => File, (file) => file.shares)
  @JoinColumn()
  file: File;

  @ManyToOne(() => Contact, (contact) => contact.sharesReceived, { nullable: true })
  @JoinColumn()
  fromContact: Contact | null;

  @ManyToOne(() => Contact, (contact) => contact.sharesSent, { nullable: true })
  @JoinColumn()
  toContact: Contact | null;

  @Column({ type: 'text', default: ShareDirection.SENT })
  direction: ShareDirection;

  @Column({ type: 'text', default: ShareStatus.PENDING })
  status: ShareStatus;

  @Column('integer', { default: 0 })
  bytesTransferred: number;

  @CreateDateColumn()
  sharedAt: Date;
}
