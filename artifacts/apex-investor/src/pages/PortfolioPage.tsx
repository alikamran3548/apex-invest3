import { useState } from 'react';
import { useGetPortfolio, useGetPortfolioSummary, useDeletePortfolioItem } from '@workspace/api-client-react';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Plus, Edit, Trash2, ChevronDown, ChevronRight, Shield, Anchor, Scale, AlertTriangle } from 'lucide-react';
import { PortfolioDialog } from '@/components/dialogs/PortfolioDialog';

interface PortfolioItem {
  id: number;
  ticker: string;
  companyName: string;
  entryPrice: number;
  currentPrice?: number | null;
  shares: number;
  entryDate?: string | null;
  exitDate?: string | null;
  exitPrice?: number | null;
  status: string;
  entryReason?: string | null;
  holdingReason?: string | null;
  sellReason?: string | null;
  sector?: string | null;
  country?: string | null;
  notes?: string | null;
  unrealisedPnl?: number | null;
  unrealisedPnlPercent?: number | null;
}

function parseNotes(notes: string | null | undefined) {
  try {
    const parsed = JSON.parse(notes || '{}');
    if (parsed.__apex) return parsed;
  } catch {}
  return { notes: notes || '', moat: '', marginOfSafety: '', riskAssessment: '' };
}

function ThesisRow({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-3 h-3" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm text-foreground leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function PortfolioRow({ item, onEdit, onDelete }: { item: PortfolioItem; onEdit: (item: PortfolioItem) => void; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = (item.unrealisedPnl || 0) >= 0;
  const thesis = parseNotes(item.notes);
  const hasThesis = thesis.moat || thesis.marginOfSafety || thesis.riskAssessment || item.holdingReason || item.sellReason;

  return (
    <>
      <tr className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            {hasThesis
              ? (expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />)
              : <span className="w-4" />
            }
            <div>
              <div className="font-bold text-foreground">{item.ticker}</div>
              <div className="text-xs text-muted-foreground">{item.companyName}</div>
            </div>
          </div>
        </td>
        <td className="px-4 sm:px-6 py-4 text-right font-mono text-sm hidden sm:table-cell">{item.shares}</td>
        <td className="px-4 sm:px-6 py-4 text-right font-mono text-sm">{formatCurrency(item.entryPrice)}</td>
        <td className="px-4 sm:px-6 py-4 text-right font-mono text-sm hidden md:table-cell">{item.currentPrice ? formatCurrency(item.currentPrice) : '—'}</td>
        <td className="px-4 sm:px-6 py-4 text-right">
          {item.status === 'holding' && item.unrealisedPnl != null ? (
            <div className={cn("font-bold text-sm", isPositive ? "text-success" : "text-destructive")}>
              {isPositive ? '+' : ''}{formatCurrency(item.unrealisedPnl)}
              <div className="text-xs opacity-80">{formatPercent(item.unrealisedPnlPercent)}</div>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </td>
        <td className="px-4 sm:px-6 py-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded thesis row */}
      {expanded && hasThesis && (
        <tr>
          <td colSpan={6} className="px-4 sm:px-6 pb-5 pt-0">
            <div className="ml-6 bg-background/50 border border-border/50 rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ThesisRow icon={TrendingUp} color="bg-success/20 text-success" label="Why Holding" value={item.holdingReason || ''} />
              <ThesisRow icon={AlertTriangle} color="bg-destructive/20 text-destructive" label="When to Sell" value={item.sellReason || ''} />
              <ThesisRow icon={Shield} color="bg-amber-400/20 text-amber-400" label="Risk Assessment" value={thesis.riskAssessment || ''} />
              <ThesisRow icon={Anchor} color="bg-blue-400/20 text-blue-400" label="MOAT" value={thesis.moat || ''} />
              <ThesisRow icon={Scale} color="bg-violet-400/20 text-violet-400" label="Margin of Safety" value={thesis.marginOfSafety || ''} />
              {thesis.notes && (
                <ThesisRow icon={TrendingUp} color="bg-muted text-muted-foreground" label="Notes" value={thesis.notes} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PortfolioPage() {
  const [filter, setFilter] = useState<'holding' | 'sold' | 'watching'>('holding');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const { data: portfolio, isLoading } = useGetPortfolio({ status: filter });
  const { data: summary } = useGetPortfolioSummary();
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePortfolioItem();

  const handleDelete = async (id: number) => {
    if (confirm('Delete this portfolio position?')) {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-1">Personal System</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Paper Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your paper trades with full investment thesis</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold text-sm shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 sm:p-5 rounded-2xl">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Total Value</p>
          <h3 className="text-lg sm:text-2xl font-bold">{formatCurrency(summary?.totalValue)}</h3>
        </div>
        <div className="glass-panel p-4 sm:p-5 rounded-2xl">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Total Cost</p>
          <h3 className="text-lg sm:text-2xl font-bold">{formatCurrency(summary?.totalCost)}</h3>
        </div>
        <div className="glass-panel p-4 sm:p-5 rounded-2xl">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Unrealised P&L</p>
          <h3 className={cn("text-lg sm:text-2xl font-bold flex items-center gap-1.5",
            (summary?.totalUnrealisedPnl || 0) >= 0 ? "text-success" : "text-destructive"
          )}>
            {(summary?.totalUnrealisedPnl || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatCurrency(summary?.totalUnrealisedPnl)}
          </h3>
        </div>
        <div className="glass-panel p-4 sm:p-5 rounded-2xl">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Return %</p>
          <h3 className={cn("text-lg sm:text-2xl font-bold",
            (summary?.totalUnrealisedPnlPercent || 0) >= 0 ? "text-success" : "text-destructive"
          )}>
            {formatPercent(summary?.totalUnrealisedPnlPercent)}
          </h3>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-card rounded-xl w-max">
        {(['holding', 'watching', 'sold'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all",
              filter === f ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : portfolio?.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">No positions in <strong>{filter}</strong> yet.</p>
            <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Your First Position
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                <tr>
                  <th className="px-4 sm:px-6 py-4 font-bold">Asset</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-right hidden sm:table-cell">Shares</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-right">Avg Cost</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-right hidden md:table-cell">Current</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-right">P&L</th>
                  <th className="px-4 sm:px-6 py-4 font-bold text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {portfolio?.map((item) => (
                  <PortfolioRow
                    key={item.id}
                    item={item as PortfolioItem}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PortfolioDialog
        isOpen={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditItem(null); }}
        editItem={editItem}
      />
    </div>
  );
}
