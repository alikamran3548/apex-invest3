import { useState, useMemo } from 'react';
import { Youtube, BookMarked, Link, FileText, Plus, ExternalLink, Edit2, Trash2, X, Save, Search, GraduationCap, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const RESOURCE_TYPES = [
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { value: 'course', label: 'Course', icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { value: 'documentation', label: 'Documentation', icon: FileText, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { value: 'article', label: 'Article', icon: BookMarked, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { value: 'podcast', label: 'Podcast', icon: Mic, color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
  { value: 'other', label: 'Other', icon: Link, color: 'text-muted-foreground', bg: 'bg-muted' },
];

interface Resource {
  id: number;
  title: string;
  url: string;
  type: string;
  description?: string;
  category?: string;
  tags?: string[];
  created_at: string;
}

const EMPTY_FORM = { title: '', url: '', type: 'youtube', description: '', category: '', tags: '' };

function ResourceDialog({ resource, onClose }: { resource?: Resource | null; onClose: () => void }) {
  const [form, setForm] = useState(resource
    ? { title: resource.title, url: resource.url, type: resource.type, description: resource.description || '', category: resource.category || '', tags: (resource.tags || []).join(', ') }
    : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (resource) {
        await fetch(`${BASE}/api/resources/${resource.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${BASE}/api/resources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      qc.invalidateQueries({ queryKey: ['resources'] });
      onClose();
    } finally { setSubmitting(false); }
  };

  const inp = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary";
  const lbl = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{resource ? 'Edit Resource' : 'Add Resource'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div><label className={lbl}>Title *</label><input required value={form.title} onChange={set('title')} placeholder="e.g. Warren Buffett on MOAT Analysis" className={inp} /></div>
          <div><label className={lbl}>URL *</label><input required value={form.url} onChange={set('url')} placeholder="https://youtube.com/..." className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Type</label>
              <select value={form.type} onChange={set('type')} className={inp}>
                {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Category</label><input value={form.category} onChange={set('category')} placeholder="e.g. Value Investing" className={inp} /></div>
          </div>
          <div><label className={lbl}>Description</label><textarea rows={3} value={form.description} onChange={set('description')} placeholder="What's this about? Key takeaways..." className={inp + " resize-none"} /></div>
          <div><label className={lbl}>Tags (comma separated)</label><input value={form.tags} onChange={set('tags')} placeholder="warren buffett, moat, berkshire" className={inp} /></div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSubmit as any} disabled={submitting || !form.title || !form.url} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />{submitting ? 'Saving...' : resource ? 'Save Changes' : 'Add Resource'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ resource, onEdit, onDelete }: { resource: Resource; onEdit: () => void; onDelete: () => void }) {
  const type = RESOURCE_TYPES.find(t => t.value === resource.type) || RESOURCE_TYPES[RESOURCE_TYPES.length - 1];
  const TypeIcon = type.icon;

  // Extract YouTube thumbnail if youtube type
  const ytMatch = resource.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  const ytThumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden group hover:border-border transition-all flex flex-col">
      {ytThumb && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="block relative">
          <img src={ytThumb} alt={resource.title} className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-xl">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
            </div>
          </div>
        </a>
      )}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className={cn("flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border", type.bg)}>
              <TypeIcon className={cn("w-4 h-4", type.color)} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{resource.title}</h3>
              {resource.category && <p className="text-xs text-muted-foreground mt-0.5">{resource.category}</p>}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1.5 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {resource.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{resource.description}</p>}

        {(resource.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(resource.tags || []).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        )}

        <a href={resource.url} target="_blank" rel="noopener noreferrer"
          className="mt-auto flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
          <ExternalLink className="w-3.5 h-3.5" /> Open {type.label}
        </a>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => fetch(`${BASE}/api/resources`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/resources/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });

  const filtered = useMemo(() => resources.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !(r.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [resources, filterType, search]);

  const typeCounts = useMemo(() =>
    Object.fromEntries(RESOURCE_TYPES.map(t => [t.value, resources.filter(r => r.type === t.value).length])),
    [resources]);

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Learning & Planning</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Courses & Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">YouTube channels, courses, documentation and articles</p>
        </div>
        <button onClick={() => { setEditResource(null); setDialogOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </header>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterType('all')} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all",
          filterType === 'all' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border")}>
          All ({resources.length})
        </button>
        {RESOURCE_TYPES.map(t => {
          const Icon = t.icon;
          const count = typeCounts[t.value] || 0;
          if (count === 0 && filterType !== t.value) return null;
          return (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                filterType === t.value ? `${t.bg} ${t.color} border-current` : "bg-card text-muted-foreground hover:text-foreground border-border")}>
              <Icon className="w-4 h-4" />{t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary w-full" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 border border-dashed border-border rounded-3xl bg-card/30">
          <Youtube className="w-16 h-16 text-muted-foreground/20" />
          <p className="text-muted-foreground">{resources.length === 0 ? "No resources yet. Add your first one!" : "No resources match your filters."}</p>
          {resources.length === 0 && (
            <button onClick={() => setDialogOpen(true)} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              <Plus className="w-4 h-4 inline mr-2" />Add Your First Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <ResourceCard key={r.id} resource={r}
              onEdit={() => { setEditResource(r); setDialogOpen(true); }}
              onDelete={() => { if (confirm('Delete this resource?')) deleteMutation.mutate(r.id); }}
            />
          ))}
        </div>
      )}

      {dialogOpen && <ResourceDialog resource={editResource} onClose={() => { setDialogOpen(false); setEditResource(null); }} />}
    </div>
  );
}
