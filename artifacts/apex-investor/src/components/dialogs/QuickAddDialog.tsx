import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { ALL_SECTIONS } from '@/lib/constants';
import { RichTextEditor } from '../editor/RichTextEditor';
import { useCreateEntry } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface QuickAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the section is locked — no picker shown */
  defaultSectionSlug?: string;
}

export function QuickAddDialog({ isOpen, onClose, defaultSectionSlug }: QuickAddDialogProps) {
  // If a specific section is provided, lock to it. Otherwise default to investing-notes and allow picking.
  const locked = !!defaultSectionSlug;
  const fallbackSlug = 'investing-notes';

  const [sectionSlug, setSectionSlug] = useState(defaultSectionSlug || fallbackSlug);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSectionSlug(defaultSectionSlug || fallbackSlug);
      setTitle('');
      setContent('');
      setTagsInput('');
    }
  }, [isOpen, defaultSectionSlug]);

  const queryClient = useQueryClient();
  const createEntryMutation = useCreateEntry();

  if (!isOpen) return null;

  const currentSection = ALL_SECTIONS.find(s => s.slug === sectionSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      await createEntryMutation.mutateAsync({
        data: {
          sectionSlug,
          title: title.trim(),
          content: content || null,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
          starred: false,
        }
      });

      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      onClose();
    } catch (error) {
      console.error('Failed to create entry', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative w-full sm:max-w-xl bg-card border border-border rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {locked ? `Add to ${currentSection?.name || sectionSlug}` : 'Quick Capture'}
            </h2>
            {locked && currentSection?.category && (
              <p className="text-xs text-muted-foreground mt-0.5">{currentSection.category}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">

          {/* Section picker — only shown when NOT locked (FAB from anywhere) */}
          {!locked && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Section</label>
              <select
                value={sectionSlug}
                onChange={(e) => setSectionSlug(e.target.value)}
                className={inputClass + " appearance-none"}
              >
                {ALL_SECTIONS
                  .filter(s => s.slug !== 'watchlist' && s.slug !== 'paper-portfolio')
                  .map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title *</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the insight, observation, or note?"
              className={inputClass}
            />
          </div>

          {/* Rich text notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              className="min-h-[160px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="comma, separated, tags"
              className={inputClass}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-primary/20"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
