import { Controller, Get, Post, Delete, Param, Body, Res, Req, NotFoundException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { createReadStream, statSync } from 'fs';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFileDto) {
    return this.filesService.create(dto.path);
  }

  // More-specific routes must come before :id wildcard
  @Delete('collection/:collectionId')
  removeCollection(@Param('collectionId') collectionId: string) {
    return this.filesService.removeCollection(collectionId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }

  @Get(':id/cover')
  async getCover(@Param('id') id: string, @Res() res: Response) {
    const coverPath = await this.filesService.getCoverPath(id);
    if (!coverPath) throw new NotFoundException('No cover for this file');
    res.sendFile(coverPath);
  }

  @Get(':id/stream')
  async stream(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const file = await this.filesService.findOne(id);
    if (!file) throw new NotFoundException();

    const { size } = statSync(file.path);
    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': file.mimeType,
      });
      createReadStream(file.path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': file.mimeType,
        'Accept-Ranges': 'bytes',
      });
      createReadStream(file.path).pipe(res);
    }
  }
}
