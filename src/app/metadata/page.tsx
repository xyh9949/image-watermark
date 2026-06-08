'use client';

/* eslint-disable @next/next/no-img-element -- Local object URL previews cannot be optimized by next/image. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  CheckCircle2,
  Download,
  Eraser,
  FileImage,
  Loader2,
  MapPinOff,
  PackageOpen,
  PencilLine,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopNavigation } from '@/components/TopNavigation';
import { cn } from '@/lib/utils';
import { getCopy, getLocaleFromPathname, type Locale } from '@/app/lib/i18n';
import {
  buildCommonMetadataEntries,
  buildDraftFromTags,
  clearGps,
  clearMetadata,
  clearSelectedMetadata,
  downloadModifiedFile,
  EMPTY_METADATA_DRAFT,
  formatFileSize,
  getSupportedMetadataFormats,
  isSupportedMetadataFile,
  readMetadata,
  writeMetadataEntries,
} from '@/app/lib/metadata/exifToolEngine';
import type { MetadataEditDraft, MetadataFileState, MetadataTag } from '@/app/types/metadata';

const GROUP_OPTIONS = ['all', 'File', 'EXIF', 'XMP', 'IPTC', 'ICC', 'PNG', 'WebP', 'Composite'];

type MetadataCopy = ReturnType<typeof getCopy>['metadata'];
type OperationMode = 'clearAll' | 'clearGps' | 'clearSelected' | 'apply' | 'batchAll' | 'batchGps' | null;

function createFileState(file: File): MetadataFileState {
  return {
    id: createId(),
    originalFile: file,
    currentFile: file,
    tags: [],
    draft: { ...EMPTY_METADATA_DRAFT },
    baseDraft: { ...EMPTY_METADATA_DRAFT },
    selectedTagKeys: [],
    status: 'reading',
    modified: false,
  };
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ObjectUrlImage({ file, alt, className }: { file: Blob; alt: string; className?: string }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return <img src={url} alt={alt} className={className} />;
}

export default function MetadataPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).metadata;
  const [files, setFiles] = useState<MetadataFileState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [operationMode, setOperationMode] = useState<OperationMode>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFile = useMemo(
    () => files.find((fileState) => fileState.id === activeId) ?? null,
    [activeId, files]
  );

  const selectedFiles = useMemo(
    () => files.filter((fileState) => selectedFileIds.includes(fileState.id)),
    [files, selectedFileIds]
  );

  useEffect(() => {
    if (activeId && files.some((fileState) => fileState.id === activeId)) return;
    setActiveId(files[0]?.id ?? null);
  }, [activeId, files]);

  const updateFileState = useCallback((id: string, updater: (fileState: MetadataFileState) => MetadataFileState) => {
    setFiles((currentFiles) => currentFiles.map((fileState) => (
      fileState.id === id ? updater(fileState) : fileState
    )));
  }, []);

  const readAndStoreMetadata = useCallback(async (id: string, file: File, modified = false, failedTags: MetadataWriteResultTags = []) => {
    updateFileState(id, (fileState) => ({
      ...fileState,
      currentFile: file,
      status: 'reading',
      error: undefined,
    }));

    try {
      const tags = await readMetadata(file);
      const failedTagMap = new Map(failedTags.map((item) => [item.key, item.error]));
      const nextTags = tags.map((tag) => {
        const tagError = failedTagMap.get(tag.key);
        return tagError ? { ...tag, changed: true, error: tagError } : tag;
      });
      const draft = buildDraftFromTags(nextTags);

      updateFileState(id, (fileState) => ({
        ...fileState,
        currentFile: file,
        tags: nextTags,
        draft,
        baseDraft: draft,
        selectedTagKeys: fileState.selectedTagKeys.filter((key) => nextTags.some((tag) => tag.key === key)),
        status: 'ready',
        modified: fileState.modified || modified,
        error: failedTags.length ? copy.messages.partialWrite : undefined,
      }));
    } catch (metadataError) {
      updateFileState(id, (fileState) => ({
        ...fileState,
        currentFile: file,
        status: 'error',
        modified: fileState.modified || modified,
        error: metadataError instanceof Error ? metadataError.message : copy.messages.readFailed,
      }));
    }
  }, [copy.messages.partialWrite, copy.messages.readFailed, updateFileState]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const supportedFiles = acceptedFiles.filter(isSupportedMetadataFile);
    const unsupportedCount = acceptedFiles.length - supportedFiles.length;

    setNotice(null);
    setError(unsupportedCount > 0 ? copy.messages.unsupported(unsupportedCount, getSupportedMetadataFormats()) : null);

    if (supportedFiles.length === 0) return;

    const nextFileStates = supportedFiles.map(createFileState);
    setFiles((currentFiles) => [...currentFiles, ...nextFileStates]);
    setSelectedFileIds((currentIds) => [...currentIds, ...nextFileStates.map((fileState) => fileState.id)]);
    setActiveId((currentActiveId) => currentActiveId ?? nextFileStates[0].id);

    for (const fileState of nextFileStates) {
      void readAndStoreMetadata(fileState.id, fileState.currentFile);
    }
  }, [copy.messages, readAndStoreMetadata]);

  const clearFiles = () => {
    setFiles([]);
    setSelectedFileIds([]);
    setActiveId(null);
    setNotice(null);
    setError(null);
  };

  const removeFile = (id: string) => {
    setFiles((currentFiles) => currentFiles.filter((fileState) => fileState.id !== id));
    setSelectedFileIds((currentIds) => currentIds.filter((fileId) => fileId !== id));
  };

  const updateDraft = (field: keyof MetadataEditDraft, value: string) => {
    if (!activeFile) return;
    updateFileState(activeFile.id, (fileState) => ({
      ...fileState,
      draft: {
        ...fileState.draft,
        [field]: value,
      },
    }));
  };

  const updateTagValue = (tagKey: string, value: string) => {
    if (!activeFile) return;
    updateFileState(activeFile.id, (fileState) => ({
      ...fileState,
      tags: fileState.tags.map((tag) => (
        tag.key === tagKey
          ? { ...tag, displayValue: value, changed: value !== displayMetadataValue(tag.value), error: undefined }
          : tag
      )),
    }));
  };

  const toggleTagSelection = (tagKey: string) => {
    if (!activeFile) return;
    updateFileState(activeFile.id, (fileState) => {
      const isSelected = fileState.selectedTagKeys.includes(tagKey);
      return {
        ...fileState,
        selectedTagKeys: isSelected
          ? fileState.selectedTagKeys.filter((key) => key !== tagKey)
          : [...fileState.selectedTagKeys, tagKey],
      };
    });
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFileIds((currentIds) => (
      currentIds.includes(id)
        ? currentIds.filter((fileId) => fileId !== id)
        : [...currentIds, id]
    ));
  };

  const applyEdits = async () => {
    if (!activeFile) return;

    setOperationMode('apply');
    setNotice(null);
    setError(null);

    const commonEntries = buildCommonMetadataEntries(activeFile.draft, activeFile.baseDraft);
    const advancedEntries = Object.fromEntries(
      activeFile.tags
        .filter((tag) => tag.editable && tag.changed)
        .map((tag) => [tag.key, parseEditedTagValue(tag)])
    );
    const entries = {
      ...commonEntries,
      ...advancedEntries,
    };

    if (Object.keys(entries).length === 0) {
      setNotice(copy.messages.noChanges);
      setOperationMode(null);
      return;
    }

    updateFileState(activeFile.id, (fileState) => ({ ...fileState, status: 'writing', error: undefined }));
    const result = await writeMetadataEntries(activeFile.currentFile, entries);

    if (result.success && result.file) {
      await readAndStoreMetadata(activeFile.id, result.file, true, result.failedTags);
      setNotice(result.failedTags.length ? copy.messages.partialWrite : copy.messages.writeSuccess);
    } else {
      markFailedTags(activeFile.id, result.failedTags, result.error || copy.messages.writeFailed);
      setError(result.error || copy.messages.writeFailed);
    }

    setOperationMode(null);
  };

  const runSingleClear = async (mode: 'all' | 'gps' | 'selected') => {
    if (!activeFile) return;

    setOperationMode(mode === 'all' ? 'clearAll' : mode === 'gps' ? 'clearGps' : 'clearSelected');
    setNotice(null);
    setError(null);
    updateFileState(activeFile.id, (fileState) => ({ ...fileState, status: 'writing', error: undefined }));

    const result = mode === 'all'
      ? await clearMetadata(activeFile.currentFile)
      : mode === 'gps'
        ? await clearGps(activeFile.currentFile)
        : await clearSelectedMetadata(activeFile.currentFile, activeFile.selectedTagKeys);

    if (result.success && result.file) {
      await readAndStoreMetadata(activeFile.id, result.file, true, result.failedTags);
      setNotice(
        mode === 'all'
          ? copy.messages.clearAllSuccess
          : mode === 'gps'
            ? copy.messages.clearGpsSuccess
            : copy.messages.clearSelectedSuccess
      );
    } else {
      markFailedTags(activeFile.id, result.failedTags, result.error || copy.messages.writeFailed);
      setError(result.error || copy.messages.writeFailed);
    }

    setOperationMode(null);
  };

  const runBatchClear = async (mode: 'all' | 'gps') => {
    if (selectedFiles.length === 0) return;

    setOperationMode(mode === 'all' ? 'batchAll' : 'batchGps');
    setNotice(null);
    setError(null);

    const completedFiles: File[] = [];
    const failedNames: string[] = [];

    for (const fileState of selectedFiles) {
      updateFileState(fileState.id, (currentFileState) => ({ ...currentFileState, status: 'writing', error: undefined }));
      const result = mode === 'all'
        ? await clearMetadata(fileState.currentFile)
        : await clearGps(fileState.currentFile);

      if (result.success && result.file) {
        completedFiles.push(result.file);
        await readAndStoreMetadata(fileState.id, result.file, true, result.failedTags);
      } else {
        failedNames.push(fileState.currentFile.name);
        updateFileState(fileState.id, (currentFileState) => ({
          ...currentFileState,
          status: 'error',
          error: result.error || copy.messages.writeFailed,
        }));
      }
    }

    if (completedFiles.length > 0) {
      await downloadZip(completedFiles, mode === 'all' ? 'metadata_cleaned' : 'metadata_gps_removed');
      setNotice(copy.messages.batchSuccess(completedFiles.length));
    }

    if (failedNames.length > 0) {
      setError(copy.messages.batchFailed(failedNames.length));
    }

    setOperationMode(null);
  };

  const downloadActiveFile = () => {
    if (!activeFile) return;
    downloadModifiedFile(activeFile.currentFile);
  };

  const markFailedTags = (id: string, failedTags: MetadataWriteResultTags, fallbackError: string) => {
    const failedTagMap = new Map(failedTags.map((item) => [item.key, item.error]));
    updateFileState(id, (fileState) => ({
      ...fileState,
      status: 'ready',
      error: fallbackError,
      tags: fileState.tags.map((tag) => {
        const tagError = failedTagMap.get(tag.key);
        return tagError ? { ...tag, error: tagError, changed: true } : tag;
      }),
    }));
  };

  const hasChangedFields = activeFile
    ? Object.keys(buildCommonMetadataEntries(activeFile.draft, activeFile.baseDraft)).length > 0 ||
      activeFile.tags.some((tag) => tag.editable && tag.changed)
    : false;

  const isBusy = operationMode !== null || files.some((fileState) => (
    fileState.status === 'reading' || fileState.status === 'writing'
  ));

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <h1 className="sr-only">{copy.page.srTitle}</h1>
      <TopNavigation />

      <div className="lg:hidden flex flex-col h-full">
        <div className="flex-shrink-0 p-4 bg-background text-center">
          <h2 className="text-2xl font-bold mb-1">{copy.page.mobileTitle}</h2>
          <p className="text-sm text-muted-foreground">{copy.page.mobileDescription}</p>
        </div>

        <Tabs defaultValue="upload" className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 grid w-[calc(100%-2rem)] grid-cols-3 m-4">
            <TabsTrigger value="upload">{copy.page.uploadTab}</TabsTrigger>
            <TabsTrigger value="view">{copy.page.viewTab}</TabsTrigger>
            <TabsTrigger value="edit">{copy.page.editTab}</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 overflow-auto p-4">
            <UploadPanel
              copy={copy}
              files={files}
              activeId={activeId}
              selectedFileIds={selectedFileIds}
              isBusy={isBusy}
              onDrop={onDrop}
              onClear={clearFiles}
              onRemoveFile={removeFile}
              onSelectFile={setActiveId}
              onToggleFileSelection={toggleFileSelection}
            />
          </TabsContent>

          <TabsContent value="view" className="flex-1 overflow-auto">
            <MetadataViewerPanel
              copy={copy}
              fileState={activeFile}
              onTagChange={updateTagValue}
              onToggleTagSelection={toggleTagSelection}
            />
          </TabsContent>

          <TabsContent value="edit" className="flex-1 overflow-auto p-4">
            <EditPanel
              copy={copy}
              locale={locale}
              fileState={activeFile}
              selectedFileCount={selectedFiles.length}
              operationMode={operationMode}
              hasChangedFields={hasChangedFields}
              onDraftChange={updateDraft}
              onApplyEdits={applyEdits}
              onClearAll={() => void runSingleClear('all')}
              onClearGps={() => void runSingleClear('gps')}
              onClearSelected={() => void runSingleClear('selected')}
              onBatchClearAll={() => void runBatchClear('all')}
              onBatchClearGps={() => void runBatchClear('gps')}
              onDownload={downloadActiveFile}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:flex flex-col h-full">
        <div className="flex-shrink-0 p-4 bg-background text-center">
          <h2 className="text-2xl font-bold mb-1">{copy.page.desktopTitle}</h2>
          <p className="text-sm text-muted-foreground">{copy.page.desktopDescription}</p>
        </div>

        {(notice || error) && (
          <div className="px-4 pb-3">
            <StatusMessage notice={notice} error={error} copy={copy} />
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-[3] min-w-0 border-r bg-background">
            <div className="h-full overflow-auto p-4">
              <UploadPanel
                copy={copy}
                files={files}
                activeId={activeId}
                selectedFileIds={selectedFileIds}
                isBusy={isBusy}
                onDrop={onDrop}
                onClear={clearFiles}
                onRemoveFile={removeFile}
                onSelectFile={setActiveId}
                onToggleFileSelection={toggleFileSelection}
              />
            </div>
          </div>

          <div className="flex-[6] min-w-0 overflow-hidden bg-muted/20">
            <MetadataViewerPanel
              copy={copy}
              fileState={activeFile}
              onTagChange={updateTagValue}
              onToggleTagSelection={toggleTagSelection}
            />
          </div>

          <div className="flex-[3] min-w-0 border-l bg-background">
            <div className="h-full overflow-auto p-4">
              <EditPanel
                copy={copy}
                locale={locale}
                fileState={activeFile}
                selectedFileCount={selectedFiles.length}
                operationMode={operationMode}
                hasChangedFields={hasChangedFields}
                onDraftChange={updateDraft}
                onApplyEdits={applyEdits}
                onClearAll={() => void runSingleClear('all')}
                onClearGps={() => void runSingleClear('gps')}
                onClearSelected={() => void runSingleClear('selected')}
                onBatchClearAll={() => void runBatchClear('all')}
                onBatchClearGps={() => void runBatchClear('gps')}
                onDownload={downloadActiveFile}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden px-4 pb-4">
        <StatusMessage notice={notice} error={error} copy={copy} />
      </div>

      <MetadataGeoContent locale={locale} />
    </div>
  );
}

type MetadataWriteResultTags = Array<{ key: string; error: string }>;

function StatusMessage({ notice, error, copy }: { notice: string | null; error: string | null; copy: MetadataCopy }) {
  if (!notice && !error) return null;

  return (
    <div className="space-y-2">
      {notice && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{copy.messages.noticeTitle}</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>{copy.messages.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function UploadPanel({
  copy,
  files,
  activeId,
  selectedFileIds,
  isBusy,
  onDrop,
  onClear,
  onRemoveFile,
  onSelectFile,
  onToggleFileSelection,
}: {
  copy: MetadataCopy;
  files: MetadataFileState[];
  activeId: string | null;
  selectedFileIds: string[];
  isBusy: boolean;
  onDrop: (files: File[]) => void;
  onClear: () => void;
  onRemoveFile: (id: string) => void;
  onSelectFile: (id: string) => void;
  onToggleFileSelection: (id: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {copy.upload.title}
            </CardTitle>
            {files.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear} disabled={isBusy}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg text-center transition-all cursor-pointer',
              files.length > 0 ? 'p-4' : 'p-8',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              isBusy ? 'opacity-60 cursor-not-allowed' : 'hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps()} />
            <div className="space-y-3">
              <Upload className={cn('mx-auto text-muted-foreground', files.length > 0 ? 'w-7 h-7' : 'w-12 h-12')} />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? copy.upload.release
                    : files.length > 0
                      ? copy.upload.addMoreHint
                      : copy.upload.emptyHint}
                </p>
                {files.length === 0 && (
                  <p className="text-xs text-muted-foreground">{copy.upload.support}</p>
                )}
              </div>
              <Button variant="outline" disabled={isBusy}>
                <Plus className="w-4 h-4" />
                {files.length > 0 ? copy.upload.addMore : copy.upload.choose}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="flex flex-col max-h-[68vh]">
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                {copy.upload.files} ({files.length})
              </h3>
              <Badge variant="secondary">{copy.upload.selected(selectedFileIds.length)}</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {files.map((fileState) => (
                <button
                  key={fileState.id}
                  type="button"
                  onClick={() => onSelectFile(fileState.id)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 p-2 rounded border transition-colors',
                    activeId === fileState.id ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedFileIds.includes(fileState.id)}
                    onChange={() => onToggleFileSelection(fileState.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="h-4 w-4 shrink-0"
                    aria-label={copy.upload.selectFile}
                  />
                  <div className="w-11 h-11 rounded bg-muted overflow-hidden shrink-0">
                    <ObjectUrlImage
                      file={fileState.currentFile}
                      alt={fileState.currentFile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{fileState.currentFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileState.currentFile.size)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <FileStatusBadge copy={copy} fileState={fileState} />
                      {fileState.modified && <Badge variant="outline">{copy.upload.modified}</Badge>}
                    </div>
                    {fileState.error && (
                      <p className="mt-1 text-xs text-destructive line-clamp-2">{fileState.error}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveFile(fileState.id);
                    }}
                    disabled={isBusy}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function FileStatusBadge({ copy, fileState }: { copy: MetadataCopy; fileState: MetadataFileState }) {
  if (fileState.status === 'reading') {
    return (
      <Badge variant="secondary">
        <Loader2 className="w-3 h-3 animate-spin" />
        {copy.upload.reading}
      </Badge>
    );
  }

  if (fileState.status === 'writing') {
    return (
      <Badge variant="secondary">
        <Loader2 className="w-3 h-3 animate-spin" />
        {copy.upload.writing}
      </Badge>
    );
  }

  if (fileState.status === 'error') {
    return <Badge variant="destructive">{copy.upload.failed}</Badge>;
  }

  return <Badge variant="secondary">{copy.upload.ready(fileState.tags.length)}</Badge>;
}

function MetadataViewerPanel({
  copy,
  fileState,
  onTagChange,
  onToggleTagSelection,
}: {
  copy: MetadataCopy;
  fileState: MetadataFileState | null;
  onTagChange: (tagKey: string, value: string) => void;
  onToggleTagSelection: (tagKey: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');

  const visibleTags = useMemo(() => {
    if (!fileState) return [];

    const normalizedSearch = search.trim().toLowerCase();
    return fileState.tags.filter((tag) => {
      const matchesGroup = group === 'all' || tag.group === group;
      const matchesSearch = !normalizedSearch ||
        tag.name.toLowerCase().includes(normalizedSearch) ||
        tag.key.toLowerCase().includes(normalizedSearch) ||
        tag.displayValue.toLowerCase().includes(normalizedSearch);

      return matchesGroup && matchesSearch;
    });
  }, [fileState, group, search]);

  if (!fileState) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <Tags className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">{copy.viewer.emptyTitle}</h3>
          <p className="text-sm text-muted-foreground">{copy.viewer.emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b bg-background space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Tags className="w-4 h-4" />
              {copy.viewer.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{fileState.currentFile.name}</p>
          </div>
          <Badge variant="secondary">{copy.viewer.tagCount(fileState.tags.length)}</Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.viewer.search}
              className="pl-9"
            />
          </div>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === 'all' ? copy.viewer.allGroups : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {visibleTags.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {copy.viewer.noResults}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b z-10">
              <tr className="text-left">
                <th className="w-10 p-3 font-medium">{copy.viewer.select}</th>
                <th className="w-28 p-3 font-medium">{copy.viewer.group}</th>
                <th className="w-48 p-3 font-medium">{copy.viewer.tag}</th>
                <th className="p-3 font-medium">{copy.viewer.value}</th>
              </tr>
            </thead>
            <tbody>
              {visibleTags.map((tag) => (
                <tr key={tag.key} className="border-b bg-background/50 align-top">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={fileState.selectedTagKeys.includes(tag.key)}
                      onChange={() => onToggleTagSelection(tag.key)}
                      disabled={!tag.editable}
                      aria-label={copy.viewer.selectTag(tag.name)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{tag.group}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="font-medium break-all">{tag.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tag.editable ? (
                        <Badge variant="secondary">{copy.viewer.editable}</Badge>
                      ) : (
                        <Badge variant="outline">{copy.viewer.readonly}</Badge>
                      )}
                      {tag.changed && <Badge variant="outline">{copy.viewer.changed}</Badge>}
                    </div>
                  </td>
                  <td className="p-3 min-w-[220px]">
                    {tag.editable ? (
                      <Input
                        value={tag.displayValue}
                        onChange={(event) => onTagChange(tag.key, event.target.value)}
                        aria-invalid={Boolean(tag.error)}
                        className={cn(tag.error && 'border-destructive')}
                      />
                    ) : (
                      <p className="break-all text-muted-foreground leading-6">{tag.displayValue || '-'}</p>
                    )}
                    {tag.error && (
                      <p className="mt-1 text-xs text-destructive">{tag.error}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EditPanel({
  copy,
  locale,
  fileState,
  selectedFileCount,
  operationMode,
  hasChangedFields,
  onDraftChange,
  onApplyEdits,
  onClearAll,
  onClearGps,
  onClearSelected,
  onBatchClearAll,
  onBatchClearGps,
  onDownload,
}: {
  copy: MetadataCopy;
  locale: Locale;
  fileState: MetadataFileState | null;
  selectedFileCount: number;
  operationMode: OperationMode;
  hasChangedFields: boolean;
  onDraftChange: (field: keyof MetadataEditDraft, value: string) => void;
  onApplyEdits: () => void;
  onClearAll: () => void;
  onClearGps: () => void;
  onClearSelected: () => void;
  onBatchClearAll: () => void;
  onBatchClearGps: () => void;
  onDownload: () => void;
}) {
  const isWriting = operationMode !== null;
  const selectedTagCount = fileState?.selectedTagKeys.length ?? 0;

  if (!fileState) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <PencilLine className="w-14 h-14 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium">{copy.editor.emptyTitle}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PencilLine className="w-4 h-4" />
            {copy.editor.common}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <TextField label={copy.fields.title} value={fileState.draft.title} onChange={(value) => onDraftChange('title', value)} />
            <TextareaField label={copy.fields.description} value={fileState.draft.description} onChange={(value) => onDraftChange('description', value)} />
            <TextField label={copy.fields.keywords} value={fileState.draft.keywords} onChange={(value) => onDraftChange('keywords', value)} />
            <TextField label={copy.fields.author} value={fileState.draft.author} onChange={(value) => onDraftChange('author', value)} />
            <TextField label={copy.fields.copyright} value={fileState.draft.copyright} onChange={(value) => onDraftChange('copyright', value)} />
            <TextField
              label={copy.fields.capturedAt}
              type="datetime-local"
              value={fileState.draft.capturedAt}
              onChange={(value) => onDraftChange('capturedAt', value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={copy.fields.make} value={fileState.draft.make} onChange={(value) => onDraftChange('make', value)} />
              <TextField label={copy.fields.model} value={fileState.draft.model} onChange={(value) => onDraftChange('model', value)} />
            </div>
            <TextField label={copy.fields.lens} value={fileState.draft.lens} onChange={(value) => onDraftChange('lens', value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={copy.fields.orientation} value={fileState.draft.orientation} onChange={(value) => onDraftChange('orientation', value)} />
              <TextField label={copy.fields.software} value={fileState.draft.software} onChange={(value) => onDraftChange('software', value)} />
            </div>
            <TextareaField label={copy.fields.comment} value={fileState.draft.comment} onChange={(value) => onDraftChange('comment', value)} />
            <div className="grid grid-cols-3 gap-3">
              <TextField label={copy.fields.gpsLatitude} value={fileState.draft.gpsLatitude} onChange={(value) => onDraftChange('gpsLatitude', value)} />
              <TextField label={copy.fields.gpsLongitude} value={fileState.draft.gpsLongitude} onChange={(value) => onDraftChange('gpsLongitude', value)} />
              <TextField label={copy.fields.gpsAltitude} value={fileState.draft.gpsAltitude} onChange={(value) => onDraftChange('gpsAltitude', value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.editor.actions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={onApplyEdits}
            disabled={isWriting || !hasChangedFields || fileState.status !== 'ready'}
          >
            {operationMode === 'apply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PencilLine className="w-4 h-4" />}
            {operationMode === 'apply' ? copy.editor.applying : copy.editor.apply}
          </Button>

          <Button
            className="w-full"
            variant="outline"
            onClick={onDownload}
            disabled={isWriting}
          >
            <Download className="w-4 h-4" />
            {copy.editor.download}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClearGps} disabled={isWriting}>
              {operationMode === 'clearGps' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinOff className="w-4 h-4" />}
              {copy.editor.clearGps}
            </Button>
            <Button variant="outline" onClick={onClearSelected} disabled={isWriting || selectedTagCount === 0}>
              {operationMode === 'clearSelected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
              {copy.editor.clearSelected(selectedTagCount)}
            </Button>
          </div>

          <Button variant="destructive" className="w-full" onClick={onClearAll} disabled={isWriting}>
            {operationMode === 'clearAll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {copy.editor.clearAll}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PackageOpen className="w-4 h-4" />
            {copy.editor.batch}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="secondary">{copy.editor.selectedFiles(selectedFileCount)}</Badge>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onBatchClearGps} disabled={isWriting || selectedFileCount === 0}>
              {operationMode === 'batchGps' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinOff className="w-4 h-4" />}
              {copy.editor.batchGps}
            </Button>
            <Button variant="outline" onClick={onBatchClearAll} disabled={isWriting || selectedFileCount === 0}>
              {operationMode === 'batchAll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageOpen className="w-4 h-4" />}
              {copy.editor.batchAll}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{locale === 'en' ? getSupportedMetadataFormats() : 'JPG、JPEG、PNG、WebP'}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TextField({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
      />
    </div>
  );
}

function parseEditedTagValue(tag: MetadataTag): string | number | boolean | Array<string | number | boolean> {
  const value = tag.displayValue.trim();
  if (value === '') return '';
  if (typeof tag.value === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (typeof tag.value === 'boolean') {
    return value.toLowerCase() === 'true';
  }
  if (Array.isArray(tag.value)) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return value;
}

function displayMetadataValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') return '';
  if (Array.isArray(value)) return value.map(displayMetadataValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function downloadZip(files: File[], prefix: string) {
  const { zipSync } = await import('fflate');
  const zipFiles: Record<string, Uint8Array> = {};

  for (const [index, file] of files.entries()) {
    const arrayBuffer = await file.arrayBuffer();
    zipFiles[`${String(index + 1).padStart(2, '0')}_${file.name}`] = new Uint8Array(arrayBuffer);
  }

  const data = zipSync(zipFiles);
  const zipBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(zipBuffer).set(data);
  const zipFile = new File([zipBuffer], `${prefix}_${new Date().toISOString().slice(0, 10)}.zip`, {
    type: 'application/zip',
    lastModified: Date.now(),
  });
  downloadModifiedFile(zipFile);
}

function MetadataGeoContent({ locale }: { locale: Locale }) {
  const copy = getCopy(locale).metadata.geo;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className="border-t bg-muted/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">{copy.heading}</h2>
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground leading-7">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {copy.features.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{copy.faqHeading}</h2>
          <div className="divide-y rounded border bg-background">
            {copy.faqs.map((item) => (
              <details key={item.question} className="group p-4">
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-3 text-sm text-muted-foreground leading-6">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
