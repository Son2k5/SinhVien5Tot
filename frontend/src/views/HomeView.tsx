import React, { useState, useEffect } from 'react';
import type { User } from '../types/auth';
import { Header } from '../components/common/Header';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface HomeViewProps {
  user: User;
  onLogout: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    // Giả lập tải dữ liệu hồ sơ Sinh Viên 5 Tốt
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshData = () => {
    setRefreshing(true);
    setStatusMessage('Đang đồng bộ hồ sơ xét duyệt...');
    setTimeout(() => {
      setRefreshing(false);
      setStatusMessage('Đã cập nhật dữ liệu mới nhất!');
      setTimeout(() => setStatusMessage(''), 3000);
    }, 1200);
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Header userEmail={user.email} onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8">
            
            {/* Status notification toast when refreshing */}
            {statusMessage && (
              <div className="p-4 rounded-xl bg-doan-50 border border-doan-200 text-doan-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-doan-600 animate-ping" />
                  <span>{statusMessage}</span>
                </div>
                {refreshing && <LoadingSpinner size="sm" />}
              </div>
            )}

            {/* WELCOME HERO CARD */}
            <div className="relative overflow-hidden bg-gradient-to-r from-doan-900 via-doan-800 to-doan-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-doan-900/10 border border-doan-700/50">
              
              {/* Background decorative patterns */}
              <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-doan-400/20 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-inner">
                    {initial}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-doan-100 text-xs font-semibold uppercase tracking-wider mb-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      Tài khoản chính thức
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Xin chào, {user.name} 👋
                    </h1>
                    <p className="text-doan-100 text-sm mt-1">
                      Hệ thống Quản lý & Xét duyệt Danh hiệu <span className="font-semibold text-white">Sinh Viên 5 Tốt</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-white text-doan-800 hover:bg-doan-50 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-75"
                  >
                    {refreshing ? (
                      <LoadingSpinner size="sm" label="Đang cập nhật..." />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M23 4v6h-6M1 20v-6h6" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>Cập nhật hồ sơ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 5 TIÊU CHÍ SINH VIÊN 5 TỐT OVERVIEW */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-doan-600" />
                  Tiến độ 5 Tiêu chí Xét duyệt
                </h2>
                <span className="text-xs font-semibold text-doan-600 bg-doan-50 px-3 py-1 rounded-full border border-doan-100">
                  Năm học 2025 - 2026
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Đạo đức tốt', status: 'Đã đạt', color: 'bg-emerald-500', progress: 100 },
                  { label: 'Học tập tốt', status: 'Đang xét', color: 'bg-doan-600', progress: 85 },
                  { label: 'Thể lực tốt', status: 'Đã đạt', color: 'bg-emerald-500', progress: 100 },
                  { label: 'Tình nguyện tốt', status: 'Đã đạt', color: 'bg-emerald-500', progress: 100 },
                  { label: 'Hội nhập tốt', status: 'Đang bổ sung', color: 'bg-amber-500', progress: 60 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu chí {idx + 1}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-doan-600 transition-colors">
                      {item.label}
                    </h3>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-600 pt-1 flex justify-between">
                      <span>Trạng thái:</span>
                      <span className="font-semibold text-slate-900">{item.status}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* DEMO NOTICE CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Hệ thống đang chạy hoàn toàn ổn định</h4>
                <p className="text-xs text-slate-500">
                  Tài khoản <span className="font-semibold text-doan-600">{user.email}</span> đã được xác minh an toàn qua OTP. Nhấn <span className="font-semibold text-slate-700">Đăng xuất</span> trên góc phải nếu muốn quay lại màn hình Login.
                </p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                Đăng xuất phiên làm việc
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
