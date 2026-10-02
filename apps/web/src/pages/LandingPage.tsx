import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Search, Clock, CreditCard, RotateCcw,
  MessageCircle, ShieldCheck, Star, ChevronRight,
  Heart, Stethoscope, Users, CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { specialtyApi, doctorApi } from '../api/endpoints';
import { DoctorCard } from '../components/DoctorCard';
import { Spinner } from '../components/ui/Spinner';

const features = [
  { icon: Activity, title: 'Live Doctor Status', description: 'Know if your doctor is available, delayed, in consultation, or on leave — in real time, before you even leave home.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Clock, title: 'Live Queue Tracking', description: 'Get your token number on booking. Track your exact position in the queue and estimated wait time live.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Search, title: 'AI Symptom Matching', description: 'Not sure which specialist you need? Describe your symptoms and get matched to the right doctor type instantly.', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: RotateCcw, title: 'Instant Refund Tracking', description: 'Track the status of every refund in real time — from request to bank transfer, with no ambiguity.', color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: MessageCircle, title: 'Human Support', description: 'Get real answers from real people. Escalate any issue to a live support agent with one tap.', color: 'text-pink-600', bg: 'bg-pink-50' },
  { icon: CreditCard, title: 'Transparent Pricing', description: 'See the exact consultation fee before you book. No hidden charges. No surprises.', color: 'text-teal-600', bg: 'bg-teal-50' },
];

const stats = [
  { value: '50,000+', label: 'Patients served', icon: Users },
  { value: '1,200+', label: 'Verified doctors', icon: Stethoscope },
  { value: '4.8★', label: 'Average rating', icon: Star },
  { value: '99.2%', label: 'Uptime SLA', icon: ShieldCheck },
];

const howItWorks = [
  { step: '01', title: 'Search or describe symptoms', desc: 'Find doctors by specialty or let our symptom matcher guide you to the right specialist.' },
  { step: '02', title: 'Check live status & book', desc: 'See real-time doctor availability, fees, and queue length. Book a slot in seconds.' },
  { step: '03', title: 'Track your queue live', desc: "Get your token number. Know exactly when it's your turn with live queue updates." },
  { step: '04', title: 'Pay & get support', desc: 'Transparent pricing, instant payment, and refund tracking if anything goes wrong.' },
];

export const LandingPage: React.FC = () => {
  const { data: specialtiesData } = useQuery({ queryKey: ['specialties'], queryFn: specialtyApi.getAll, staleTime: Infinity });
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({ queryKey: ['featured-doctors'], queryFn: () => doctorApi.search({ limit: 4, status: 'AVAILABLE' }), staleTime: 1000 * 60 * 5 });

  const specialties = specialtiesData?.data?.data?.slice(0, 8) ?? [];
  const doctors = doctorsData?.data?.data ?? [];

  return (
    <div className="animate-fade-in">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-teal-700 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-white/5 rounded-full" />
        </div>
        <div className="page-container relative z-10 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-primary-100 mb-8 border border-white/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live platform — 1,200+ doctors available now
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Healthcare appointments,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">without the uncertainty.</span>
            </h1>
            <p className="text-xl text-primary-200 leading-relaxed mb-10 max-w-2xl">
              Find the right specialist, know your doctor's live status, track your exact queue position, and get transparent pricing — before you even leave home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/doctors" className="btn-primary btn-lg bg-white text-primary-700 hover:bg-gray-100 shadow-xl shadow-black/20">
                <Search size={18} />Find a Doctor
              </Link>
              <Link to="/symptoms" className="btn-outline btn-lg border-white/40 text-white hover:bg-white/10">
                <Stethoscope size={18} />Find Specialist by Symptoms
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-3">
              {[{ color: 'bg-emerald-400', label: 'Available Now' }, { color: 'bg-amber-400', label: 'Busy' }, { color: 'bg-orange-400', label: 'Delayed' }, { color: 'bg-blue-400', label: 'In Consultation' }, { color: 'bg-gray-400', label: 'On Leave' }].map((s) => (
                <span key={s.label} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/80">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />{s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-14 bg-white border-b border-gray-100">
        <div className="page-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-3">
                  <Icon size={22} className="text-primary-600" />
                </div>
                <p className="text-3xl font-extrabold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Everything you wished appointment apps had</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">We built CareSync to fix every frustration with existing healthcare platforms.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Browse by Specialty</h2>
              <p className="text-gray-500 mt-1">Find the right specialist for your needs</p>
            </div>
            <Link to="/doctors" className="hidden sm:flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {specialties.map((s) => (
              <Link key={s.id} to={`/doctors?specialty=${s.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-100 transition-all group">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700 text-center leading-snug">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">How CareSync works</h2>
            <p className="mt-3 text-gray-500">Four simple steps to a better healthcare experience</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-black text-primary-100 mb-4">{step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED DOCTORS */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Doctors available now</h2>
              <p className="text-gray-500 mt-1">Book an appointment with a verified specialist today</p>
            </div>
            <Link to="/doctors" className="hidden sm:flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline">
              See all <ChevronRight size={16} />
            </Link>
          </div>
          {doctorsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-teal-600 text-white">
        <div className="page-container text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={28} className="text-white fill-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Ready to take control of your healthcare?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">Join CareSync today. Book smarter, wait less, pay transparently.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg bg-white text-primary-700 hover:bg-gray-100 shadow-lg">Get Started Free</Link>
            <Link to="/doctors" className="btn-outline btn-lg border-white/40 text-white hover:bg-white/10">Browse Doctors</Link>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-primary-200">
            <CheckCircle size={15} />No subscription required. Free to search and book.
          </p>
        </div>
      </section>
    </div>
  );
};
