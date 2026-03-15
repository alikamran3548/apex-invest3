import { useGetDashboard } from '@workspace/api-client-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { TrendingUp, BookOpen, Star, Target, Activity } from 'lucide-react';
import { EntryCard } from '@/components/cards/EntryCard';
import { useToggleStar, useToggleArchive } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useGetDashboard();
  const queryClient = useQueryClient();
  const toggleStarMutation = useToggleStar();
  const toggleArchiveMutation = useToggleArchive();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return <div className="text-destructive p-8 bg-destructive/10 rounded-2xl">Failed to load dashboard.</div>;
  }

  const { portfolioSummary, totalEntries, recentEntries, starredEntries } = dashboard;

  const handleToggleStar = async (id: number) => {
    await toggleStarMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  };

  const handleToggleArchive = async (id: number) => {
    await toggleArchiveMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  };

  return (
    <div className="space-y-8 pb-24">
      <header>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Welcome back, Apex.</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">Here's your investment command center.</p>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1 sm:mb-2">Portfolio Value</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">
            {formatCurrency(portfolioSummary?.totalValue || 0)}
          </h3>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2 flex items-center gap-1 flex-wrap">
            <span className={((portfolioSummary?.totalUnrealisedPnl || 0) >= 0) ? "text-success" : "text-destructive"}>
              {((portfolioSummary?.totalUnrealisedPnl || 0) >= 0) ? '+' : ''}{formatCurrency(portfolioSummary?.totalUnrealisedPnl)}
            </span>
            <span className="text-muted-foreground">all time</span>
          </p>
        </div>

        <div className="glass-panel p-4 sm:p-6 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1 sm:mb-2">Knowledge</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">{totalEntries}</h3>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-primary flex items-center gap-1">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" /> 38 sections
          </p>
        </div>

        <div className="glass-panel p-4 sm:p-6 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1 sm:mb-2">Holdings</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">{portfolioSummary?.holdingCount || 0}</h3>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" /> Active
          </p>
        </div>

        <div className="glass-panel p-4 sm:p-6 rounded-2xl relative overflow-hidden">
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1 sm:mb-2">Best Pick</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-success truncate">{portfolioSummary?.bestPerformer || '-'}</h3>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> Leading
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Starred / Pinned */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary fill-current" />
            </div>
            <h2 className="text-2xl font-bold font-display">Pinned & S-Tier</h2>
          </div>
          
          <div className="space-y-4">
            {starredEntries.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground">No starred entries yet. Star an entry to pin it here.</p>
              </div>
            ) : (
              starredEntries.map(entry => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onToggleStar={handleToggleStar}
                  onToggleArchive={handleToggleArchive}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold font-display">Recent Insights</h2>
          </div>
          
          <div className="space-y-4">
            {recentEntries.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground">Start logging your investment journey.</p>
              </div>
            ) : (
              recentEntries.map(entry => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onToggleStar={handleToggleStar}
                  onToggleArchive={handleToggleArchive}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
