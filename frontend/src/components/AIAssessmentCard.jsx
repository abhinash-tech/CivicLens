import React from 'react';
import { Sparkles, ShieldAlert, Cpu, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function AIAssessmentCard({ assessment, className = '' }) {
  if (!assessment) return null;

  const {
    issueType,
    severity,
    department,
    summary,
    riskReason,
    recommendedAction,
    confidence = 'High',
    needsHumanReview = true,
  } = assessment;

  const confidenceColor = {
    High: 'bg-[#E6F5F1] text-[#087F72] border-[#B2E3D8]',
    Medium: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    Low: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  }[confidence] || 'bg-[#E6F5F1] text-[#087F72] border-[#B2E3D8]';

  return (
    <div className={`rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm ${className}`}>
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#087F72] text-white flex items-center justify-center shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
              Gemini AI Triage Assessment
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#087F72] text-white">
                Automated
              </span>
            </h4>
            <p className="text-xs text-[#64748B]">Multimodal vision analysis & civic risk prioritization</p>
          </div>
        </div>

        {/* Confidence & Review badge */}
        <div className="flex items-center gap-2">
          {confidence && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${confidenceColor}`}>
              <Cpu size={12} />
              {confidence} Confidence
            </span>
          )}
          {needsHumanReview ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center gap-1">
              <UserCheck size={12} />
              Review Pending
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] flex items-center gap-1">
              <CheckCircle2 size={12} />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Meta tags: Issue Type, Severity, Department */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">
            Detected Issue
          </span>
          <span className="text-sm font-medium text-[#111827] block truncate">
            {issueType || 'General Infrastructure'}
          </span>
        </div>

        <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">
            Assessed Severity
          </span>
          <div>
            <SeverityBadge severity={severity || 'Medium'} size="sm" />
          </div>
        </div>

        <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">
            Target Department
          </span>
          <span className="text-sm font-medium text-[#087F72] block truncate">
            {department || 'Public Works'}
          </span>
        </div>
      </div>

      {/* Details breakdown */}
      <div className="space-y-3 pt-1 text-sm">
        {summary && (
          <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1">
              Issue Summary
            </h5>
            <p className="text-[#111827] leading-relaxed text-xs sm:text-sm">{summary}</p>
          </div>
        )}

        {riskReason && (
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-3 rounded-lg flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-[#EA580C] mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold text-[#9A3412] mb-0.5">Risk & Impact Evaluation</h5>
              <p className="text-xs sm:text-sm text-[#C2410C] leading-relaxed">{riskReason}</p>
            </div>
          </div>
        )}

        {recommendedAction && (
          <div className="bg-[#F0FDF9] border border-[#A7F3D0] p-3 rounded-lg flex items-start gap-2.5">
            <ArrowRight size={16} className="text-[#087F72] mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold text-[#065F54] mb-0.5">Recommended Municipal Action</h5>
              <p className="text-xs sm:text-sm text-[#087F72] leading-relaxed">{recommendedAction}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
