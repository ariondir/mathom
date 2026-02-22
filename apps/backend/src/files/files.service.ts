import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { statSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join, extname } from 'path';
import { randomUUID } from 'crypto';
import * as mime from 'mime-types';
import AdmZip from 'adm-zip';
import { File, FileSection } from '../entities/file.entity';
import { parseEpub } from './epub.util';

const EXTRACTABLE_EXTENSIONS = new Set([
  '.mp3', '.m4a', '.m4b', '.ogg', '.flac', '.wav', '.aac', '.opus',
  '.mp4', '.mkv', '.avi', '.mov', '.webm',
  '.epub', '.pdf', '.mobi',
]);

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

@Injectable()
export class FilesService {
  private readonly coversDir  = join(process.cwd(), 'covers');
  private readonly extractDir = join(process.cwd(), 'extracted');

  constructor(
    @InjectRepository(File)
    private readonly filesRepo: Repository<File>,
  ) {}

  findAll(): Promise<File[]> {
    return this.filesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<File | null> {
    return this.filesRepo.findOneBy({ id });
  }

  async create(filePath: string): Promise<File[]> {
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
      return this.createFromZip(filePath);
    }
    return [await this.createSingle(filePath)];
  }

  async remove(id: string): Promise<void> {
    const file = await this.filesRepo.findOneBy({ id });
    if (!file) throw new NotFoundException(`File ${id} not found`);
    await this.filesRepo.remove(file);
  }

  async removeCollection(collectionId: string): Promise<void> {
    const files = await this.filesRepo.findBy({ collectionId });
    if (files.length === 0) throw new NotFoundException(`Collection ${collectionId} not found`);
    await this.filesRepo.remove(files);
  }

  async getCoverPath(id: string): Promise<string | null> {
    const file = await this.filesRepo.findOneBy({ id });
    return file?.coverPath ?? null;
  }

  private async createFromZip(zipPath: string): Promise<File[]> {
    const zip = new AdmZip(zipPath);
    const allEntries = zip.getEntries().filter((e) => !e.isDirectory);

    const mediaEntries = allEntries.filter((e) =>
      EXTRACTABLE_EXTENSIONS.has(extname(e.name).toLowerCase()),
    );

    if (mediaEntries.length === 0) {
      return [await this.createSingle(zipPath)];
    }

    if (!existsSync(this.extractDir)) mkdirSync(this.extractDir, { recursive: true });
    if (!existsSync(this.coversDir))  mkdirSync(this.coversDir,  { recursive: true });

    // Derive a human-readable collection name from the zip filename
    const collectionId   = randomUUID();
    const collectionName = this.zipNameToTitle(basename(zipPath, extname(zipPath)));

    // Look for a cover image inside the zip
    let collectionCoverPath: string | null = null;
    const imageEntry = allEntries.find((e) =>
      IMAGE_EXTENSIONS.has(extname(e.name).toLowerCase()),
    );
    if (imageEntry) {
      const coverDest = join(this.coversDir, `${collectionId}${extname(imageEntry.name)}`);
      zip.extractEntryTo(imageEntry, this.coversDir, false, true);
      // adm-zip extracts to dir using the entry name; rename to our id-based name
      const extracted = join(this.coversDir, imageEntry.name);
      if (existsSync(extracted)) {
        const fs = await import('fs');
        fs.renameSync(extracted, coverDest);
        collectionCoverPath = coverDest;
      }
    }

    // Sort entries so chapters are in filename order
    const sorted = [...mediaEntries].sort((a, b) => a.name.localeCompare(b.name));

    const results: File[] = [];
    for (const entry of sorted) {
      const destPath = join(this.extractDir, entry.name);
      zip.extractEntryTo(entry, this.extractDir, false, true);
      const file = await this.createSingle(destPath, {
        collectionId,
        collectionName,
        coverPath: collectionCoverPath,
      });
      results.push(file);
    }
    return results;
  }

  private async createSingle(
    filePath: string,
    overrides: Partial<Pick<File, 'collectionId' | 'collectionName' | 'coverPath'>> = {},
  ): Promise<File> {
    const stats    = statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const section  = this.detectSection(mimeType);

    let title:     string | null = null;
    let author:    string | null = null;
    let coverPath: string | null = overrides.coverPath ?? null;

    if (mimeType === 'application/epub+zip') {
      const meta = parseEpub(filePath);
      title  = meta.title  ?? null;
      author = meta.author ?? null;

      if (meta.coverBuffer && !coverPath) {
        if (!existsSync(this.coversDir)) mkdirSync(this.coversDir, { recursive: true });
        const tmpPath = join(this.coversDir, `tmp_${Date.now()}.${meta.coverExt ?? 'jpg'}`);
        writeFileSync(tmpPath, meta.coverBuffer);
        coverPath = tmpPath;
      }
    }

    const file = this.filesRepo.create({
      path:           filePath,
      name:           basename(filePath),
      mimeType,
      size:           stats.size,
      section,
      title,
      author,
      coverPath,
      collectionId:   overrides.collectionId   ?? null,
      collectionName: overrides.collectionName ?? null,
    });

    return this.filesRepo.save(file);
  }

  private detectSection(mimeType: string): FileSection {
    if (mimeType.startsWith('audio/')) return FileSection.AUDIO;
    if (mimeType.startsWith('video/')) return FileSection.VIDEO;
    if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/epub+zip' ||
      mimeType === 'application/x-mobipocket-ebook'
    ) return FileSection.BOOK;
    return FileSection.OTHER;
  }

  /** "war_and_peace_librivox" → "War and Peace" */
  private zipNameToTitle(raw: string): string {
    const noise = /[\s_]*(librivox|64kb|128kb|mono|stereo)[\s_]*/gi;
    return raw
      .replace(noise, ' ')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
