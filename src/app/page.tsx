'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/app/components/upload/ImageUpload";
import { WatermarkCanvas } from "@/app/components/editor/WatermarkCanvas";
import { WatermarkControls } from "@/app/components/controls/WatermarkControls";
import { TopNavigation } from '@/components/TopNavigation';
import { usePathname } from 'next/navigation';

export default function Home() {
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <h1 className="sr-only">{isEnglish ? 'Free batch image watermark tool' : '免费批量图片水印工具'}</h1>

      {/* Top Navigation */}
      <TopNavigation />

      {/* 移动端：垂直布局 */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{isEnglish ? 'Batch Image Watermark Tool' : '图片批量处理工具'}</h2>
            <p className="text-sm text-muted-foreground">
              {isEnglish
                ? 'Add professional text, image, and tiled watermarks to your images'
                : '为您的图片添加专业水印，支持文字和图片水印'}
            </p>
          </div>
        </div>

        {/* 移动端内容区域 */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="upload" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-3 m-4">
              <TabsTrigger value="upload">{isEnglish ? 'Upload' : '上传'}</TabsTrigger>
              <TabsTrigger value="edit">{isEnglish ? 'Edit' : '编辑'}</TabsTrigger>
              <TabsTrigger value="controls">{isEnglish ? 'Controls' : '控制'}</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex-1 overflow-auto p-4">
              <ImageUpload isEnglish={isEnglish} />
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-auto p-4">
              <WatermarkCanvas isEnglish={isEnglish} />
            </TabsContent>

            <TabsContent value="controls" className="flex-1 overflow-auto p-4">
              <WatermarkControls isEnglish={isEnglish} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 桌面端：固定编辑器布局 */}
      <div className="hidden lg:flex flex-col h-full">
        {/* 页面标题 */}
        <div className="flex-shrink-0 p-4 bg-background">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{isEnglish ? 'Batch Image Watermark Tool' : '图片批量处理工具'}</h2>
            <p className="text-sm text-muted-foreground">
              {isEnglish
                ? 'Add professional text, image, and tiled watermarks to your images'
                : '为您的图片添加专业水印，支持文字和图片水印'}
            </p>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：可滚动的上传区域 - 使用3/12的比例 */}
          <div className="flex-[3] border-r bg-background">
            <div className="h-full overflow-auto">
              <div className="p-4">
                <ImageUpload isEnglish={isEnglish} />
              </div>
            </div>
          </div>

          {/* 右侧：固定的编辑器和控制面板 - 使用9/12的比例 */}
          <div className="flex-[9] flex overflow-hidden">

            {/* 中间：Canvas编辑器 - 使用6/9的比例 */}
            <div className="flex-[6] p-4 overflow-auto">
              <WatermarkCanvas className="h-full" isEnglish={isEnglish} />
            </div>

            {/* 右侧：控制面板 - 使用3/9的比例 */}
            <div className="flex-[3] border-l bg-background">
              <div className="h-full overflow-auto">
                <div className="p-4">
                  <WatermarkControls isEnglish={isEnglish} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HomeGeoContent isEnglish={isEnglish} />
    </div>
  );
}

