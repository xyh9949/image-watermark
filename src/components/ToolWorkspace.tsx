'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ToolPanel {
  id: string;
  label: string;
  content: ReactNode;
}

// 两种屏幕共用同一组面板；切换标签只控制可见性，保留编辑草稿和处理状态。
export function ToolWorkspace({ panels }: { panels: [ToolPanel, ToolPanel, ToolPanel] }) {
  return (
    <Tabs defaultValue={panels[0].id} className="gap-0 min-w-0">
      <div className="px-4 py-3 lg:hidden">
        <TabsList className="grid w-full grid-cols-3">
          {panels.map((panel) => (
            <TabsTrigger key={panel.id} value={panel.id} className="min-w-0">
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,3fr)_minmax(0,6fr)_minmax(0,3fr)]">
        {panels.map((panel) => (
          <TabsContent
            key={panel.id}
            value={panel.id}
            forceMount
            className="min-w-0 p-4 data-[state=inactive]:hidden lg:data-[state=inactive]:block lg:even:border-x"
          >
            {panel.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
