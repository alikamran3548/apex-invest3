import { useGetWatchlist, useDeleteWatchlistItem } from '@workspace/api-client-react';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, ExternalLink } from 'lucide-react';

export default function WatchlistPage() {
  const { data: watchlist, isLoading } = useGetWatchlist();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteWatchlistItem();

  const handleDelete = async (id: number) => {
    if(confirm('Remove from watchlist?')) {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <header>
        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Targets</p>
        <h1 className="text-4xl font-display font-bold text-foreground">S-Tier Watchlist</h1>
      </header>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-black/20 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-bold">Company</th>
                  <th className="px-6 py-4 font-bold">Sector/Country</th>
                  <th className="px-6 py-4 font-bold text-right">Target Price</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Thesis/Reason</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {watchlist?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Watchlist is empty.
                    </td>
                  </tr>
                )}
                {watchlist?.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary text-base flex items-center gap-2">
                        {item.ticker} <ExternalLink className="w-3 h-3 opacity-50" />
                      </div>
                      <div className="text-xs text-muted-foreground">{item.companyName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{item.sector || '-'}</div>
                      <div className="text-xs text-muted-foreground">{item.country || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-accent">
                      {formatCurrency(item.targetPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-secondary text-secondary-foreground border border-border">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[250px] truncate text-muted-foreground">
                      {item.reason || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-destructive/20 rounded-full text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
