import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

export interface EpubMetadata {
  title?: string;
  author?: string;
  coverBuffer?: Buffer;
  coverExt?: string;
}

export function parseEpub(filePath: string): EpubMetadata {
  try {
    const zip = new AdmZip(filePath);
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    // 1. Find OPF path from container.xml
    const containerEntry = zip.getEntry('META-INF/container.xml');
    if (!containerEntry) return {};

    const container = parser.parse(containerEntry.getData().toString('utf8'));
    const rootfile = container?.container?.rootfiles?.rootfile;
    const opfPath: string = Array.isArray(rootfile)
      ? rootfile[0]?.['@_full-path']
      : rootfile?.['@_full-path'];
    if (!opfPath) return {};

    // 2. Parse OPF
    const opfEntry = zip.getEntry(opfPath);
    if (!opfEntry) return {};

    const opf = parser.parse(opfEntry.getData().toString('utf8'));
    const metadata = opf?.package?.metadata;
    const manifestItems: any[] = (() => {
      const raw = opf?.package?.manifest?.item;
      if (!raw) return [];
      return Array.isArray(raw) ? raw : [raw];
    })();

    // 3. Extract title — dc:title may be a string or { #text, @_... }
    const rawTitle = metadata?.['dc:title'];
    const title: string | undefined =
      typeof rawTitle === 'string'
        ? rawTitle
        : typeof rawTitle?.['#text'] === 'string'
          ? rawTitle['#text']
          : undefined;

    // 4. Extract author — dc:creator may be string, object, or array
    const rawCreator = metadata?.['dc:creator'];
    const firstCreator = Array.isArray(rawCreator) ? rawCreator[0] : rawCreator;
    const author: string | undefined =
      typeof firstCreator === 'string'
        ? firstCreator
        : typeof firstCreator?.['#text'] === 'string'
          ? firstCreator['#text']
          : undefined;

    // 5. Find cover image
    const opfDir = opfPath.includes('/')
      ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
      : '';

    let coverItem: any;

    // Try: <meta name="cover" content="<id>">
    const metaArr: any[] = (() => {
      const raw = metadata?.meta;
      if (!raw) return [];
      return Array.isArray(raw) ? raw : [raw];
    })();
    const coverMeta = metaArr.find((m) => m?.['@_name'] === 'cover');
    if (coverMeta) {
      const coverId = coverMeta['@_content'];
      coverItem = manifestItems.find((item) => item?.['@_id'] === coverId);
    }

    // Fallback: item with properties="cover-image"
    if (!coverItem) {
      coverItem = manifestItems.find((item) =>
        item?.['@_properties']?.includes('cover-image'),
      );
    }

    if (coverItem) {
      const href: string = coverItem['@_href'];
      const mediaType: string = coverItem['@_media-type'] ?? 'image/jpeg';
      const coverEntry =
        zip.getEntry(opfDir + href) ?? zip.getEntry(href);
      if (coverEntry) {
        const ext = mediaType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
        return { title, author, coverBuffer: coverEntry.getData(), coverExt: ext };
      }
    }

    return { title, author };
  } catch {
    return {};
  }
}
