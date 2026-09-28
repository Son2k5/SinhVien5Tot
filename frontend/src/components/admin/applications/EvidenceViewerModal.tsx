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
} from 'lucide-react';
import type { AdminEvidenceItem, EvidenceAttachment } from '../../../types/admin/application';

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
              name: `Liên kết minh chứng — ${ev.criterionCode}`,
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
    setScale((prev) => Math.min(prev + 0.25, 5));
  }, []);

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

  // Download handler
  const handleDownload = useCallback(() => {
    if (!currentFile?.url) return;
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = currentFile.name || 'minh-chung';
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentFile]);

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
      } else if (e.key.toLowerCase() === 'r') {
        rotateRight();
      } else if (e.key === '0') {
        resetTransform();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, prevFile, nextFile, zoomIn, zoomOut, rotateRight, resetTransform]);

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
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/92 backdrop-blur-md text-white select-none animate-in fade-in duration-150"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header / Action Toolbar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/85 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Criterion Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-md sm:max-w-xl">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            {currentFile?.isPdf ? <FileText size={18} /> : <Maximize2 size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-mono font-semibold border border-blue-500/30 shrink-0">
                {currentFile?.criterionCode || evidence.criterionCode}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                {currentFile?.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentFile?.criterionTitle || evidence.criterionTitle}
              {currentFile?.size ? ` • ${formatBytes(currentFile.size)}` : ''}
            </p>
          </div>
        </div>

        {/* Center: File counter */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-mono text-slate-300">
          <span className="font-semibold text-white">{currentIndex + 1}</span>
          <span className="text-slate-500">/</span>
          <span>{files.length} tệp</span>
        </div>

        {/* Right: Interactive Tools (Rotate, Zoom, Download, Close) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Rotate 90deg left/right */}
          <button
            type="button"
            title="Xoay ngược chiều kim đồng hồ 90° (R)"
            onClick={rotateLeft}
            className="w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            title="Xoay theo chiều kim đồng hồ 90° (R)"
            onClick={rotateRight}
            className="w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <RotateCw size={17} />
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Zoom controls */}
          <button
            type="button"
            title="Thu nhỏ (-)"
            onClick={zoomOut}
            className="w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <ZoomOut size={17} />
          </button>

          <button
            type="button"
            title="Đặt lại kích thước chuẩn (0)"
            onClick={resetTransform}
            className="px-2.5 h-9 rounded-xl hover:bg-slate-800/90 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            title="Phóng to (+)"
            onClick={zoomIn}
            className="w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <ZoomIn size={17} />
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Info toggle */}
          <button
            type="button"
            title="Thông tin chi tiết minh chứng"
            onClick={() => setShowInfo(!showInfo)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              showInfo
                ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
                : 'hover:bg-slate-800/90 text-slate-300 hover:text-white border-transparent hover:border-slate-700'
            }`}
          >
            <Info size={17} />
          </button>

          {/* Download */}
          <button
            type="button"
            title="Tải minh chứng về máy"
            onClick={handleDownload}
            className="w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <Download size={17} />
          </button>

          {/* Open original link */}
          {currentFile?.url && (
            <a
              href={currentFile.url}
              target="_blank"
              rel="noreferrer"
              title="Mở trong tab mới"
              className="w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
            >
              <ExternalLink size={16} />
            </a>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            onClick={toggleFullscreen}
            className="hidden sm:flex w-9 h-9 rounded-xl hover:bg-slate-800/90 text-slate-300 hover:text-white items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Close */}
          <button
            type="button"
            title="Đóng (Esc)"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-rose-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/80 hover:border-rose-500"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Viewing Canvas */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        {/* Navigation Arrow Left */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={prevFile}
            title="Minh chứng trước (Phím mũi tên trái)"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur shadow-xl border border-slate-700/80 transition-all hover:scale-105 cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {currentIndex < files.length - 1 && (
          <button
            type="button"
            onClick={nextFile}
            title="Minh chứng tiếp theo (Phím mũi tên phải)"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur shadow-xl border border-slate-700/80 transition-all hover:scale-105 cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Viewport for Image / PDF */}
        <div
          className={`w-full h-full flex items-center justify-center p-6 ${
            currentFile?.isPdf ? 'overflow-auto' : 'cursor-grab active:cursor-grabbing'
          }`}
          onMouseDown={!currentFile?.isPdf ? handleMouseDown : undefined}
          onWheel={!currentFile?.isPdf ? handleWheel : undefined}
          onDoubleClick={!currentFile?.isPdf ? () => setScale((s) => (s > 1 ? 1 : 2)) : undefined}
        >
          {currentFile?.isPdf ? (
            <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-white">
              <iframe
                src={`${currentFile.url}#toolbar=1`}
                title={currentFile.name}
                className="w-full h-full"
              />
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
                className="max-h-[82vh] max-w-[85vw] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
              />
            </div>
          )}
        </div>

        {/* Info Slide-Over Panel */}
        {showInfo && currentFile && (
          <aside className="absolute right-4 top-4 bottom-24 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md p-5 overflow-y-auto space-y-4 z-30 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Info size={16} className="text-blue-400" />
                <span>Chi tiết minh chứng</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Tiêu chí:</span>
                <span className="font-semibold text-slate-200 block mt-0.5">
                  {currentFile.criterionCode} — {currentFile.criterionTitle}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Tên tệp:</span>
                <span className="font-mono text-slate-300 block mt-0.5 break-all">
                  {currentFile.name}
                </span>
              </div>

              {currentFile.size && (
                <div>
                  <span className="text-slate-400 block font-medium">Kích thước:</span>
                  <span className="font-mono text-slate-300 block mt-0.5">
                    {formatBytes(currentFile.size)}
                  </span>
                </div>
              )}

              {currentFile.createdAt && (
                <div>
                  <span className="text-slate-400 block font-medium">Ngày nộp:</span>
                  <span className="text-slate-300 block mt-0.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    {new Date(currentFile.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}

              {currentFile.studentNote && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block font-medium">Mô tả / Đánh giá của sinh viên:</span>
                  <p className="mt-1 p-3 rounded-xl bg-slate-800/80 text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-700/60">
                    {currentFile.studentNote}
                  </p>
                </div>
              )}

              {currentFile.driveLink && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block font-medium">Đường dẫn Google Drive:</span>
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

      {/* Bottom Thumbnail Strip */}
      {files.length > 1 && (
        <footer className="h-20 px-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-center gap-2.5 overflow-x-auto shrink-0 z-20">
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
                className={`relative h-14 w-14 sm:w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30 ring-2 ring-blue-400/20'
                    : 'border-slate-700/80 opacity-60 hover:opacity-100 hover:border-slate-500'
                }`}
              >
                {file.isPdf ? (
                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-rose-400 p-1">
                    <FileText size={20} />
                    <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center mt-0.5">
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
                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
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
