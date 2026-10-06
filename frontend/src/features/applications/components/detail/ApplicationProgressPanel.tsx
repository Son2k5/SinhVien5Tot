import React from 'react';
import { AlertTriangle, Award, CheckCircle2 } from 'lucide-react';
import { STANDARD_GROUPS, type StandardProgress } from '../../types/application.types';
import { RADAR_AXES } from './detail.types';

interface ApplicationProgressPanelProps {
  standards: StandardProgress[];
  selectedGroupFilter: string;
  onSelectGroupFilter: (groupCode: string) => void;
  isEligibleForApproval: boolean;
  completedStandardsCount: number;
}

export const ApplicationProgressPanel: React.FC<ApplicationProgressPanelProps> = ({
  standards,
  selectedGroupFilter,
  onSelectGroupFilter,
  isEligibleForApproval,
  completedStandardsCount,
}) => {
  const radarCx = 170;
  const radarCy = 125;
  const radarR = 76;
  const radarLevels = [0.25, 0.5, 0.75, 1.0];

  const radarDataPoints = RADAR_AXES.map((axis) => {
    const std = standards.find((s) => s.groupCode === axis.code);
    const isComplete = std?.complete ?? false;
    const approved = std?.approvedCount ?? 0;
    const required = std?.requiredCount ?? 1;
    const rate = isComplete ? 1 : Math.max(0.15, Math.min(1, approved / Math.max(1, required)));
    const px = radarCx + radarR * rate * Math.cos(axis.angle);
    const py = radarCy + radarR * rate * Math.sin(axis.angle);
    const labelX = radarCx + (radarR + 24) * Math.cos(axis.angle) + axis.dx;
    const labelY = radarCy + (radarR + 24) * Math.sin(axis.angle) + axis.dy;
    return {
      ...axis,
      std,
      isComplete,
      approved,
      required,
      rate,
      px,
      py,
      labelX,
      labelY,
    };
  });

  const radarPolygonPoints = radarDataPoints.map((p) => `${p.px},${p.py}`).join(' ');

  return (
    <div className="space-y-4 font-inter font-['Inter',_sans-serif]">
      {/* Header of Progress Section */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Đánh giá tiến độ 5 tiêu chí
            </h4>
            <p className="text-[11px] text-slate-500">Biểu đồ đối soát tiêu chuẩn SV5T</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
            isEligibleForApproval
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isEligibleForApproval ? (
            <>
              <CheckCircle2 size={13} />
              <span>5 / 5 Nhóm đạt</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} />
              <span>{completedStandardsCount} / 5 Nhóm</span>
            </>
          )}
        </span>
      </div>

      {/* Modern Clean SVG Radar Chart */}
      <div className="relative flex flex-col items-center justify-center pt-1 pb-1">
        <svg
          viewBox="0 0 340 250"
          className="w-full max-w-[315px] h-auto overflow-visible select-none drop-shadow-2xs"
          role="img"
          aria-label="Biểu đồ ngũ giác tiến độ 5 tiêu chí"
        >
          <defs>
            <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.15" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Concentric Grid Pentagons */}
          {radarLevels.map((lvl) => {
            const pts = RADAR_AXES.map((a) => {
              const x = radarCx + radarR * lvl * Math.cos(a.angle);
              return `${x},${radarCy + radarR * lvl * Math.sin(a.angle)}`;
            }).join(' ');

            return (
              <polygon
                key={lvl}
                points={pts}
                fill={lvl === 1.0 ? '#f8fafc' : 'none'}
                stroke="#e2e8f0"
                strokeWidth={lvl === 1.0 ? '1.5' : '1'}
                strokeDasharray={lvl === 1.0 ? undefined : '3 3'}
              />
            );
          })}

          {/* Axes Lines */}
          {RADAR_AXES.map((a) => {
            const x2 = radarCx + radarR * Math.cos(a.angle);
            const y2 = radarCy + radarR * Math.sin(a.angle);
            return (
              <line
                key={a.code}
                x1={radarCx}
                y1={radarCy}
                x2={x2}
                y2={y2}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
            );
          })}

          {/* Value Area Polygon */}
          <polygon
            points={radarPolygonPoints}
            fill="url(#radarFillGrad)"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#radarGlow)"
            className="transition-all duration-300"
          />

          {/* Center Badge */}
          <circle
            cx={radarCx}
            cy={radarCy}
            r="16"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="shadow-xs"
          />
          <text
            x={radarCx}
            y={radarCy + 4}
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-800 font-mono"
          >
            {completedStandardsCount}/5
          </text>

          {/* Vertex Points & Labels */}
          {radarDataPoints.map((pt) => {
            const isSelected = selectedGroupFilter.toLowerCase() === pt.code.toLowerCase();

            return (
              <g
                key={pt.code}
                className="cursor-pointer"
                onClick={() => onSelectGroupFilter(isSelected ? 'all' : pt.code)}
              >
                {/* Vertex Marker Dot */}
                <circle
                  cx={pt.px}
                  cy={pt.py}
                  r="4.5"
                  fill={pt.isComplete ? '#10b981' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform duration-200 hover:scale-125"
                />

                {/* Outer Axis Label */}
                <text
                  x={pt.labelX}
                  y={pt.labelY}
                  textAnchor={pt.anchor}
                  className={`text-[11px] font-semibold transition-colors ${
                    isSelected ? 'fill-blue-600 font-bold' : 'fill-slate-700 hover:fill-blue-600'
                  }`}
                >
                  {pt.label}
                </text>
                <text
                  x={pt.labelX}
                  y={pt.labelY + 12}
                  textAnchor={pt.anchor}
                  className={`text-[9.5px] font-bold ${
                    pt.isComplete ? 'fill-emerald-600' : 'fill-slate-400'
                  }`}
                >
                  {pt.isComplete ? 'ĐẠT' : `${pt.approved}/${pt.required}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 5 Standards Compact List with Mini Progress Bars */}
      <div className="space-y-2 pt-1 border-t border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
          Chi tiết 5 nhóm tiêu chuẩn (nhấn để lọc):
        </span>

        <div className="space-y-1.5">
          {RADAR_AXES.map((axis) => {
            const std = standards.find((s) => s.groupCode === axis.code);
            const isComplete = std?.complete ?? false;
            const approved = std?.approvedCount ?? 0;
            const required = std?.requiredCount ?? 1;
            const config = STANDARD_GROUPS[axis.code];
            if (!config) return null;
            const Icon = config.icon;
            const isSelected = selectedGroupFilter.toLowerCase() === axis.code.toLowerCase();

            return (
              <div
                key={axis.code}
                onClick={() => onSelectGroupFilter(isSelected ? 'all' : axis.code)}
                className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 text-blue-900 border border-blue-200 shadow-2xs'
                    : 'hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60'
                }`}
                title={`Lọc danh sách tiêu chí theo nhóm ${config.label}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {config.label}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-16 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${
                              required > 0
                                ? Math.min(100, Math.round((approved / required) * 100))
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {approved}/{required}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={11} />
                      <span>Đạt</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <span>Chưa đạt</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Eligibility Alert Box */}
      <div
        className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
          isEligibleForApproval
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        {isEligibleForApproval ? (
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        )}
        <div className="leading-snug">
          {isEligibleForApproval ? (
            <span className="font-semibold">
              Hồ sơ đã đạt đủ 5/5 tiêu chuẩn. Đủ điều kiện phê duyệt danh hiệu.
            </span>
          ) : (
            <span>
              Hồ sơ còn thiếu <strong>{5 - completedStandardsCount}</strong> nhóm để đủ điều kiện công
              nhận.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
