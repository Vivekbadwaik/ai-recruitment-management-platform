import { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidateService';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Save,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CandidateResumeUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [savingReview, setSavingReview] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState(true);
  const [reparsingId, setReparsingId] = useState(null);

  const checkStatusAndResumes = async () => {
    try {
      const [resumesData, healthData] = await Promise.allSettled([
        candidateService.getResumes(),
        candidateService.getSystemHealth(),
      ]);
      if (resumesData.status === 'fulfilled') {
        setResumes(resumesData.value || []);
      }
      if (healthData.status === 'fulfilled') {
        setGroqConfigured(Boolean(healthData.value?.groq_configured));
      }
    } catch {
      // Non-blocking error
    }
  };

  useEffect(() => {
    checkStatusAndResumes();
  }, []);

  const handleReparse = async (resumeId) => {
    setReparsingId(resumeId);
    try {
      const result = await candidateService.reparseResume(resumeId);
      toast.success('Resume successfully parsed with Groq AI!');
      if (result.parsed_data) {
        setParsedData(result.parsed_data);
      }
      checkStatusAndResumes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Re-parsing failed');
    } finally {
      setReparsingId(null);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'doc'].includes(ext)) {
        toast.error('Only PDF and DOCX files are supported.');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a resume file first.');
      return;
    }

    setUploading(true);
    setParsedData(null);
    try {
      const result = await candidateService.uploadResume(file);
      toast.success('Resume uploaded & processed!');
      if (result.parsed_data) {
        setParsedData(result.parsed_data);
      } else if (result.parsing_status === 'failed') {
        toast.error(`AI Parsing notice: ${result.parsing_error || 'Could not parse with Groq API'}`);
      }
      setFile(null);
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process resume');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveReviewedData = async () => {
    if (!parsedData) return;
    setSavingReview(true);
    try {
      await candidateService.updateProfile({
        full_name: parsedData.full_name,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        headline: parsedData.headline,
        summary: parsedData.summary,
        skills: parsedData.skills || [],
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        total_experience_years: parsedData.total_experience_years || 0.0,
      });
      toast.success('Profile updated with reviewed resume information!');
      setParsedData(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload & AI Resume Parsing</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Upload your resume in PDF or DOCX format. Our Groq-powered AI engine extracts your skills, experience, and education directly into your profile.
        </p>
      </div>

      {/* Groq Configuration Alert */}
      {!groqConfigured && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Groq AI API Key Required for Parsing</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Resumes uploaded will be stored securely on the server and text extracted, but live AI parsing into skills, work history, and profile fields requires a free Groq API key configured in the backend environment.
            </p>
            <div className="pt-1.5 flex flex-wrap items-center gap-3 text-xs">
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-amber-950 underline hover:text-indigo-600 transition-colors"
              >
                Get Free API Key at console.groq.com <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-amber-300">•</span>
              <span className="text-amber-800">
                Add <code className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-mono font-medium text-[11px]">GROQ_API_KEY=gsk_...</code> to <code className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-mono font-medium text-[11px]">backend/.env</code>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors bg-indigo-50/20">
            <input
              type="file"
              id="resume-file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-file" className="cursor-pointer block">
              <div className="w-14 h-14 bg-indigo-100/70 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Click to select or drag and drop your resume'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports PDF or DOCX (Max 10MB)</p>
            </label>
            {file && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                <FileText className="w-4 h-4" />
                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Groq LLM extracts structured skills, projects, and career history automatically.
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Parsing with Groq AI...
                </>
              ) : (
                'Upload & Parse Resume'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Review Extracted Data (if newly parsed) */}
      {parsedData && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Extracted Information (Review Form)</h2>
                <p className="text-xs text-slate-500">
                  Review the information parsed by the AI before confirming it into your profile.
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveReviewedData}
              disabled={savingReview}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingReview ? 'Saving...' : 'Save & Update Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Extracted Name</label>
              <input
                type="text"
                value={parsedData.full_name || ''}
                onChange={(e) => setParsedData({ ...parsedData, full_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Extracted Email</label>
              <input
                type="email"
                value={parsedData.email || ''}
                onChange={(e) => setParsedData({ ...parsedData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={parsedData.phone || ''}
                onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                value={parsedData.total_experience_years || 0}
                onChange={(e) =>
                  setParsedData({ ...parsedData, total_experience_years: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Extracted Headline</label>
              <input
                type="text"
                value={parsedData.headline || ''}
                onChange={(e) => setParsedData({ ...parsedData, headline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Extracted Skills</label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                {(parsedData.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-indigo-700 border border-indigo-100 shadow-2xs"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Resumes History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Resume Upload History</h2>
          <Link
            to="/candidate/profile"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            Go to Full Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {resumes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No resumes uploaded yet. Upload your PDF or DOCX resume above.
            </div>
          ) : (
            resumes.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 uppercase font-bold text-xs shrink-0 mt-0.5">
                    {r.file_type}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{r.original_filename}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Uploaded on {new Date(r.uploaded_at).toLocaleDateString()} • {(r.file_size / 1024).toFixed(1)} KB
                    </p>
                    {r.parsing_error && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-start gap-1 font-medium bg-red-50/80 border border-red-100 rounded-md px-2.5 py-1 max-w-xl">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{r.parsing_error}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.parsing_status === 'completed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> AI Parsed
                    </span>
                  )}
                  {r.parsing_status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <span
                        title={r.parsing_error || 'Parsing error'}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Parsing Failed
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReparse(r.id)}
                        disabled={reparsingId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
                      >
                        {reparsingId === r.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            Retry AI Parsing
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {r.parsing_status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Processing
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
