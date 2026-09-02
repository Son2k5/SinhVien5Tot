import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  tag?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  backTo?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <section className="flex flex-col gap-2.5 pb-3 border-b border-slate-100 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight m-0">
          {title}
        </h1>

        {description && (
          <p className="max-w-2xl text-xs text-slate-500 leading-normal m-0 font-normal">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0 shrink-0">
          {actions}
        </div>
      )}
    </section>
  );
}

