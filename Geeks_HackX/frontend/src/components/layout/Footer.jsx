import { Link } from 'react-router-dom';

const PLATFORM_LINKS = [
  { label: 'How it Works', to: '#how-it-works' },
  { label: 'Safety Guidelines', to: '/safety' },
  { label: 'Partner Cities', to: '/cities' },
  { label: 'Live Statistics', to: '#stats' },
];

const COMPANY_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Contact Support', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
];

/** Public site footer — Landing, Profile, etc. */
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="bg-[#1e3b8a] p-1.5 rounded-lg text-white">
                <span className="material-symbols-outlined block" style={{ fontSize: 24 }}>location_city</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">JanAwaaz</span>
            </Link>
            <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
              We are building a bridge between citizens and city authorities. Our goal is to create
              more transparent, responsive, and better-maintained urban environments for everyone.
            </p>
            <div className="flex gap-4">
              {[
                { icon: 'public', href: '#' },
                { icon: 'share', href: '#' },
                { icon: 'mail', href: '#' },
              ].map(({ icon, href }) => (
                <a
                  key={icon}
                  href={href}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1e3b8a] transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-widest mb-6 text-slate-500">Platform</h5>
            <ul className="space-y-4">
              {PLATFORM_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <a href={to} className="text-slate-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-widest mb-6 text-slate-500">Company</h5>
            <ul className="space-y-4">
              {COMPANY_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} JanAwaaz. Built for better communities.</p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>language</span>
            English (IN)
          </div>
        </div>
      </div>
    </footer>
  );
}
