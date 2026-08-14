import type { HTMLAttributes } from 'react';

type SkeletonBlockProps = HTMLAttributes<HTMLDivElement>;

export function SkeletonBlock({ className = '', ...props }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden='true'
      className={'animate-pulse bg-slate-200 motion-reduce:animate-none ' + className}
      {...props}
    />
  );
}
