"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navItems = [
  {
    href: "/meetings",
    label: "Meetings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/action-items",
    label: "Action Items",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6.5 9L8 10.5 11.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 13L6 9l3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    comingSoon: true,
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="5" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    comingSoon: true,
  },
];

const bottomNavItems = [
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.93 3.93l1.06 1.06M13.01 13.01l1.06 1.06M3.93 14.07l1.06-1.06M13.01 4.99l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    comingSoon: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col sticky top-0 transition-colors">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <Link href="/meetings" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="white" />
              <path d="M1 8C1 8 3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" stroke="white" strokeWidth="1.2" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight">Fireflies</span>
            <span className="text-violet-600 dark:text-violet-500 font-bold text-sm">.ai</span>
          </div>
        </Link>
      </div>

      {/* Workspace label */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">WS</span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">My Workspace</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" className="text-gray-400 dark:text-gray-500" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.comingSoon ? "#" : item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
              } ${item.comingSoon ? "cursor-default opacity-60" : ""}`}
              onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <span className={isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.comingSoon && (
                <span className="ml-auto text-[9px] font-semibold bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 px-1.5 py-0.5 rounded-full">
                  SOON
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Coming Soon Features */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider px-3 mb-2">Coming Soon</p>
        {[
          { label: "Live Meeting Bot", icon: "🤖" },
          { label: "Calendar Sync", icon: "📅" },
          { label: "CRM Integration", icon: "🔗" },
          { label: "Team Collaboration", icon: "👥" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 cursor-default">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-0.5">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800/50 dark:hover:text-gray-300 transition-colors cursor-default opacity-60"
            onClick={(e) => e.preventDefault()}
          >
            <span className="text-gray-400">{item.icon}</span>
            <span>{item.label}</span>
            <span className="ml-auto text-[9px] font-semibold bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 px-1.5 py-0.5 rounded-full">SOON</span>
          </Link>
        ))}

        {/* User profile & Theme Toggle */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors flex-1 min-w-0">
            <Avatar name="Demo User" color="#6366f1" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">Demo User</p>
              <p className="text-[10px] text-gray-400 truncate">demo@company.com</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
