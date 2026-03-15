import { useState, useRef } from 'react';
import { Map, Plus, Upload, FileText, Trash2, Eye, X, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const MAX_PDF_MB = 10;

interface RoadmapItem {
  id: number;
  title: string;
  description?: string;
  pdf_name?: string;
  pdf_size?: number;
  created_at: string;
}

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PDFViewer({ id, name, onClose }: { id: number; name?: string; onClose: () => void }) {
  const url = `${BASE}/api/roadmap/${id}/pdf`;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground text-sm truncate max-w-xs">{name || 'Document'}</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground flex items-center gap-2">
          <X className="w-5 h-5" /> <span className="text-sm">Close</span>
        </button>
      </div>
      <iframe
        src={url}
        title={name}
        className="flex-1 w-full border-none"
      />
    </div>
  );
}

function AddRoadmapDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_PDF_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_PDF_MB}MB.`);
      return;
    }
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);
    try {
      let pdf_data = null;
      let pdf_name = null;
      let pdf_size = null;

      if (file) {
        pdf_name = file.name;
        pdf_size = file.size;
        // Read as base64
        pdf_data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // strip data:...;base64,
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      await fetch(`${BASE}/api/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description || null, pdf_data, pdf_name, pdf_size }),
      });

      qc.invalidateQueries({ queryKey: ['roadmap'] });
      onClose();
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const inp = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">Add Roadmap Item</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Title *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Q1 2026 Strategy, Learning Plan..." className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this document cover?" className={inp + " resize-none"} />
          </div>

          {/* PDF Upload */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Attach PDF (optional, max {MAX_PDF_MB}MB)</label>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden" />
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground">Click to upload PDF</span>
              </button>
            )}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSubmit as any} disabled={uploading || !title.trim()} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />{uploading ? 'Uploading...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoadmapCard({ item, onView, onDelete }: { item: RoadmapItem; onView: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/5 transition-colors group"
        onClick={() => item.description && setExpanded(e => !e)}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Map className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">{item.title}</h3>
            {item.description && (
              expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.pdf_name && (
            <button
              onClick={e => { e.stopPropagation(); onView(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> View PDF
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && item.description && (
        <div className="px-5 pb-5 pt-0">
          <div className="ml-14 p-4 bg-background/50 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        </div>
      )}

      {item.pdf_name && (
        <div className="px-5 pb-4 ml-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate">{item.pdf_name}</span>
            {item.pdf_size && <span>· {formatBytes(item.pdf_size)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<RoadmapItem | null>(null);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<RoadmapItem[]>({
    queryKey: ['roadmap'],
    queryFn: () => fetch(`${BASE}/api/roadmap`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/roadmap/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap'] }),
  });

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Learning & Planning</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and view roadmap PDFs, strategies, and plans</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </header>

      {/* Upload hint banner */}
      {items.length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-20 gap-5 border border-dashed border-border rounded-3xl bg-card/30">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-10 h-10 text-primary/60" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-1">No roadmap items yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Upload PDFs of your investment roadmaps, learning plans, strategy documents and more.</p>
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md shadow-primary/20">
            <Upload className="w-4 h-4" /> Upload Your First PDF
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <RoadmapCard
              key={item.id}
              item={item}
              onView={() => setViewingPdf(item)}
              onDelete={() => { if (confirm('Delete this item?')) deleteMutation.mutate(item.id); }}
            />
          ))}
        </div>
      )}

      {addOpen && <AddRoadmapDialog onClose={() => setAddOpen(false)} />}
      {viewingPdf && <PDFViewer id={viewingPdf.id} name={viewingPdf.pdf_name} onClose={() => setViewingPdf(null)} />}
    </div>
  );
}
