import { useGlobalSearch } from '@workspace/api-client-react';
import { useLocation, useSearch } from 'wouter';
import { Search as SearchIcon, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function SearchPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const q = params.get('q') || '';
  const [location, setLocation] = useLocation();

  const { data: results, isLoading } = useGlobalSearch({ q }, {
    query: { enabled: q.length > 0 }
  });

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      <header className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <SearchIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">Search Results</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {q ? `Showing results for "${q}"` : 'Enter a query in the top bar to search across all sections.'}
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {results?.length === 0 && q && (
            <div className="text-center p-12 glass-panel rounded-2xl">
              <p className="text-lg text-muted-foreground">No matches found.</p>
            </div>
          )}
          {results?.map(result => (
            <button 
              key={`${result.type}-${result.id}`}
              onClick={() => {
                if (result.type === 'portfolio') setLocation('/portfolio');
                else if (result.type === 'watchlist') setLocation('/watchlist');
                else setLocation(`/sections/${result.sectionSlug}`);
              }}
              className="w-full text-left glass-panel p-6 rounded-2xl hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all group flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                    {result.sectionName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(result.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {result.title}
                </h3>
                {result.excerpt && (
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-sm max-w-3xl">
                    {result.excerpt.replace(/<[^>]*>?/gm, '')}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
