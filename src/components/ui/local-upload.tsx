'use client';

import { Upload } from 'antd';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getCopy, getLocaleFromPathname } from '@/app/lib/i18n';

export function LocalUpload({ accept, disabled, compact, onFiles, children, inputId = 'tool-upload-input', multiple = true }: {
  accept: string; disabled?: boolean; compact?: boolean;
  inputId?: string; multiple?: boolean;
  onFiles: (files: File[]) => void; children: ReactNode;
}) {
  const copy = getCopy(getLocaleFromPathname(usePathname()));
  const label = inputId === 'tool-upload-input' ? copy.workspace.addFiles : copy.watermarkControls.chooseImage;
  return <div className={compact ? 'upload-compact' : undefined}>
    {/* 仅把本批文件交给本地引擎；LIST_IGNORE 阻止 Ant Design 发起上传请求。 */}
    <Upload.Dragger accept={accept} disabled={disabled} multiple={multiple} showUploadList={false} aria-label={label}
      beforeUpload={(file, batch) => { if (file === batch[0]) onFiles(batch); return Upload.LIST_IGNORE; }}>
      {children}
    </Upload.Dragger>
    <input type="file" id={inputId} className="hidden" accept={accept} multiple={multiple} disabled={disabled}
      onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length) onFiles(files);
      }} />
  </div>;
}
