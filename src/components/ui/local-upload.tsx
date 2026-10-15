'use client';

import { Upload } from 'antd';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getCopy, getLocaleFromPathname } from '@/app/lib/i18n';

export function LocalUpload({ accept, disabled, compact, empty, preview, onFiles, children, inputId = 'tool-upload-input', multiple = true }: {
  accept: string; disabled?: boolean; compact?: boolean; empty?: boolean; preview?: boolean;
  inputId?: string | null; multiple?: boolean;
  onFiles: (files: File[]) => void; children: ReactNode;
}) {
  const copy = getCopy(getLocaleFromPathname(usePathname()));
  const label = !inputId || inputId === 'tool-upload-input' ? copy.workspace.addFiles : copy.watermarkControls.chooseImage;
  return <div className={preview ? 'upload-preview' : empty ? 'upload-empty' : compact ? 'upload-compact' : undefined}>
    {/* 仅把本批文件交给本地引擎；LIST_IGNORE 阻止 Ant Design 发起上传请求。 */}
    <Upload.Dragger accept={accept} disabled={disabled} multiple={multiple} showUploadList={false} aria-label={label}
      // 已加载的预览区只接收文件拖放，不截获内部按钮、表格输入和键盘操作。
      openFileDialogOnClick={!preview} hasControlInside={preview}
      // 禁用期间也阻止浏览器直接打开文件，避免处理中的页面被拖放导航走。
      onDrop={(event) => event.preventDefault()}
      beforeUpload={(file, batch) => { if (file === batch[0]) onFiles(batch); return Upload.LIST_IGNORE; }}>
      {children}
    </Upload.Dragger>
    {/* 中间预览使用自己的 Dragger，不重复注册任务栏使用的隐藏输入 ID。 */}
    {inputId && <input type="file" id={inputId} className="hidden" accept={accept} multiple={multiple} disabled={disabled}
      onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length) onFiles(files);
      }} />}
  </div>;
}
