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
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#2563EB]',
    border: 'border-[#BFDBFE]',
    icon: Clock,
  },
  IN_REVIEW: {
    label: 'In Review',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
    icon: Search,
  },
  ACTION_SCHEDULED: {
    label: 'Action Scheduled',
    bg: 'bg-[#F8FAFC]',
    text: 'text-[#475569]',
    border: 'border-[#CBD5E1]',
    icon: CalendarClock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-[#E6F5F1]',
    text: 'text-[#087F72]',
    border: 'border-[#B2E3D8]',
    icon: Wrench,
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
    icon: XCircle,
  },
};

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const normalizedStatus = (status || 'SUBMITTED').toUpperCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    bg: 'bg-[#F8FAFC]',
    text: 'text-[#64748B]',
    border: 'border-[#E2E8F0]',
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
