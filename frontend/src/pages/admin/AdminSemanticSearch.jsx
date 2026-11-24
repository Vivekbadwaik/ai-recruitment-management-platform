import { useState } from 'react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  Search,
  Sparkles,
  MapPin,
  Clock,
  Send,
  Zap,
} from 'lucide-react';

export default function AdminSemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleQueries = [
    'Find Python developers with two years of experience and knowledge of machine learning',
    'Full stack developer proficient with React, FastAPI, and Docker',
    'Frontend UI developer experienced with Tailwind CSS and responsive interfaces',
    'Senior AI engineer skilled in PyTorch, transformers, and NLP pipelines',
  ];

  const handleSearch = async (e, customQuery = null) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const data = await adminService.semanticSearch(q, 0.0, 20);
      setResults(data || []);
      if (data.length === 0) {
        toast('No candidates found matching the query context.', { icon: '🔍' });
      }
    } catch {
      toast.error('Semantic search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-indigo-600" /> Semantic Talent Search
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Search candidate pool using natural human language. Powered by high-dimensional vector embeddings and cosine similarity retrieval.
        </p>
      </div>

      {/* Natural Language Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find Python developers with two years of experience and knowledge of machine learning..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {searching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Search Talent
          </button>
        </form>

        {/* Query Suggestions */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Example Queries:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sq);
                  handleSearch(null, sq);
                }}
                className="text-left px-3 py-1 rounded-lg text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
              >
                &ldquo;{sq}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {searching ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Vectorizing natural language query & computing cosine distances...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No candidates found matching this semantic query.
          </div>
        ) : (
          results.map((c, idx) => (
            <div
              key={c.user_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{c.full_name}</h3>
                    <p className="text-xs text-indigo-600 font-medium">{c.headline || 'Candidate'}</p>
                  </div>
                </div>

                {/* Similarity Badge */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semantic Match</p>
                    <p className="text-lg font-black text-indigo-600">{c.similarity_score}%</p>
                  </div>
                  <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, c.similarity_score)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {c.total_experience_years || 0} years experience
                </span>
                <span>• {c.email}</span>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                {(c.skills || []).map((sk, sidx) => (
                  <span
                    key={sidx}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
