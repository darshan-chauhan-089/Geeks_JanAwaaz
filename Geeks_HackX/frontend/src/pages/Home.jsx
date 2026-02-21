import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useIssues } from '@hooks/useIssues';
import Navbar from '@components/layout/Navbar';
import Footer from '@components/layout/Footer';
import IssueCard from '@components/issues/IssueCard';
import StatCard from '@components/ui/StatCard';
import Loader from '@components/common/Loader';

const HOW_IT_WORKS = [
  { step: 1, icon: 'add_a_photo',   title: 'Report',  desc: 'Take a photo of the issue, pin the exact GPS location, and add a brief description in seconds.' },
  { step: 2, icon: 'verified_user', title: 'Verify',  desc: 'Community members and moderators validate reports to ensure accuracy and determine urgency level.' },
  { step: 3, icon: 'build',         title: 'Resolve', desc: 'Local authorities receive verified data to prioritize fixes. You get notified as progress happens.' },
];

const PLATFORM_STATS = [
  { value: '12,450+', label: 'Issues Reported',  trend: '12% this month',      trendIcon: 'trending_up' },
  { value: '8,920+',  label: 'Issues Resolved',   trend: '71% resolution rate', trendIcon: 'check_circle', bordered: true },
  { value: '45,000+', label: 'Citizens Involved', trend: '+1.2k today',          trendIcon: 'groups' },
];

export default function Home() {
  const { user } = useAuth();
  const { issues, isLoading } = useIssues({ sort: 'verified', limit: 6 }, { fetchOnMount: true });

  return (
    <div className="bg-[#f6f6f8] dark:bg-[#121620] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <header className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e3b8a]/10 text-[#1e3b8a] text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1e3b8a] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1e3b8a]" />
                </span>
                Live in 42 Cities
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Empower Citizens.{' '}
                <span className="text-[#1e3b8a]">Fix Cities.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                The verification-based platform for reporting and resolving local infrastructure issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link to="/issues/new" className="bg-[#1e3b8a] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-[#1e3b8a]/30 hover:scale-[1.02] transition-transform text-center">
                    Report Issue
                  </Link>
                ) : (
                  <Link to="/login" className="bg-[#1e3b8a] text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-[#1e3b8a]/30 hover:scale-[1.02] transition-transform text-center">
                    Get Started
                  </Link>
                )}
                <a href="#explore" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-xl text-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-center">
                  Explore Issues
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#1e3b8a]/5 rounded-full blur-3xl" />
              <div className="relative bg-slate-200 dark:bg-slate-800 rounded-xl aspect-[4/3] shadow-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80"
                  alt="City overview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1e3b8a]/10 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <section id="stats" className="py-12 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLATFORM_STATS.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4 italic">How It Works</h2>
            <div className="w-16 h-1.5 bg-[#1e3b8a] mx-auto rounded-full" />
            <p className="mt-6 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Three simple steps to improve your community infrastructure through collective action.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 relative hover:shadow-md transition-shadow">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#1e3b8a] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">{step}</div>
                <div className="bg-[#1e3b8a]/5 w-16 h-16 rounded-2xl flex items-center justify-center text-[#1e3b8a] mb-6">
                  <span className="material-symbols-outlined" style={{ fontSize: 40 }}>{icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Issues ── */}
      <section id="explore" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4">Featured Local Issues</h2>
              <p className="text-slate-600 dark:text-slate-400">See what&rsquo;s happening in your neighborhood right now.</p>
            </div>
            <Link to="/dashboard" className="text-[#1e3b8a] font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
              View all reports <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="h-48 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : issues.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {issues.map((issue) => <IssueCard key={issue._id} issue={issue} variant="landing" />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600" style={{ fontSize: 64 }}>feed</span>
              <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">No issues reported yet.</p>
              <Link to="/issues/new" className="mt-4 inline-block bg-[#1e3b8a] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#1e3b8a]/90 transition-colors">
                Be the first to report
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
