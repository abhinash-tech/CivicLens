import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  Critical: {
    label: 'Critical',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    icon: AlertOctagon,
  },
  High: {
    label: 'High',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
  },
  Medium: {
    label: 'Medium',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: AlertCircle,
  },
  Low: {
    label: 'Low',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: Info,
  },
};

export default function SeverityBadge({ severity = 'Medium', size = 'md', showDot = false }) {
  const normalizedKey = Object.keys(SEVERITY_CONFIG).find(
    (k) => k.toLowerCase() === (severity || '').toLowerCase()
  ) || 'Medium';

  const config = SEVERITY_CONFIG[normalizedKey];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  const iconSizes = {
    sm: 12,
    md: 13,
    lg: 15,
  }[size] || 13;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showDot ? (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      ) : (
        <Icon size={iconSizes} className="shrink-0" />
      )}
      <span>{config.label}</span>
    </span>
  );
}
