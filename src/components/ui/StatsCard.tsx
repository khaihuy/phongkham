import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  trend?: {
    value: string;
    positive: boolean;
  };
}

const colorClasses = {
  blue: {
    bg: 'bg-sky-50',
    icon: 'bg-sky-500 text-white',
    text: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500 text-white',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  yellow: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500 text-white',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500 text-white',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500 text-white',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500 text-white',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
  },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`stats-card bg-white rounded-2xl p-5 shadow-card border border-gray-100 cursor-default`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-gray-400">so với tháng trước</span>
        </div>
      )}
    </div>
  );
}
