import type { Block } from './types/news.types';

interface ArticleBlockRendererProps {
  blocks: Block[];
}

export function ArticleBlockRenderer({ blocks }: ArticleBlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-5 font-['Arial',sans-serif] text-[14px] font-normal leading-[1.8] text-slate-700">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'Heading': {
            if (block.level === 2) {
              return (
                <h2 key={index} className="pt-4 text-[20px] sm:text-[22px] font-semibold leading-[1.45] text-slate-900 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {block.text}
                </h2>
              );
            }
            return (
              <h3 key={index} className="pt-2 text-[16px] sm:text-[17px] font-semibold leading-[1.55] text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {block.text}
              </h3>
            );
          }
          case 'Paragraph':
            return (
              <p key={index} className="text-[14px] font-normal leading-[1.8] text-slate-700 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {block.text}
              </p>
            );
          case 'Quote':
            return (
              <blockquote key={index} className="border-l-4 border-blue-500 bg-blue-50/60 py-3 pl-4 pr-3 rounded-r-lg">
                <p className="text-[14px] font-normal italic leading-[1.8] text-slate-700 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {block.text}
                </p>
              </blockquote>
            );
          case 'List':
            return (
              <ul key={index} className="list-disc pl-6 space-y-2 text-[14px] font-normal leading-[1.75] text-slate-700 marker:text-slate-400">
                {block.items.map((item, i) => (
                  <li key={i} className="pl-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{item}</li>
                ))}
              </ul>
            );
          case 'Image':
            return (
              <figure key={index} className="my-8 flex flex-col items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-slate-100 shadow-sm border border-slate-200/60">
                  <img 
                    src={block.url} 
                    alt={block.alt || ''} 
                    loading="lazy" 
                    decoding="async"
                    width={block.width}
                    height={block.height}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: `${block.width} / ${block.height}` }}
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-3 max-w-[72ch] text-[13px] font-normal leading-5 text-slate-500 text-center whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
