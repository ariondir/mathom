import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { File } from './entities/file.entity';
import { Contact } from './entities/contact.entity';
import { Share } from './entities/share.entity';
import { Invite } from './entities/invite.entity';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'mathom.sqlite',
      entities: [File, Contact, Share, Invite],
      synchronize: true,
    }),
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
