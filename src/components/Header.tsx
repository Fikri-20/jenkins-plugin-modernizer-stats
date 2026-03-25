export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#D33833" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="#D33833" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-semibold text-slate-800">Jenkins Plugin Modernizer</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-600 hover:text-slate-800 transition">Dashboard</a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-800 transition">Plugins</a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-800 transition">API</a>
            <a href="https://github.com/jenkins-infra/plugin-modernizer-tool" 
               className="text-sm font-medium text-slate-600 hover:text-slate-800 transition flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}