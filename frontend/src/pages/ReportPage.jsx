import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  Copy, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import AIAssessmentCard from '../components/AIAssessmentCard';

export default function ReportPage() {
  const [formData, setFormData] = useState({
    title: '',
    locality: '',
    landmark: '',
    description: '',
    citizenName: '',
    citizenPhone: '',
    citizenEmail: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Image size exceeds 10MB limit. Please upload a smaller photo.');
      return;
    }

    setSubmitError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Client-side validation
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setSubmitError('Title must be at least 5 characters long.');
      return;
    }
    if (!formData.locality.trim() || formData.locality.trim().length < 2) {
      setSubmitError('Locality is required (at least 2 characters).');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setSubmitError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('locality', formData.locality.trim());
      if (formData.landmark.trim()) payload.append('landmark', formData.landmark.trim());
      payload.append('description', formData.description.trim());
      if (formData.citizenName.trim()) payload.append('citizenName', formData.citizenName.trim());
      if (formData.citizenPhone.trim()) payload.append('citizenPhone', formData.citizenPhone.trim());
      if (formData.citizenEmail.trim()) payload.append('citizenEmail', formData.citizenEmail.trim());

      if (imageFile) {
        payload.append('image', imageFile);
      }

      const res = await api.submitComplaint(payload);

      if (res?.success && res?.data) {
        setSubmissionResult(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(res?.message || 'Failed to submit complaint');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'Network error occurred while submitting your complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!submissionResult?.complaintCode) return;
    navigator.clipboard.writeText(submissionResult.complaintCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      locality: '',
      landmark: '',
      description: '',
      citizenName: '',
      citizenPhone: '',
      citizenEmail: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setSubmissionResult(null);
    setSubmitError(null);
  };

  // If submitted successfully, show AI Assessment & Confirmation View
  if (submissionResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-300">
        {/* Success Header */}
        <div className="card-subtle bg-white p-6 sm:p-8 text-center space-y-4 border-teal-200">
          <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900">
              Complaint Registered Successfully!
            </h2>
            <p className="text-sm text-slate-600">
              Your report has been entered into the municipal system and triaged by Gemini AI.
            </p>
          </div>

          {/* Tracking Code Box */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto">
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider block mb-1">
              Your Unique Tracking Code
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-teal-700 tracking-wider">
                {submissionResult.complaintCode}
              </span>
              <button
                onClick={copyCode}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-700 transition-colors shadow-2xs"
                title="Copy code"
              >
                {copiedCode ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
              </button>
            </div>
            {copiedCode && (
              <p className="text-xs text-emerald-600 font-medium mt-1">Copied to clipboard!</p>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              Please save this code. You can use it to track real-time resolution progress anytime.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/track/${encodeURIComponent(submissionResult.complaintCode)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <span>Track Resolution Status</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 shadow-2xs transition-all"
            >
              <RefreshCw size={15} />
              <span>Report Another Issue</span>
            </button>
          </div>
        </div>

        {/* Live AI Assessment Preview */}
        {submissionResult.aiAssessment && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" />
              Automated AI Triage Summary
            </h3>
            <AIAssessmentCard assessment={submissionResult.aiAssessment} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Camera size={14} className="text-teal-600" />
          <span>Citizen Incident Filing</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-600">
          Upload a photo and details of the infrastructure issue. Our AI engine classifies severity and routes it directly to municipal dispatch.
        </p>
      </div>

      {/* Error alert */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-900">Unable to Submit Report</h4>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Photo Upload */}
        <div className="card-subtle p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-navy-900">
              Attach Photo of the Issue
              <span className="text-xs font-normal text-slate-500 ml-1.5">(Recommended for AI triage)</span>
            </label>
            {imageFile && (
              <button
                type="button"
                onClick={removeImage}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <X size={14} /> Remove photo
              </button>
            )}
          </div>

          {!imagePreview ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-slate-50/50">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                  <Camera size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    Take a snapshot or upload an image
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {/* File browser */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                  >
                    <Upload size={14} />
                    Browse Files
                  </label>

                  {/* Direct Camera capture for mobile */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="camera-upload"
                  />
                  <label
                    htmlFor="camera-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white shadow-2xs transition-colors"
                  >
                    <Camera size={14} />
                    Take Photo
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Issue preview"
                className="max-h-80 w-auto object-contain mx-auto"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/60 text-white text-xs backdrop-blur-xs flex items-center gap-1.5">
                <Check size={13} className="text-teal-400" />
                <span>Ready for AI vision scan ({imageFile?.name})</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Issue Details */}
        <div className="card-subtle p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-2">
            Issue Details
          </h3>

          <div>
            <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Deep pothole causing heavy traffic hazard"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="locality" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Locality / Area <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="locality"
                  name="locality"
                  type="text"
                  required
                  placeholder="e.g. Indiranagar, Ward 82"
                  value={formData.locality}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="landmark" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Landmark <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="landmark"
                name="landmark"
                type="text"
                placeholder="e.g. Opposite Metro Pillar 42"
                value={formData.landmark}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Describe the severity, depth/size, hazard risk to pedestrians or vehicles, and when you first noticed it..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        {/* Section 3: Citizen Contact Info (Optional) */}
        <div className="card-subtle p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-navy-900">
              Citizen Contact Information
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Optional. Provide your contact details if you wish to receive municipal SMS or resolution notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="citizenName" className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="citizenName"
                  name="citizenName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.citizenName}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="citizenPhone" className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="citizenPhone"
                  name="citizenPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.citizenPhone}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="citizenEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  id="citizenEmail"
                  name="citizenEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.citizenEmail}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white text-base shadow-md transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-teal-700 cursor-not-allowed opacity-90'
                : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI analyzing photo & registering complaint...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Submit Complaint with AI Triage</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            By submitting, you agree to public display of the issue location and anonymized photo for community tracking.
          </p>
        </div>
      </form>
    </div>
  );
}
