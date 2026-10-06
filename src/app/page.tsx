'use client';

import { ToolWorkspace } from '@/components/ToolWorkspace';
import { ImageUpload } from "@/app/components/upload/ImageUpload";
import { LazyWatermarkCanvas } from '@/app/components/editor/LazyWatermarkCanvas';
import { WatermarkControls } from "@/app/components/controls/WatermarkControls";
import { TopNavigation } from '@/components/TopNavigation';
import { getCopy, getLocaleFromPathname, type Locale } from '@/app/lib/i18n';
import { usePathname } from 'next/navigation';

export default function Home() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getCopy(locale).home;

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <h1 className="sr-only">{copy.srTitle}</h1>

      {/* Top Navigation */}
      <TopNavigation />

      <div className="p-4 bg-background text-center">
        <h2 className="text-2xl font-bold mb-1">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>
      <ToolWorkspace panels={[
        { id: 'upload', label: copy.tabs.upload, content: <ImageUpload locale={locale} /> },
        { id: 'edit', label: copy.tabs.edit, content: <LazyWatermarkCanvas locale={locale} /> },
        { id: 'controls', label: copy.tabs.controls, content: <WatermarkControls locale={locale} /> },
      ]} />
      <HomeGeoContent locale={locale} />
    </div>
  );
}

function HomeGeoContent({ locale }: { locale: Locale }) {
  const copy = getCopy(locale).home.geo;
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
