import { useState } from 'react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';

export default function AdminBulkUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'docx', 'doc'].includes(ext);
    });
    if (valid.length < files.length) {
      toast.error('Some unsupported files were excluded. Only PDF and DOCX are allowed.');
    }
    setSelectedFiles(valid);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one resume file.');
      return;
    }

    setUploading(true);
    try {
      const res = await adminService.bulkUploadResumes(selectedFiles);
      setResults(res.results || []);
      toast.success(`Processed ${res.processed_count} resumes!`);
      setSelectedFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process bulk upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Resume Upload & Ingestion</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Upload dozens of PDF or DOCX resumes at once. Each resume is parsed independently by Groq LLM, candidate profiles are auto-created, and duplicate emails are automatically merged.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-colors bg-indigo-50/20">
            <input
              type="file"
              id="bulk-resumes"
              multiple
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="bulk-resumes" className="cursor-pointer block">
              <div className="w-14 h-14 bg-indigo-100/70 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} resumes selected`
                  : 'Click to select multiple PDF/DOCX resumes or drop files here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports batch uploading of .pdf, .docx files (up to 10MB each)
              </p>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Isolated fault tolerance: one failed resume will never interrupt remaining uploads.
            </div>
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || uploading}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Processing Resumes via AI...
                </>
              ) : (
                `Process ${selectedFiles.length} Resumes`
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Ingestion Results</h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              {results.filter((r) => r.status === 'completed').length} / {results.length} Successful
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">File Name</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Candidate Identified</th>
                  <th className="py-3.5 px-6">Email / Duplicate</th>
                  <th className="py-3.5 px-6">Skills Extracted</th>
                  <th className="py-3.5 px-6">Experience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((res, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {res.filename}
                    </td>
                    <td className="py-4 px-6">
                      {res.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                      {res.status === 'failed' && (
                        <span
                          title={res.message}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                        >
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-800">{res.full_name || '—'}</td>
                    <td className="py-4 px-6 text-xs">
                      <div>{res.email || '—'}</div>
                      {res.is_duplicate && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold">
                          Merged with Existing Candidate
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {res.skills_count ? `${res.skills_count} skills extracted` : '—'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      {res.experience_years ? `${res.experience_years} years` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
