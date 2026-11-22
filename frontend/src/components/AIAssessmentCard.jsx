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
    High: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
  }[confidence] || 'bg-teal-100 text-teal-800 border-teal-200';

  return (
    <div className={`rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/60 via-white to-slate-50 p-5 shadow-sm ${className}`}>
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-teal-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
              Gemini AI Triage Assessment
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-600 text-white">
                Automated
              </span>
            </h4>
            <p className="text-xs text-slate-500">Multimodal vision analysis & civic risk prioritization</p>
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
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <UserCheck size={12} />
              Review Pending
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Meta tags: Issue Type, Severity, Department */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Detected Issue
          </span>
          <span className="text-sm font-medium text-navy-900 block truncate">
            {issueType || 'General Infrastructure'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Assessed Severity
          </span>
          <div>
            <SeverityBadge severity={severity || 'Medium'} size="sm" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Target Department
          </span>
          <span className="text-sm font-medium text-teal-800 block truncate">
            {department || 'Public Works'}
          </span>
        </div>
      </div>

      {/* Details breakdown */}
      <div className="space-y-3 pt-1 text-sm">
        {summary && (
          <div className="bg-white/80 p-3 rounded-lg border border-slate-200/60">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Issue Summary
            </h5>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{summary}</p>
          </div>
        )}

        {riskReason && (
          <div className="bg-orange-50/60 border border-orange-200/80 p-3 rounded-lg flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-orange-600 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold text-orange-900 mb-0.5">Risk & Impact Evaluation</h5>
              <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">{riskReason}</p>
            </div>
          </div>
        )}

        {recommendedAction && (
          <div className="bg-teal-50/70 border border-teal-200/80 p-3 rounded-lg flex items-start gap-2.5">
            <ArrowRight size={16} className="text-teal-700 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold text-teal-900 mb-0.5">Recommended Municipal Action</h5>
              <p className="text-xs sm:text-sm text-teal-800 leading-relaxed">{recommendedAction}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
