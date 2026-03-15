import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { APP_CATEGORIES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, LayoutDashboard, Search, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    "Knowledge Base": true,
    "Opportunities & Analysis": false,
    "Stock-Specific": true,
    "Investing Styles": false,
    "Worst Cases": false,
    "Personal System": true,
    "Custom Sections": false,
    "Learning & Planning": true,
  });

  const toggleCat = (name: string) => {
    setExpandedCats(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <div className="w-72 bg-card border-r border-border h-screen flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-black text-lg sm:text-xl tracking-tighter">AX</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg sm:text-xl leading-none text-foreground tracking-tight">APEX</h1>
            <h2 className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Investor</h2>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="space-y-1">
          <Link href="/" onClick={handleNavClick} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
            location === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/search" onClick={handleNavClick} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
            location.startsWith("/search") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <Search className="w-5 h-5" />
            Global Search
          </Link>
          <Link href="/settings" onClick={handleNavClick} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
            location.startsWith("/settings") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>

        {APP_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isExpanded = expandedCats[cat.name];

          return (
            <div key={cat.name} className="space-y-1">
              <button
                onClick={() => toggleCat(cat.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  <span className="tracking-wide">{cat.name}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-0.5 ml-2 border-l border-border/50 pl-2"
                  >
                    {cat.sections.map(section => {
                      const href = section.customRoute || `/sections/${section.slug}`;
                      const isActive = location === href;
                      return (
                        <Link
                          key={section.slug}
                          href={href}
                          onClick={handleNavClick}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-muted text-foreground font-semibold border-l-2 border-primary -ml-[9px] pl-[10px]"
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          )}
                        >
                          {section.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
