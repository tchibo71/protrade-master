import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, BookOpen, Search, BarChart2, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/training", label: "Training", icon: BookOpen },
  { path: "/code-lookup", label: "Code Lookup", icon: Search },
  { path: "/progress", label: "Progress", icon: BarChart2 },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <HardHat className="w-6 h-6 text-yellow-400" />
        <span className="font-bold text-lg tracking-tight text-white">TN Contractor Trainer</span>
        <span className="text-xs text-gray-500 ml-1 hidden sm:block">Greene County · Tennessee Jurisdiction</span>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-16 sm:w-52 bg-gray-900 border-r border-gray-800 flex flex-col py-4 gap-1 shrink-0">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === path
                  ? "bg-yellow-400 text-gray-900"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
          <div className="h-32" />
        </main>
      </div>
    </div>
  );
}