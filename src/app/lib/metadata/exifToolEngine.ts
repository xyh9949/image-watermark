import type { ExifTags } from '@uswriting/exiftool';
import type { MetadataEditDraft, MetadataTag, MetadataWriteResult } from '@/app/types/metadata';

const WASM_ASSET_PATH = '/zeroperl.wasm';
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

const READ_ONLY_GROUPS = new Set(['File', 'Composite', 'ExifTool', 'System']);
const READ_ONLY_TAG_NAMES = new Set([
  'sourcefile',
  'directory',
  'filename',
  'filesize',
  'filemodifydate',
  'fileaccessdate',
  'filecreatedate',
  'filepermissions',
  'filetype',
  'filetypeextension',
  'mimetype',
  'imagewidth',
  'imageheight',
  'megapixels',
  'exifbyteorder',
  'encodingprocess',
  'bitspercomponent',
  'bitspersample',
  'colorcomponents',
  'ycbcrsubsampling',
]);

export const EMPTY_METADATA_DRAFT: MetadataEditDraft = {
  title: '',
  description: '',
  keywords: '',
  author: '',
  copyright: '',
  capturedAt: '',
  make: '',
  model: '',
  lens: '',
  orientation: '',
  software: '',
  comment: '',
  gpsLatitude: '',
  gpsLongitude: '',
  gpsAltitude: '',
};

type ExifToolJsonRow = Record<string, unknown>;
type ExifToolModule = typeof import('@uswriting/exiftool');

let exifToolPromise: Promise<ExifToolModule> | null = null;

function loadExifTool() {
  exifToolPromise ??= import('@uswriting/exiftool');
  return exifToolPromise;
}

async function fetchWasmAsset(...args: unknown[]) {
  const [input, init] = args;
  const shouldUsePublicAsset = typeof input === 'string' && input.endsWith('zeroperl.wasm');
  return fetch(shouldUsePublicAsset ? WASM_ASSET_PATH : input as RequestInfo | URL, init as RequestInit | undefined);
}

export function isSupportedMetadataFile(file: File) {
  if (SUPPORTED_MIME_TYPES.has(file.type)) return true;

  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? SUPPORTED_EXTENSIONS.has(extension) : false;
}

export function getSupportedMetadataFormats() {
  return 'JPG, JPEG, PNG, WebP';
}

export async function readMetadata(file: File): Promise<MetadataTag[]> {
  if (!isSupportedMetadataFile(file)) {
    throw new Error(`Unsupported file format. Supported formats: ${getSupportedMetadataFormats()}.`);
  }

  const exifTool = await loadExifTool();
  const result = await exifTool.parseMetadata<ExifToolJsonRow[]>(file, {
    args: ['-json', '-G1', '-a', '-s'],
    fetch: fetchWasmAsset,
    transform: (data) => JSON.parse(data) as ExifToolJsonRow[],
  });

  if (!result.success) {
    throw new Error(result.error || 'ExifTool could not read metadata from this file.');
  }

  const row = result.data[0] ?? {};
  return Object.entries(row)
    .map(([rawKey, value]) => createMetadataTag(rawKey, value))
    .sort((a, b) => {
      const groupSort = a.group.localeCompare(b.group);
      return groupSort === 0 ? a.name.localeCompare(b.name) : groupSort;
    });
}

