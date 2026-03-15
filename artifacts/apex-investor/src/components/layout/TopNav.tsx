import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Menu, X } from 'lucide-react';

interface TopNavProps {
  onMobileMenuOpen: () => void;
}

export function TopNav({ onMobileMenuOpen }: TopNavProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchExpanded(false);
    }
  };

  return (
    <header className="h-14 sm:h-16 lg:h-20 bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo — mobile only (visible when sidebar is hidden) */}
      <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-primary-foreground font-black text-sm tracking-tighter">AX</span>
        </div>
        <span className="font-display font-bold text-base text-foreground">APEX</span>
      </div>

      {/* Search — desktop always visible, mobile expandable */}
      <form
        onSubmit={handleSearch}
        className={`
          ${searchExpanded
            ? 'absolute inset-x-0 top-0 h-full px-4 bg-background/95 backdrop-blur-md z-50 flex items-center gap-3'
            : 'hidden sm:flex flex-1 max-w-md relative'
          }
        `}
      >
        {searchExpanded && (
          <button
            type="button"
            onClick={() => setSearchExpanded(false)}
            className="p-2 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, tickers, ideas..."
            autoFocus={searchExpanded}
            className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-2 sm:py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </form>

      {/* Mobile search icon */}
      <button
        onClick={() => setSearchExpanded(true)}
        className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Right side spacer on desktop */}
      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">AX</span>
        </div>
      </div>
    </header>
  );
}
