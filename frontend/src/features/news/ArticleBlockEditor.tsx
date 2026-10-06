import { useRef, useEffect } from 'react';
import { useUploadArticleImage } from './hooks/useNews';
import { 
  Plus, ArrowUp, ArrowDown, Trash2, Image as ImageIcon, 
  Type, Heading2, Quote, List as ListIcon, AlertCircle, RefreshCw
} from 'lucide-react';

export type EditorBlock = (
  | { type: 'Heading'; level: 2 | 3; text: string }
  | { type: 'Paragraph'; text: string }
  | { type: 'Quote'; text: string }
  | { type: 'List'; items: string[] }
  | { 
      type: 'Image'; 
      imageId: string; 
      url: string; 
      width: number; 
      height: number; 
      alt: string; 
      caption: string;
      _upload?: {
        file: File;
        previewUrl: string;
        progress: number;
        error?: string;
        status: 'pending' | 'uploading' | 'error';
      }
    }
) & { _id: string };

interface ArticleBlockEditorProps {
  value: EditorBlock[];
  onChange: (value: EditorBlock[]) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

const MAX_BLOCKS = 200;
const MAX_IMAGES = 30;
const MAX_TEXT_LENGTH = 5000;
const MAX_LIST_ITEMS = 50;

function AutoGrowTextarea({ value, onChange, placeholder, className, rows = 1, maxLength }: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full resize-none overflow-hidden bg-transparent focus:outline-none ${className}`}
      rows={rows}
      maxLength={maxLength}
    />
  );
}

export function ArticleBlockEditor({ value, onChange, onUploadingChange }: ArticleBlockEditorProps) {
  const uploadMutation = useUploadArticleImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track active uploads to limit concurrency
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const valueRef = useRef(value);
  valueRef.current = value;

  // Clean up object URLs
  useEffect(() => {
    return () => {
      valueRef.current.forEach(b => {
        if (b.type === 'Image' && b._upload?.previewUrl) {
          URL.revokeObjectURL(b._upload.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    const isUploading = value.some(b => b.type === 'Image' && b._upload && (b._upload.status === 'pending' || b._upload.status === 'uploading'));
    onUploadingChange(isUploading);

    const pendingUploads = value.filter(b => b.type === 'Image' && b._upload?.status === 'pending' && !activeUploadsRef.current.has(b._id)) as Extract<EditorBlock, { type: 'Image' }>[];
    
    if (pendingUploads.length > 0 && activeUploadsRef.current.size < 2) {
      const availableSlots = 2 - activeUploadsRef.current.size;
      const toUpload = pendingUploads.slice(0, availableSlots);
      
      toUpload.forEach(block => {
        if (!block._upload) return;
        const blockId = block._id;
        activeUploadsRef.current.add(blockId);
        
        // Update status to uploading
        onChange(valueRef.current.map(b => b._id === blockId && b.type === 'Image' && b._upload 
          ? { ...b, _upload: { ...b._upload, status: 'uploading' } } 
          : b
        ));

        uploadMutation.mutate({
          file: block._upload.file,
          onUploadProgress: (e: any) => {
            const progress = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
            onChange(valueRef.current.map(b => b._id === blockId && b.type === 'Image' && b._upload
              ? { ...b, _upload: { ...b._upload, progress } }
              : b
            ));
          }
        }, {
          onSuccess: (data) => {
            activeUploadsRef.current.delete(blockId);
            onChange(valueRef.current.map(b => b._id === blockId && b.type === 'Image'
              ? { ...b, imageId: data.id, url: data.url, width: data.width, height: data.height, _upload: undefined }
              : b
            ));
          },
          onError: (err: any) => {
            activeUploadsRef.current.delete(blockId);
            const errorMsg = err?.response?.data?.message || 'Tải ảnh thất bại';
            onChange(valueRef.current.map(b => b._id === blockId && b.type === 'Image' && b._upload
              ? { ...b, _upload: { ...b._upload, status: 'error', error: errorMsg } }
              : b
            ));
          }
        });
      });
    }
  }, [value, onChange, onUploadingChange]);

  const addBlock = (type: 'Heading' | 'Paragraph' | 'Quote' | 'List', index = value.length) => {
    if (value.length >= MAX_BLOCKS) {
      alert(`Đã đạt giới hạn ${MAX_BLOCKS} khối`);
      return;
    }
    const id = Math.random().toString(36).slice(2, 9);
    let newBlock: EditorBlock;
    if (type === 'Heading') newBlock = { _id: id, type: 'Heading', level: 2, text: '' };
    else if (type === 'Paragraph') newBlock = { _id: id, type: 'Paragraph', text: '' };
    else if (type === 'Quote') newBlock = { _id: id, type: 'Quote', text: '' };
    else newBlock = { _id: id, type: 'List', items: [] };

    const newBlocks = [...value];
    newBlocks.splice(index, 0, newBlock);
    onChange(newBlocks);
  };

  const handleFiles = (files: FileList | File[], insertIndex: number = value.length) => {
    if (value.length >= MAX_BLOCKS) return alert(`Đã đạt giới hạn ${MAX_BLOCKS} khối`);
    
    const currentImages = value.filter(b => b.type === 'Image').length;
    const validFiles = Array.from(files).filter(file => {
      const isType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isExt = /\.(jpe?g|png|webp)$/i.test(file.name);
      return isType && isExt;
    });

    if (validFiles.length < files.length) {
      alert('Chỉ chấp nhận ảnh JPG, PNG, WEBP');
    }

    const underSizeLimit = validFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (underSizeLimit.length < validFiles.length) {
      alert('Kích thước ảnh tối đa 5MB');
    }

    const allowedToAdd = Math.min(underSizeLimit.length, MAX_IMAGES - currentImages, MAX_BLOCKS - value.length);
    if (allowedToAdd < underSizeLimit.length) {
      alert(`Đã đạt giới hạn số lượng ảnh (${MAX_IMAGES}) hoặc khối (${MAX_BLOCKS})`);
    }

    const filesToAdd = underSizeLimit.slice(0, allowedToAdd);
    
    const newImageBlocks: EditorBlock[] = filesToAdd.map(file => ({
      _id: Math.random().toString(36).slice(2, 9),
      type: 'Image',
      imageId: '',
      url: '',
      width: 0,
      height: 0,
      alt: '',
      caption: '',
      _upload: {
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'pending'
      }
    }));

    const newBlocks = [...value];
    newBlocks.splice(insertIndex, 0, ...newImageBlocks);
    onChange(newBlocks);
  };

  const retryUpload = (id: string) => {
    onChange(value.map(b => b._id === id && b.type === 'Image' && b._upload
      ? { ...b, _upload: { ...b._upload, status: 'pending', error: undefined, progress: 0 } }
      : b
    ));
  };

  const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
    onChange(value.map(b => b._id === id ? { ...b, ...updates } : b) as EditorBlock[]);
  };

  const removeBlock = (id: string) => {
    const block = value.find(b => b._id === id);
    if (block?.type === 'Image' && block._upload?.previewUrl) {
      URL.revokeObjectURL(block._upload.previewUrl);
    }
    onChange(value.filter(b => b._id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= value.length) return;
    const newBlocks = [...value];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    onChange(newBlocks);
  };

  const renderAddBar = (index: number) => (
    <div className="flex items-center gap-2 py-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity justify-center relative group">
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200/80 -z-10 group-hover:border-blue-300 transition-colors" />
      <div className="flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-xl p-1">
        <button onClick={() => addBlock('Heading', index)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg" aria-label="Thêm tiêu đề" title="Tiêu đề"><Heading2 size={16} /></button>
        <button onClick={() => addBlock('Paragraph', index)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg" aria-label="Thêm đoạn văn" title="Đoạn văn"><Type size={16} /></button>
        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg" aria-label="Thêm ảnh" title="Ảnh"><ImageIcon size={16} /></button>
        <button onClick={() => addBlock('Quote', index)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg" aria-label="Thêm trích dẫn" title="Trích dẫn"><Quote size={16} /></button>
        <button onClick={() => addBlock('List', index)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg" aria-label="Thêm danh sách" title="Danh sách"><ListIcon size={16} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2 font-['Arial',sans-serif] text-[14px] font-normal">
      <input 
        type="file" 
        multiple 
        accept="image/jpeg,image/png,image/webp"
        className="hidden" 
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      
      {value.map((block, index) => (
        <div key={block._id} id={`block-${index}`} className="group relative border border-dashed border-slate-200 bg-white hover:border-blue-300 rounded-lg p-2.5 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/20">
          <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 rounded-md shadow-sm z-10">
            <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 cursor-pointer" aria-label="Lên"><ArrowUp size={14} /></button>
            <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === value.length - 1} className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 cursor-pointer" aria-label="Xuống"><ArrowDown size={14} /></button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button type="button" onClick={() => removeBlock(block._id)} className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer" aria-label="Xoá khối"><Trash2 size={14} /></button>
          </div>

          <div className="w-full">
            {block.type === 'Heading' && (
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => updateBlock(block._id, { level: block.level === 2 ? 3 : 2 })}
                  className="mt-1 px-2.5 h-7 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer shrink-0"
                  aria-label={`Đổi thành h${block.level === 2 ? 3 : 2}`}
                >
                  H{block.level}
                </button>
                <AutoGrowTextarea 
                  value={block.text} 
                  onChange={(e: any) => updateBlock(block._id, { text: e.target.value })}
                  placeholder={`Tiêu đề H${block.level}...`}
                  maxLength={MAX_TEXT_LENGTH}
                  className={`font-semibold leading-[1.5] text-slate-900 ${block.level === 2 ? 'text-[20px] sm:text-[22px]' : 'text-[16px] sm:text-[17px]'}`}
                />
              </div>
            )}
            
            {block.type === 'Paragraph' && (
              <AutoGrowTextarea 
                value={block.text} 
                onChange={(e: any) => updateBlock(block._id, { text: e.target.value })}
                placeholder="Nhập nội dung đoạn văn..."
                maxLength={MAX_TEXT_LENGTH}
                className="text-[14px] font-normal leading-[1.8] text-slate-700 break-words"
              />
            )}

            {block.type === 'Quote' && (
              <div className="border-l-4 border-blue-500 pl-4 py-1.5 bg-blue-50/40 rounded-r-md">
                <AutoGrowTextarea 
                  value={block.text} 
                  onChange={(e: any) => updateBlock(block._id, { text: e.target.value })}
                  placeholder="Nhập nội dung trích dẫn..."
                  maxLength={MAX_TEXT_LENGTH}
                  className="text-[14px] font-normal italic leading-[1.8] text-slate-700 break-words"
                />
              </div>
            )}

            {block.type === 'List' && (
              <div className="pl-6 space-y-2">
                <AutoGrowTextarea 
                  value={block.items.join('\n')} 
                  onChange={(e: any) => {
                    const items = e.target.value.split('\n');
                    if (items.length <= MAX_LIST_ITEMS) {
                      updateBlock(block._id, { items });
                    }
                  }}
                  placeholder="Nhập danh sách, mỗi dòng một mục..."
                  className="text-[14px] font-normal leading-[1.75] text-slate-700 break-words"
                />
              </div>
            )}

            {block.type === 'Image' && (
              <div className="space-y-3">
                <div 
                  className={`relative w-full aspect-video rounded-lg overflow-hidden border ${block._upload?.status === 'error' ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} flex flex-col items-center justify-center`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      handleFiles(e.dataTransfer.files, index + 1);
                    }
                  }}
                >
                  {(block._upload?.previewUrl || block.url) && (
                    <img 
                      src={block._upload?.previewUrl || block.url} 
                      alt="" 
                      className={`w-full h-full object-contain ${block._upload?.status === 'uploading' ? 'opacity-50 blur-sm' : ''}`} 
                    />
                  )}
                  
                  {block._upload?.status === 'uploading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm">
                      <div className="w-48 h-2 bg-white/50 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${block._upload.progress}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-800 mt-2 bg-white/80 px-2 py-0.5 rounded shadow-sm">{block._upload.progress}%</span>
                    </div>
                  )}

                  {block._upload?.status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
                      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                      <p className="text-sm font-medium text-red-600 mb-3">{block._upload.error}</p>
                      <button type="button" onClick={() => retryUpload(block._id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm cursor-pointer">
                        <RefreshCw size={14} /> Thử lại
                      </button>
                    </div>
                  )}
                </div>

                {(!block._upload || !block._upload.error) && (
                  <div className="w-full max-w-xl mx-auto">
                    <input 
                      type="text" 
                      value={block.caption || ''} 
                      onChange={e => updateBlock(block._id, { caption: e.target.value, alt: e.target.value })}
                      placeholder="Chú thích ảnh (tuỳ chọn)"
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border-b border-slate-200 focus:border-blue-500 focus:outline-none text-center italic text-slate-600 bg-transparent"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {renderAddBar(index + 1)}
        </div>
      ))}

      {value.length === 0 && (
        <button
          type="button"
          onClick={() => addBlock('Paragraph')}
          className="w-full py-12 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg flex flex-col items-center justify-center bg-slate-50/60 hover:bg-blue-50/20 text-slate-500 hover:text-blue-600 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors mb-2">
            <Plus className="w-5 h-5" />
          </div>
          <p className="font-semibold text-sm">Nhấn vào đây để bắt đầu viết nội dung</p>
          <span className="text-xs text-slate-400 mt-0.5">Hỗ trợ định dạng Tiêu đề, Đoạn văn, Trích dẫn, Danh sách và Hình ảnh</span>
        </button>
      )}
    </div>
  );
}