export async function writeMetadataEntries(
  file: File,
  entries: ExifTags,
  outputSuffix = 'metadata'
): Promise<MetadataWriteResult> {
  const exifTool = await loadExifTool();
  const entryList = Object.entries(entries);
  const failedTags: MetadataWriteResult['failedTags'] = [];
  let workingFile = file;
  let wroteAnyTag = false;

  if (entryList.length === 0) {
    return {
      success: true,
      file,
      failedTags,
    };
  }

  const batchResult = await exifTool.writeMetadata(file, entries, {
    fetch: fetchWasmAsset,
  });

  if (batchResult.success) {
    return {
      success: true,
      file: createOutputFile(file, batchResult.data, outputSuffix),
      failedTags,
    };
  }

  const batchError = batchResult.error || 'ExifTool could not write metadata to this file.';

  for (const [key, value] of entryList) {
    const result = await exifTool.writeMetadata(workingFile, { [key]: value }, {
      fetch: fetchWasmAsset,
    });

    if (result.success) {
      wroteAnyTag = true;
      workingFile = createOutputFile(file, result.data, outputSuffix);
    } else {
      failedTags.push({
        key,
        error: result.error || 'ExifTool could not write this tag.',
      });
    }
  }

  if (!wroteAnyTag && failedTags.length > 0) {
    return {
      success: false,
      failedTags,
      error: batchError,
    };
  }

  if (!wroteAnyTag) {
    return {
      success: true,
      file,
      failedTags,
    };
  }

  return {
    success: true,
    file: workingFile,
    failedTags,
  };
}

export async function copyWritableMetadata(
  sourceFile: File,
  targetFile: File,
  outputSuffix = 'metadata'
): Promise<MetadataWriteResult> {
  const tags = await readMetadata(sourceFile);
  const entries = buildWritableMetadataEntries(tags);
  return writeMetadataEntries(targetFile, entries, outputSuffix);
}

export async function clearMetadata(file: File, outputSuffix = 'clean'): Promise<MetadataWriteResult> {
  return writeWithRawArgs(file, ['-all='], outputSuffix);
}

export async function clearGps(file: File, outputSuffix = 'nogps'): Promise<MetadataWriteResult> {
  return writeWithRawArgs(file, ['-gps:all=', '-xmp:geotag=', '-xmp:geotime='], outputSuffix);
}

export async function clearSelectedMetadata(file: File, tagKeys: string[]): Promise<MetadataWriteResult> {
  const entries = Object.fromEntries(tagKeys.map((key) => [key, ''])) as ExifTags;
  return writeMetadataEntries(file, entries, 'metadata');
}

export function downloadModifiedFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function buildDraftFromTags(tags: MetadataTag[]): MetadataEditDraft {
  return {
    title: findTagDisplayValue(tags, ['Title', 'ObjectName']),
    description: findTagDisplayValue(tags, ['Description', 'ImageDescription', 'Caption-Abstract']),
    keywords: findTagDisplayValue(tags, ['Keywords', 'Subject']),
    author: findTagDisplayValue(tags, ['Artist', 'Creator', 'Author', 'By-line']),
    copyright: findTagDisplayValue(tags, ['Copyright', 'Rights']),
    capturedAt: toDateTimeLocal(findTagDisplayValue(tags, ['DateTimeOriginal', 'CreateDate', 'DateCreated'])),
    make: findTagDisplayValue(tags, ['Make']),
    model: findTagDisplayValue(tags, ['Model']),
    lens: findTagDisplayValue(tags, ['LensModel', 'Lens']),
    orientation: findTagDisplayValue(tags, ['Orientation']),
    software: findTagDisplayValue(tags, ['Software']),
    comment: findTagDisplayValue(tags, ['Comment', 'UserComment']),
    gpsLatitude: extractCoordinate(findTagDisplayValue(tags, ['GPSLatitude'])),
    gpsLongitude: extractCoordinate(findTagDisplayValue(tags, ['GPSLongitude'])),
    gpsAltitude: findTagDisplayValue(tags, ['GPSAltitude']).replace(/\s*m$/i, ''),
  };
}

