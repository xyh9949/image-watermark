export type MetadataGroup =
  | 'File'
  | 'EXIF'
  | 'XMP'
  | 'IPTC'
  | 'ICC'
  | 'PNG'
  | 'WebP'
  | 'Composite'
  | 'ExifTool'
  | 'System'
  | string;

export type MetadataStatus = 'idle' | 'reading' | 'ready' | 'writing' | 'error';

export interface MetadataTag {
  group: MetadataGroup;
  name: string;
  key: string;
  value: unknown;
  displayValue: string;
  editable: boolean;
  changed: boolean;
  error?: string;
}

export interface MetadataEditDraft {
  title: string;
  description: string;
  keywords: string;
  author: string;
  copyright: string;
  capturedAt: string;
  make: string;
  model: string;
  lens: string;
  orientation: string;
  software: string;
  comment: string;
  gpsLatitude: string;
  gpsLongitude: string;
  gpsAltitude: string;
}

export interface MetadataFileState {
  id: string;
  originalFile: File;
  currentFile: File;
  tags: MetadataTag[];
  draft: MetadataEditDraft;
  baseDraft: MetadataEditDraft;
  selectedTagKeys: string[];
  status: MetadataStatus;
  modified: boolean;
  error?: string;
}

export interface MetadataWriteResult {
  success: boolean;
  file?: File;
  tags?: MetadataTag[];
  failedTags: Array<{
    key: string;
    error: string;
  }>;
  error?: string;
}
