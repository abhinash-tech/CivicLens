import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  Critical: {
    label: 'Critical',
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
    dot: 'bg-[#DC2626]',
    icon: AlertOctagon,
  },
  High: {
    label: 'High',
    bg: 'bg-[#FFF7ED]',
    text: 'text-[#EA580C]',
    border: 'border-[#FFEDD5]',
    dot: 'bg-[#EA580C]',
    icon: AlertTriangle,
  },
  Medium: {
    label: 'Medium',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
    dot: 'bg-[#D97706]',
    icon: AlertCircle,
  },
  Low: {
    label: 'Low',
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#16A34A]',
    border: 'border-[#BBF7D0]',
    dot: 'bg-[#16A34A]',
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
