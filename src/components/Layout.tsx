import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/plugins", label: "Plugins" },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-6">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="https://www.jenkins.io/images/logos/jenkins/jenkins.png"
              alt="Jenkins"
              className="h-8"
            />
            <span className="font-semibold text-slate-800 hidden sm:inline">
              Plugin Modernizer Stats
            </span>
          </NavLink>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#D33833]/10 text-[#D33833]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
