import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'wouter';
import { useGetEntries, useToggleStar, useToggleArchive, useDeleteEntry } from '@workspace/api-client-react';
import { ALL_SECTIONS } from '@/lib/constants';
import { EntryCard } from '@/components/cards/EntryCard';
import { QuickAddDialog } from '@/components/dialogs/QuickAddDialog';
import { useQueryClient } from '@tanstack/react-query';
import { FileQuestion, Filter, Plus, Star, Tag, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  starredOnly: boolean;
  tags: string[];
  tagInput: string;
}

const EMPTY_FILTER: FilterState = { starredOnly: false, tags: [], tagInput: '' };

export default function SectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const sectionInfo = ALL_SECTIONS.find(s => s.slug === slug);
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER);
  const filterRef = useRef<HTMLDivElement>(null);

  const { data: entries, isLoading, error } = useGetEntries({ sectionSlug: slug || '' }, {
    query: { enabled: !!slug }
  });

  const toggleStarMutation = useToggleStar();
  const toggleArchiveMutation = useToggleArchive();
  const deleteEntryMutation = useDeleteEntry();

  // Close filter panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  // Reset filters when navigating to a different section
  useEffect(() => {
    setFilters(EMPTY_FILTER);
    setFilterOpen(false);
  }, [slug]);

  // Derive all unique tags from entries for suggestions
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries?.forEach(e => (e.tags as string[] || []).forEach((t: string) => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  // Apply filters client-side
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    let result = entries;
    if (filters.starredOnly) result = result.filter(e => e.starred);
    if (filters.tags.length > 0) {
      result = result.filter(e => {
        const entryTags: string[] = (e.tags as string[]) || [];
        return filters.tags.every(ft => entryTags.some(t => t.toLowerCase().includes(ft.toLowerCase())));
      });
    }
    return result;
  }, [entries, filters]);

  const activeFilterCount = (filters.starredOnly ? 1 : 0) + filters.tags.length;

  if (!sectionInfo) {
    return <div className="p-8 text-center text-muted-foreground">Section not found.</div>;
  }

  const handleToggleStar = async (id: number) => {
    await toggleStarMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
  };

  const handleToggleArchive = async (id: number) => {
    await toggleArchiveMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await deleteEntryMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !filters.tags.includes(trimmed)) {
      setFilters(f => ({ ...f, tags: [...f.tags, trimmed], tagInput: '' }));
    } else {
      setFilters(f => ({ ...f, tagInput: '' }));
    }
  };

  const removeTag = (tag: string) => setFilters(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  const clearFilters = () => setFilters(EMPTY_FILTER);

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-1 sm:mb-2">{sectionInfo.category}</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground truncate">{sectionInfo.name}</h1>
          {sectionInfo.description && (
            <p className="mt-1 sm:mt-2 text-sm text-muted-foreground line-clamp-2">{sectionInfo.description}</p>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          {/* Filter button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-colors text-sm font-medium",
                activeFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:bg-muted text-foreground"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform hidden sm:block", filterOpen && "rotate-180")} />
            </button>

            {/* Filter dropdown panel */}
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl z-30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Filters</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all
                    </button>
                  )}
                </div>

                {/* Starred toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setFilters(f => ({ ...f, starredOnly: !f.starredOnly }))}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors flex-shrink-0",
                      filters.starredOnly ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform",
                      filters.starredOnly ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className={cn("w-4 h-4", filters.starredOnly ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                    <span className={filters.starredOnly ? "text-foreground font-medium" : "text-muted-foreground"}>Starred only</span>
                  </div>
                </label>

                {/* Tag filter */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Filter by tag
                  </p>
                  <div className="relative">
                    <input
                      value={filters.tagInput}
                      onChange={e => setFilters(f => ({ ...f, tagInput: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addTag(filters.tagInput); }
                        if (e.key === ',' ) { e.preventDefault(); addTag(filters.tagInput); }
                      }}
                      placeholder="Type a tag + Enter"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Tag suggestions */}
                  {allTags.length > 0 && filters.tagInput === '' && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {allTags.filter(t => !filters.tags.includes(t)).slice(0, 12).map(t => (
                        <button
                          key={t}
                          onClick={() => addTag(t)}
                          className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active tag chips */}
                  {filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {filters.tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                          {t}
                          <button onClick={() => removeTag(t)} className="hover:text-destructive transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </header>

      {/* Active filter summary bar */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-muted-foreground">Showing</span>
          <span className="font-bold text-foreground">{filteredEntries.length}</span>
          <span className="text-muted-foreground">of {entries?.length} entries</span>
          {filters.starredOnly && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-medium border border-amber-400/20">
              <Star className="w-3 h-3 fill-amber-400" /> Starred
            </span>
          )}
          {filters.tags.map(t => (
            <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
              <Tag className="w-3 h-3" /> {t}
              <button onClick={() => removeTag(t)}><X className="w-3 h-3 hover:text-destructive" /></button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2">
            Clear
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-destructive p-8 bg-destructive/10 rounded-2xl">Failed to load entries.</div>
      ) : entries?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 border border-dashed border-border rounded-3xl bg-card/30">
          <FileQuestion className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No entries yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            You haven't added anything to {sectionInfo.name} yet.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold shadow-md shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> Add Your First Entry
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-border rounded-3xl bg-card/30">
          <Filter className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No entries match your filters</h3>
          <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEntries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onToggleStar={handleToggleStar}
              onToggleArchive={handleToggleArchive}
              onEdit={() => setAddOpen(true)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <QuickAddDialog
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        defaultSectionSlug={slug}
      />
    </div>
  );
}
