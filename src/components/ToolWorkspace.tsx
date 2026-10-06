'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, Images, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCopy, type Locale } from '@/app/lib/i18n';

interface ToolPanel { id: string; label: string; content: ReactNode; }

// 三页共用固定三栏；手机仅折叠文件区，预览和设置保持挂载，草稿不会丢失。
export function ToolWorkspace({ title, fileCount, locale, busy = false, status, panels }: {
  title: string; fileCount: number; locale: Locale; busy?: boolean; status?: ReactNode;
  panels: [ToolPanel, ToolPanel, ToolPanel];
}) {
  const [filesOpen, setFilesOpen] = useState(false);
  const copy = getCopy(locale).workspace;
  return (
    <section className="tool-workspace" aria-label={title}>
      <div className="tool-toolbar">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold lg:text-lg">{title}</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{copy.fileCount(fileCount)}</span>
        </div>
        <Button variant="ghost" className="hidden lg:inline-flex" disabled={busy}
          onClick={() => document.getElementById('tool-upload-input')?.click()}>
          <Plus className="size-4" />{copy.addFiles}
        </Button>
        <Button variant="outline" className="lg:hidden" aria-expanded={filesOpen} aria-controls="tool-files"
          onClick={() => setFilesOpen(!filesOpen)}>
          <Images className="size-4" />{copy.files}<span className="tabular-nums">{fileCount}</span>
          <ChevronDown className={`size-4 transition-transform ${filesOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      {status && <div className="tool-status" aria-live="polite">{status}</div>}
      <div className="tool-grid">
        {panels.map((panel, index) => (
          <section key={panel.id} id={index === 0 ? 'tool-files' : undefined} aria-label={panel.label}
            className={`tool-panel tool-panel-${['files', 'preview', 'inspector'][index]} ${index === 0 && !filesOpen ? 'tool-files-collapsed' : ''}`}>
            {panel.content}
          </section>
        ))}
      </div>
    </section>
  );
}
