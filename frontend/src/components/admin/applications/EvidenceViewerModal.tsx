import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
  Info,
  Link as LinkIcon,
  Calendar,
  Loader2,
} from 'lucide-react';
import type { AdminEvidenceItem, EvidenceAttachment } from '../../../types/admin/application';

const PdfEvidenceViewer = React.lazy(() =>
  import('./PdfEvidenceViewer').then(({ PdfEvidenceViewer }) => ({ default: PdfEvidenceViewer }))
);

interface ViewerFile {
  url: string;
  name: string;
  isPdf: boolean;
  size?: number;
  criterionCode?: string;
  criterionTitle?: string;
  studentNote?: string;
  driveLink?: string;
  createdAt?: string;
}

interface EvidenceViewerModalProps {
  isOpen: boolean;
  evidence: AdminEvidenceItem | null;
  initialAttachmentIndex?: number;
  allEvidences?: AdminEvidenceItem[];
  onClose: () => void;
}

const checkIsPdf = (urlOrName: string) => {
  return /\.pdf($|\?)/i.test(urlOrName);
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  isOpen,
  evidence,
  initialAttachmentIndex = 0,
  allEvidences,
  onClose,
}) => {
  // Collect all files across the current evidence or allEvidences
  const files: ViewerFile[] = React.useMemo(() => {
    if (!evidence) return [];

    const parseEvFiles = (ev: AdminEvidenceItem): ViewerFile[] => {
      let atts: EvidenceAttachment[] = [];
      try {
        if (ev.attachmentsJson) {
          const parsed = JSON.parse(ev.attachmentsJson);
          atts = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch {
        atts = [];
      }

      let parsedData: { description?: string; driveLink?: string; link?: string } = {};
      try {
        if (ev.dataJson) {
          parsedData = JSON.parse(ev.dataJson);
        }
      } catch {
        parsedData = {};
      }

      const note = parsedData.description || '';
      const drive = parsedData.driveLink || parsedData.link || '';

      if (atts.length === 0) {
        // Fallback file if only drive link or text exists
        if (drive) {
          return [
            {
              url: drive,
              name: `Liên kết minh chứng — ${ev.criterionTitle || 'Tiêu chí'}`,
              isPdf: false,
              criterionCode: ev.criterionCode,
              criterionTitle: ev.criterionTitle,
              studentNote: note,
              driveLink: drive,
              createdAt: ev.createdAt,
            },
          ];
        }
        return [];
      }

      return atts.map((att, idx) => {
        const url = att.url || att.fileUrl || att.secure_url || '';
        const name = att.fileName || att.name || `Tệp minh chứng ${idx + 1}`;
        const isPdf = checkIsPdf(name) || checkIsPdf(url);
        return {
          url,
          name,
          isPdf,
          size: att.bytes || att.size,
          criterionCode: ev.criterionCode,
          criterionTitle: ev.criterionTitle,
          studentNote: note,
          driveLink: drive,
          createdAt: ev.createdAt,
        };
      });
    };

    // If allEvidences is provided, gather files for all evidences in sequence,
    // placing the current evidence's files first
    if (allEvidences && allEvidences.length > 0) {
      const list: ViewerFile[] = [];
      // Current evidence first
      list.push(...parseEvFiles(evidence));
      // Others
      allEvidences.forEach((other) => {
        if (other.id !== evidence.id) {
          list.push(...parseEvFiles(other));
        }
      });
      return list;
    }

    return parseEvFiles(evidence);
  }, [evidence, allEvidences]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      const validIndex =
        initialAttachmentIndex >= 0 && initialAttachmentIndex < files.length
          ? initialAttachmentIndex
          : 0;
      setCurrentIndex(validIndex);
      setScale(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialAttachmentIndex, files.length]);

  // Reset transform when changing file
  const resetTransform = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  const currentFile = files[currentIndex] || null;

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, currentFile?.isPdf ? 3 : 5));
  }, [currentFile?.isPdf]);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.3));
  }, []);

  // Rotate controls: 90 deg clockwise or counter-clockwise
  const rotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const rotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  // Navigation
  const prevFile = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetTransform();
    }
  }, [currentIndex, resetTransform]);

  const nextFile = useCallback(() => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetTransform();
    }
  }, [currentIndex, files.length, resetTransform]);

  const [isDownloading, setIsDownloading] = useState(false);

  // Download handler - Tải trực tiếp về máy không redirect
  const handleDownload = useCallback(async () => {
    if (!currentFile?.url || isDownloading) return;
    try {
      setIsDownloading(true);
      const res = await fetch(currentFile.url);
      if (!res.ok) throw new Error('Không thể tải tệp trực tiếp');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = currentFile.name || 'minh-chung';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.warn('Lỗi khi fetch blob, chuyển sang phương thức tải kèm fl_attachment', err);
      // Fallback cho link Cloudinary: thêm cờ fl_attachment để trình duyệt tự động lưu tệp về máy
      let downloadUrl = currentFile.url;
      if (downloadUrl.includes('/upload/') && !downloadUrl.includes('/fl_attachment')) {
        downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = currentFile.name || 'minh-chung';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  }, [currentFile, isDownloading]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        prevFile();
      } else if (e.key === 'ArrowRight') {
        nextFile();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      } else if (e.key.toLowerCase() === 'r' && !currentFile?.isPdf) {
        rotateRight();
      } else if (e.key === '0') {
        resetTransform();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevFile, nextFile, zoomIn, zoomOut, rotateRight, resetTransform, currentFile?.isPdf]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => undefined);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
      setIsFullscreen(false);
    }
  };

  if (!isOpen || !evidence || files.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-black text-white select-none animate-in fade-in duration-150 font-inter"
      style={{ fontFamily: "'Inter', sans-serif" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header / Action Toolbar */}
      <header className="relative h-16 px-4 sm:px-6 bg-black border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Tên tệp (đã bỏ icon docs, bỏ mã tiêu chí, bỏ thông tin tiêu chí) */}
        <div className="flex items-center min-w-0 max-w-[35%] sm:max-w-md">
          <span className="text-xs sm:text-sm font-medium text-neutral-100 truncate" title={currentFile?.name}>
            {currentFile?.name}
          </span>
        </div>

        {/* Center: File counter căn đúng giữa màn hình */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 pointer-events-none">
          <span className="font-semibold text-white">{currentIndex + 1}</span>
          <span className="text-neutral-500">/</span>
          <span>{files.length} tệp</span>
        </div>

        {/* Right: Interactive Tools (Rotate, Zoom, Download, Close) - Vuông thẳng, không bo góc */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Rotation applies to images only. */}
          {!currentFile?.isPdf && (
            <>
              <button
                type="button"
                title="Xoay ngược chiều kim đồng hồ 90° (R)"
                onClick={rotateLeft}
                className="w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
              >
                <RotateCcw size={17} />
              </button>
              <button
                type="button"
                title="Xoay theo chiều kim đồng hồ 90° (R)"
                onClick={rotateRight}
                className="w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
              >
                <RotateCw size={17} />
              </button>
              <div className="h-5 w-px bg-neutral-800 mx-1 hidden sm:block" />
            </>
          )}

          {/* Zoom controls */}
          <button
            type="button"
            title="Thu nhỏ (-)"
            onClick={zoomOut}
            className="w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
          >
            <ZoomOut size={17} />
          </button>

          <button
            type="button"
            title="Đặt lại kích thước chuẩn (0)"
            onClick={resetTransform}
            className="px-2.5 h-9 hover:bg-neutral-800 text-xs font-mono text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            title="Phóng to (+)"
            onClick={zoomIn}
            className="w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
          >
            <ZoomIn size={17} />
          </button>

          <div className="h-5 w-px bg-neutral-800 mx-1 hidden sm:block" />

          {/* Info toggle */}
          <button
            type="button"
            title="Thông tin chi tiết minh chứng"
            onClick={() => setShowInfo(!showInfo)}
            className={`w-9 h-9 flex items-center justify-center transition-colors cursor-pointer border ${
              showInfo
                ? 'bg-neutral-800 text-blue-400 border-neutral-600'
                : 'hover:bg-neutral-800 text-neutral-300 hover:text-white border-transparent hover:border-neutral-700'
            }`}
          >
            <Info size={17} />
          </button>

          {/* Download */}
          <button
            type="button"
            disabled={isDownloading}
            title={isDownloading ? 'Đang tải tệp về máy...' : 'Tải minh chứng về máy'}
            onClick={handleDownload}
            className="w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={17} className="animate-spin text-blue-400" /> : <Download size={17} />}
          </button>

          {/* Open original link */}
          {currentFile?.url && (
            <a
              href={currentFile.url}
              target="_blank"
              rel="noreferrer"
              title="Mở trong tab mới"
              className="w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
            >
              <ExternalLink size={16} />
            </a>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            onClick={toggleFullscreen}
            className="hidden sm:flex w-9 h-9 hover:bg-neutral-800 text-neutral-300 hover:text-white items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <div className="h-5 w-px bg-neutral-800 mx-1" />

          {/* Close */}
          <button
            type="button"
            title="Đóng (Esc)"
            onClick={onClose}
            className="w-9 h-9 bg-neutral-800 hover:bg-rose-600 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-neutral-700 hover:border-rose-500"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Viewing Canvas */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        {/* Navigation Arrow Left - Vuông thẳng, không blur */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={prevFile}
            title="Minh chứng trước (Phím mũi tên trái)"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center shadow-xl border border-neutral-700 transition-all hover:scale-105 cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Navigation Arrow Right - Vuông thẳng, không blur */}
        {currentIndex < files.length - 1 && (
          <button
            type="button"
            onClick={nextFile}
            title="Minh chứng tiếp theo (Phím mũi tên phải)"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-neutral-900/90 hover:bg-neutral-800 text-white flex items-center justify-center shadow-xl border border-neutral-700 transition-all hover:scale-105 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Viewport for Image / PDF - Vuông thẳng, tập trung khung chính không blur */}
        <div
          className={`w-full h-full flex items-center justify-center p-2 sm:p-4 ${
            currentFile?.isPdf ? 'overflow-hidden' : 'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={!currentFile?.isPdf ? handleMouseDown : undefined}
          onWheel={!currentFile?.isPdf ? handleWheel : undefined}
          onDoubleClick={!currentFile?.isPdf ? () => setScale((s) => (s > 1 ? 1 : 2)) : undefined}
        >
          {currentFile?.isPdf ? (
            <div className="w-full h-full max-w-7xl 2xl:max-w-[1440px] overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950">
              <React.Suspense fallback={<div className="h-full flex items-center justify-center text-sm text-neutral-400">Đang mở trình xem PDF...</div>}>
                <PdfEvidenceViewer url={currentFile.url} scale={scale} />
              </React.Suspense>
            </div>
          ) : (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                transformOrigin: 'center center',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={currentFile?.url}
                alt={currentFile?.name}
                draggable={false}
                className="max-h-[94vh] max-w-[95vw] object-contain shadow-2xl pointer-events-none select-none"
              />
            </div>
          )}
        </div>

        {/* Info Slide-Over Panel - Vuông thẳng, không blur */}
        {showInfo && currentFile && (
          <aside className="absolute right-4 top-4 bottom-24 w-80 sm:w-96 bg-neutral-900 border border-neutral-800 shadow-2xl p-5 overflow-y-auto space-y-4 z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Info size={16} className="text-blue-400" />
                <span>Chi tiết minh chứng</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {currentFile.criterionTitle && (
                <div>
                  <span className="text-neutral-400 block font-medium">Tiêu chí:</span>
                  <span className="font-semibold text-neutral-200 block mt-0.5">
                    {currentFile.criterionTitle}
                  </span>
                </div>
              )}

              <div>
                <span className="text-neutral-400 block font-medium">Tên tệp:</span>
                <span className="font-mono text-neutral-300 block mt-0.5 break-all">
                  {currentFile.name}
                </span>
              </div>

              {currentFile.size && (
                <div>
                  <span className="text-neutral-400 block font-medium">Kích thước:</span>
                  <span className="font-mono text-neutral-300 block mt-0.5">
                    {formatBytes(currentFile.size)}
                  </span>
                </div>
              )}

              {currentFile.createdAt && (
                <div>
                  <span className="text-neutral-400 block font-medium">Ngày nộp:</span>
                  <span className="text-neutral-300 block mt-0.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-neutral-400" />
                    {new Date(currentFile.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}

              {currentFile.studentNote && (
                <div className="pt-2 border-t border-neutral-800">
                  <span className="text-neutral-400 block font-medium">Mô tả / Đánh giá của sinh viên:</span>
                  <p className="mt-1 p-3 bg-neutral-800/80 text-neutral-200 whitespace-pre-wrap leading-relaxed border border-neutral-700/60">
                    {currentFile.studentNote}
                  </p>
                </div>
              )}

              {currentFile.driveLink && (
                <div className="pt-2 border-t border-neutral-800">
                  <span className="text-neutral-400 block font-medium">Đường dẫn Google Drive:</span>
                  <a
                    href={currentFile.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline break-all"
                  >
                    <LinkIcon size={13} className="shrink-0" />
                    <span>{currentFile.driveLink}</span>
                  </a>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Thumbnail Strip - Vuông thẳng */}
      {files.length > 1 && (
        <footer className="h-20 px-4 bg-black border-t border-neutral-800 flex items-center justify-center gap-2.5 overflow-x-auto shrink-0 z-20">
          {files.map((file, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  resetTransform();
                }}
                className={`relative h-14 w-14 sm:w-16 overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30'
                    : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600'
                }`}
              >
                {file.isPdf ? (
                  <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-rose-400 p-1">
                    <FileText size={20} />
                    <span className="text-[9px] font-bold text-neutral-300 truncate w-full text-center mt-0.5">
                      PDF
                    </span>
                  </div>
                ) : (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/80 text-[9px] font-mono text-white">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </footer>
      )}
    </div>
  );
};
