import React from 'react';
import { 
  Clock, 
  Search, 
  CalendarClock, 
  Wrench, 
  CheckCircle2, 
  XCircle,
  HelpCircle 
} from 'lucide-react';

const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Submitted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Clock,
  },
  IN_REVIEW: {
    label: 'In Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Search,
  },
  ACTION_SCHEDULED: {
    label: 'Action Scheduled',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: CalendarClock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: Wrench,
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const normalizedStatus = (status || 'SUBMITTED').toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: HelpCircle,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size] || 14;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
