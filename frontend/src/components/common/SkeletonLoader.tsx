import React from 'react';

export const FormSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-pulse p-4">
      <div className="space-y-2">
        <div className="h-8 bg-slate-200 rounded-lg w-2/3"></div>
        <div className="h-4 bg-slate-100 rounded w-5/6"></div>
      </div>
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-11 bg-slate-100 rounded-lg w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-11 bg-slate-100 rounded-lg w-full"></div>
        </div>
      </div>
      <div className="h-11 bg-doan-200 rounded-lg w-full mt-6"></div>
      <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto mt-6"></div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-pulse">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200"></div>
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-100 rounded w-64"></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-8 bg-slate-300 rounded w-1/2"></div>
        </div>
        <div className="h-32 bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-8 bg-slate-300 rounded w-1/2"></div>
        </div>
        <div className="h-32 bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-8 bg-slate-300 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};
