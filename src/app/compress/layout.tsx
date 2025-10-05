import { ReactNode } from 'react';

interface CompressLayoutProps {
  children: ReactNode;
}

export default function CompressLayout({ children }: CompressLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