function HomeGeoContent({ isEnglish }: { isEnglish: boolean }) {
  const faqs = isEnglish
    ? [
        {
          question: 'Is this batch image watermark tool free?',
          answer: 'Yes. Image Watermark is free to use and does not require an account. You can add text watermarks, image watermarks, and full-screen tiled watermarks in the browser.'
        },
        {
          question: 'Are uploaded images saved on a server?',
          answer: 'No. Watermarking and preview generation happen locally in your browser, so image files are not uploaded to a server.'
        },
        {
          question: 'Can I watermark multiple images at once?',
          answer: 'Yes. You can select multiple images, configure one watermark style, and apply it across the batch.'
        },
        {
          question: 'What watermark types are supported?',
          answer: 'The tool supports text watermarks, image or logo watermarks, and full-screen tiled watermarks with adjustable opacity, position, size, and rotation.'
        },
        {
          question: 'Who is this tool useful for?',
          answer: 'It is useful for photographers, ecommerce sellers, social media creators, designers, and teams that need quick copyright or brand protection for images.'
        }
      ]
    : [
        {
          question: '这个批量图片水印工具免费吗？',
          answer: '是的，图片水印工具可以免费使用，不需要注册账号。用户可以在浏览器中批量添加文字水印、图片水印和全屏平铺水印。'
        },
        {
          question: '上传的图片会保存到服务器吗？',
          answer: '不会。水印添加和预览处理都在用户浏览器本地完成，图片文件不会上传到服务器，适合处理需要隐私保护的照片、商品图和设计稿。'
        },
        {
          question: '可以一次给多张图片添加水印吗？',
          answer: '可以。工具支持批量选择图片，设置一次水印样式后，可以对多张图片应用相同的文字水印、图片水印或平铺水印。'
        },
        {
          question: '支持哪些图片水印类型？',
          answer: '支持文字水印、图片水印和全屏平铺水印。文字水印可以调整颜色、透明度、大小、旋转角度和位置；图片水印适合添加品牌 Logo 或透明 PNG。'
        },
        {
          question: '适合哪些使用场景？',
          answer: '适合摄影作品版权保护、电商商品图批量打标、自媒体配图发布、设计稿预览和团队素材分发等场景。'
        }
      ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
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
          <h2 className="text-2xl font-semibold">
            {isEnglish ? 'Free browser-based batch image watermark tool' : '免费浏览器端批量图片水印工具'}
          </h2>
          {isEnglish ? (
            <>
              <p className="text-muted-foreground leading-7">
                Image Watermark is a free online batch image watermark tool for adding text watermarks, logo watermarks,
                and full-screen tiled watermarks to JPG, PNG, and WebP images. Files are processed locally in your browser
                and are not uploaded to a server.
              </p>
              <p className="text-muted-foreground leading-7">
                You can upload multiple images, configure watermark text, position, opacity, size, and rotation once,
                and export processed images with consistent placement across different resolutions.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground leading-7">
                Image Watermark 是一个免费的在线批量图片水印工具，支持 JPG、PNG、WebP 图片添加文字水印、
                图片水印和全屏平铺水印。图片在用户浏览器本地处理，不会上传到服务器，适合摄影师、电商卖家、
                自媒体创作者和设计团队保护图片版权。
              </p>
              <p className="text-muted-foreground leading-7">
                用户可以一次上传多张图片，统一设置水印内容、位置、透明度和旋转角度，并导出处理后的图片。
                对于不同尺寸的图片，比例定位可以保持水印在批量输出中的视觉一致性。
              </p>
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="font-medium">{isEnglish ? 'Supported formats' : '支持格式'}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-6">
              {isEnglish ? 'JPG, PNG, and WebP images can be watermarked. Transparent PNG logos can be used as image watermarks.' : 'JPG、PNG、WebP 图片可用于水印处理，透明 PNG Logo 可作为图片水印。'}
            </p>
          </div>
          <div>
            <h3 className="font-medium">{isEnglish ? 'Local processing' : '本地处理'}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-6">
              {isEnglish ? 'Images are read, rendered, and exported in your browser, reducing privacy and asset exposure risks.' : '图片在浏览器中读取和导出，不经过远程服务器，降低隐私和素材泄露风险。'}
            </p>
          </div>
          <div>
            <h3 className="font-medium">{isEnglish ? 'Batch export' : '批量输出'}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-6">
              {isEnglish ? 'Useful for product photos, photography, social media images, and branded creative assets.' : '适合对商品图、摄影作品、社交媒体配图和品牌素材进行统一水印处理。'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{isEnglish ? 'Frequently asked questions' : '常见问题'}</h2>
          <div className="divide-y rounded border bg-background">
            {faqs.map((item) => (
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
