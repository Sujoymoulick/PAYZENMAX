import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: {
    percentage: number;
    isPositive: boolean;
    label: string;
  };
  onClick?: () => void;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  onClick,
  badge
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-emerald-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            {value}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 shadow-inner`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
        {trend ? (
          <div className="flex items-center space-x-1">
            <span
              className={`inline-flex items-center text-xs font-bold ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(trend.percentage)}%
            </span>
            <span className="text-slate-400 font-normal">{trend.label}</span>
          </div>
        ) : (
          <span className="text-slate-400 font-normal">{subtitle || 'Updated in real time'}</span>
        )}

        {onClick && (
          <span className="text-[11px] text-emerald-600 font-medium group-hover:underline flex items-center">
            Explain & Drill down <Info className="w-3 h-3 ml-1" />
          </span>
        )}
      </div>
    </div>
  );
};
