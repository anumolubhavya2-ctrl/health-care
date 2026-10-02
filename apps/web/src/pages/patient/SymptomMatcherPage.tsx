import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Search, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { symptomApi } from '../../api/endpoints';
import { DoctorCard } from '../../components/DoctorCard';
import { Spinner } from '../../components/ui/Spinner';
import type { SymptomMatchResult } from '../../types';

const EXAMPLES = [
  'Persistent headache and dizziness', 'Chest pain and shortness of breath',
  'Skin rash and itching', 'Joint pain and stiffness',
  'Stomach pain and nausea', 'Breathing difficulty and cough',
  'Blurred vision and eye pain', 'Ear pain and hearing loss',
  'Anxiety and trouble sleeping', 'Fever and body ache',
];

export const SymptomMatcherPage: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<SymptomMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.trim().length < 3) { setError('Please describe your symptoms in more detail.'); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await symptomApi.match(symptoms);
      if (data.data) setResult(data.data);
    } catch { setError('Unable to analyze symptoms. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-container py-10 max-w-4xl">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Stethoscope size={28} className="text-violet-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Not sure which specialist you need?</h1>
        <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">Describe your symptoms and we'll recommend the right type of specialist.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-8">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Medical Disclaimer:</strong> This tool is for <strong>specialist navigation only</strong> and does NOT provide medical diagnoses.
          Always consult a qualified healthcare professional. In emergencies, call 112.
        </p>
      </div>

      <form onSubmit={handleMatch} className="card p-6 mb-6">
        <label className="label text-base">Describe your symptoms</label>
        <textarea className="input min-h-[120px] resize-none text-base mb-4" rows={4}
          placeholder="e.g., I've had a persistent skin rash with itching for the past two weeks..."
          value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400">{symptoms.length} characters</p>
          <button type="submit" disabled={loading || symptoms.length < 3} className="btn-primary">
            {loading ? <Spinner size="sm" /> : <Sparkles size={16} />}
            {loading ? 'Analyzing...' : 'Find My Specialist'}
          </button>
        </div>
      </form>

      {!result && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-3">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((s) => (
              <button key={s} type="button" onClick={() => { setSymptoms(s); setResult(null); }}
                className="text-sm px-4 py-2 bg-white rounded-xl border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6 border-2 border-primary-200 bg-primary-50/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={20} className="text-primary-600" />
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">Recommended Specialist</p>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{result.recommendation.specialty}</h2>
                <p className="text-gray-600 mt-2 text-sm leading-relaxed">{result.recommendation.reason}</p>
              </div>
              <div className="text-center bg-white rounded-xl p-3 min-w-[80px]">
                <p className="text-2xl font-bold text-primary-700">{Math.round(result.recommendation.confidence * 100)}%</p>
                <p className="text-xs text-gray-500">match</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Link to={`/doctors?specialty=${result.recommendation.specialtySlug}`} className="btn-primary btn-sm">
                <Search size={14} />Browse {result.recommendation.specialty}s
              </Link>
              <button onClick={() => { setResult(null); setSymptoms(''); }} className="btn-secondary btn-sm">Search Again</button>
            </div>
          </div>

          {result.doctors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available {result.recommendation.specialty}s</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <AlertTriangle size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