export function buildCommonMetadataEntries(
  draft: MetadataEditDraft,
  baseDraft: MetadataEditDraft
): ExifTags {
  const entries: ExifTags = {};
  const addIfChanged = (
    field: keyof MetadataEditDraft,
    tagNames: string[],
    transform: (value: string) => ExifTags[string] = (value) => value
  ) => {
    if (draft[field] === baseDraft[field]) return;
    const value = draft[field].trim();
    const tagValue = value ? transform(value) : '';
    for (const tagName of tagNames) {
      entries[tagName] = tagValue;
    }
  };

  addIfChanged('title', ['Title', 'ObjectName']);
  addIfChanged('description', ['Description', 'ImageDescription', 'Caption-Abstract']);
  addIfChanged('keywords', ['Keywords', 'Subject'], (value) => splitKeywords(value));
  addIfChanged('author', ['Artist', 'Creator', 'Author']);
  addIfChanged('copyright', ['Copyright', 'Rights']);
  addIfChanged('capturedAt', ['DateTimeOriginal', 'CreateDate'], toExifDateTime);
  addIfChanged('make', ['Make']);
  addIfChanged('model', ['Model']);
  addIfChanged('lens', ['LensModel']);
  addIfChanged('orientation', ['Orientation']);
  addIfChanged('software', ['Software']);
  addIfChanged('comment', ['Comment', 'UserComment']);

  addGpsEntries(entries, draft, baseDraft);

  return entries;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${Number(value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1))} ${units[unitIndex]}`;
}

function addGpsEntries(entries: ExifTags, draft: MetadataEditDraft, baseDraft: MetadataEditDraft) {
  const latitudeChanged = draft.gpsLatitude !== baseDraft.gpsLatitude;
  const longitudeChanged = draft.gpsLongitude !== baseDraft.gpsLongitude;
  const altitudeChanged = draft.gpsAltitude !== baseDraft.gpsAltitude;

  if (latitudeChanged) {
    const latitude = Number.parseFloat(draft.gpsLatitude);
    if (Number.isFinite(latitude)) {
      entries.GPSLatitude = Math.abs(latitude);
      entries.GPSLatitudeRef = latitude < 0 ? 'S' : 'N';
    } else {
      entries.GPSLatitude = '';
      entries.GPSLatitudeRef = '';
    }
  }

  if (longitudeChanged) {
    const longitude = Number.parseFloat(draft.gpsLongitude);
    if (Number.isFinite(longitude)) {
      entries.GPSLongitude = Math.abs(longitude);
      entries.GPSLongitudeRef = longitude < 0 ? 'W' : 'E';
    } else {
      entries.GPSLongitude = '';
      entries.GPSLongitudeRef = '';
    }
  }

  if (altitudeChanged) {
    const altitude = Number.parseFloat(draft.gpsAltitude);
    if (Number.isFinite(altitude)) {
      entries.GPSAltitude = Math.abs(altitude);
      entries.GPSAltitudeRef = altitude < 0 ? 1 : 0;
    } else {
      entries.GPSAltitude = '';
      entries.GPSAltitudeRef = '';
    }
  }
}

async function writeWithRawArgs(file: File, args: string[], outputSuffix: string): Promise<MetadataWriteResult> {
  const exifTool = await loadExifTool();
  const result = await exifTool.writeMetadata(file, {}, {
    args,
    fetch: fetchWasmAsset,
  });

  if (!result.success) {
    return {
      success: false,
      failedTags: [],
      error: result.error || 'ExifTool could not write this file.',
    };
  }

  return {
    success: true,
    file: createOutputFile(file, result.data, outputSuffix),
    failedTags: [],
  };
}

function createMetadataTag(rawKey: string, value: unknown): MetadataTag {
  const separatorIndex = rawKey.indexOf(':');
  const rawGroup = separatorIndex > -1 ? rawKey.slice(0, separatorIndex) : 'File';
  const name = separatorIndex > -1 ? rawKey.slice(separatorIndex + 1) : rawKey;
  const group = normalizeGroup(rawGroup, name);
  const displayValue = displayMetadataValue(value);

  return {
    group,
    name,
    key: rawKey,
    value,
    displayValue,
    editable: isEditableTag(group, rawGroup, name, value),
    changed: false,
  };
}

function normalizeGroup(rawGroup: string, name: string) {
  if (name === 'SourceFile') return 'File';
  if (rawGroup.startsWith('XMP')) return 'XMP';
  if (rawGroup.startsWith('IPTC')) return 'IPTC';
  if (rawGroup.startsWith('ICC')) return 'ICC';
  if (rawGroup.startsWith('PNG')) return 'PNG';
  if (rawGroup.startsWith('WebP')) return 'WebP';
  if (rawGroup === 'Composite') return 'Composite';
  if (rawGroup === 'ExifTool') return 'ExifTool';
  if (rawGroup === 'System') return 'System';
  if (rawGroup === 'File') return 'File';
  if (['EXIF', 'IFD0', 'IFD1', 'ExifIFD', 'GPS', 'InteropIFD', 'MakerNotes'].includes(rawGroup)) return 'EXIF';
  return rawGroup || 'File';
}

function isEditableTag(group: string, rawGroup: string, name: string, value: unknown) {
  const normalizedName = normalizeTagName(name);
  if (READ_ONLY_GROUPS.has(group)) return false;
  if (READ_ONLY_TAG_NAMES.has(normalizedName)) return false;
  if (rawGroup.toLowerCase().includes('maker')) return false;
  if (normalizedName.includes('thumbnail')) return false;
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) return false;
  return true;
}

function displayMetadataValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') return '';
  if (Array.isArray(value)) return value.map(displayMetadataValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function findTagDisplayValue(tags: MetadataTag[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeTagName);
  const tag = tags.find((item) => {
    const normalizedName = normalizeTagName(item.name);
    const normalizedKey = normalizeTagName(item.key.split(':').pop() ?? item.key);
    return normalizedAliases.includes(normalizedName) || normalizedAliases.includes(normalizedKey);
  });

  return tag?.displayValue ?? '';
}

function normalizeTagName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildWritableMetadataEntries(tags: MetadataTag[]): ExifTags {
  const entries: ExifTags = {};

  for (const tag of tags) {
    if (!tag.editable) continue;

    const value = toWritableTagValue(tag.value);
    if (typeof value === 'undefined') continue;

    entries[tag.key] = value;
  }

  return entries;
}

function toWritableTagValue(value: unknown): ExifTags[string] | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (!Array.isArray(value)) return undefined;

  const primitiveValues = value.filter((item): item is string | number | boolean => (
    typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
  ));

  return primitiveValues.length === value.length ? primitiveValues : undefined;
}

function toDateTimeLocal(value: string) {
  const dateMatch = value.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const timezoneOffsetMs = parsedDate.getTimezoneOffset() * 60_000;
  return new Date(parsedDate.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toExifDateTime(value: string) {
  return value.replace('T', ' ').replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1:$2:$3');
}

function splitKeywords(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractCoordinate(value: string) {
  if (!value) return '';

  const decimal = Number.parseFloat(value);
  if (Number.isFinite(decimal) && /^-?\d+(\.\d+)?/.test(value.trim())) {
    return String(decimal);
  }

  const dms = value.match(/(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)?\D*(\d+(?:\.\d+)?)?.*?([NSEW])/i);
  if (!dms) return value;

  const degrees = Number.parseFloat(dms[1] ?? '0');
  const minutes = Number.parseFloat(dms[2] ?? '0');
  const seconds = Number.parseFloat(dms[3] ?? '0');
  const direction = dms[4]?.toUpperCase();
  const sign = direction === 'S' || direction === 'W' ? -1 : 1;
  const coordinate = sign * (degrees + minutes / 60 + seconds / 3600);

  return Number.isFinite(coordinate) ? String(Number(coordinate.toFixed(6))) : value;
}

function createOutputFile(sourceFile: File, data: ArrayBuffer, suffix: string) {
  return new File([data], createOutputName(sourceFile.name, suffix), {
    type: sourceFile.type || 'application/octet-stream',
    lastModified: Date.now(),
  });
}

function createOutputName(fileName: string, suffix: string) {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) return `${fileName}_${suffix}`;

  const baseName = fileName.slice(0, dotIndex);
  const extension = fileName.slice(dotIndex);
  return `${baseName}_${suffix}${extension}`;
}
