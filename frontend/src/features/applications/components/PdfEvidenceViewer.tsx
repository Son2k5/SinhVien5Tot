import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfEvidenceViewerProps {
  url: string;
  scale: number;
}

export function PdfEvidenceViewer({ url, scale }: PdfEvidenceViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => setViewportWidth(viewport.clientWidth));
    observer.observe(viewport);
    setViewportWidth(viewport.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPageCount(0);
    setError(false);
  }, [url]);

  const pageWidth = Math.max(320, Math.min(viewportWidth - 32, 1180));

  return (
    <div className="flex h-full min-h-0 flex-col bg-neutral-950 text-neutral-200">
      <div ref={viewportRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm">Không thể hiển thị tài liệu PDF.</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-700 transition-colors"
            >
              Mở tệp trong tab mới
            </a>
          </div>
        ) : (
          <div className="flex min-h-full flex-col items-center py-6 px-4">
            <Document
              key={url}
              file={url}
              suspense={false}
              loading={<p className="py-12 text-sm text-neutral-400">Đang tải PDF...</p>}
              error={<p className="py-12 text-sm text-neutral-400">Không thể tải PDF.</p>}
              onLoadSuccess={({ numPages }) => setPageCount(numPages)}
              onLoadError={() => setError(true)}
              className="flex flex-col items-center gap-4"
            >
              {viewportWidth > 0 &&
                pageCount > 0 &&
                Array.from(new Array(pageCount), (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    className="shadow-2xl bg-white border border-neutral-800"
                  >
                    <Page
                      pageNumber={index + 1}
                      width={pageWidth}
                      scale={scale}
                      suspense={false}
                      loading={
                        <div className="h-96 w-full flex items-center justify-center text-xs text-neutral-400">
                          Đang hiển thị trang {index + 1}...
                        </div>
                      }
                      error={
                        <div className="p-4 text-center text-xs text-rose-500">
                          Không thể hiển thị trang {index + 1}.
                        </div>
                      }
                      className="overflow-hidden"
                    />
                  </div>
                ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
