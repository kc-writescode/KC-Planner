'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Plus, X, Calendar, Flag, Tag, FolderOpen, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import styles from './QuickAdd.module.css';

interface QuickAddProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const priorityConfig = [
    { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
    { value: 'medium', label: 'Medium', color: 'var(--color-priority-medium)' },
    { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
    { value: 'urgent', label: 'Urgent', color: 'var(--color-priority-urgent)' },
] as const;

const categoryConfig = [
    { value: 'work', label: 'Work', color: 'var(--color-category-work)' },
    { value: 'personal', label: 'Personal', color: 'var(--color-category-personal)' },
    { value: 'health', label: 'Health', color: 'var(--color-category-health)' },
    { value: 'learning', label: 'Learning', color: 'var(--color-category-learning)' },
    { value: 'social', label: 'Social', color: 'var(--color-category-social)' },
] as const;

export default function QuickAdd({ isOpen: externalIsOpen, onClose }: QuickAddProps) {
    const { addTask, selectedDate, projects, activeProjectId } = usePlannerStore();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
    const [category, setCategory] = useState<'work' | 'personal' | 'health' | 'learning' | 'social'>('personal');
    const [dueDate, setDueDate] = useState(selectedDate);
    const [projectId, setProjectId] = useState<string | null>(activeProjectId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use external control if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    const handleOpen = () => {
        if (externalIsOpen === undefined) {
            setInternalIsOpen(true);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('medium');
        setCategory('personal');
        setDueDate(selectedDate);
        setProjectId(activeProjectId);
    };

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setDueDate(selectedDate);
            setProjectId(activeProjectId);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, selectedDate, activeProjectId]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addTask({
                title: title.trim(),
                description: description.trim() || undefined,
                completed: false,
                priority,
                category,
                dueDate,
                status: 'todo',
                project_id: projectId || undefined,
            });
            handleClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* FAB Button - only show if not externally controlled */}
            {externalIsOpen === undefined && (
                <button
                    className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
                    onClick={() => isOpen ? handleClose() : handleOpen()}
                    aria-label={isOpen ? 'Close quick add' : 'Quick add task'}
                >
                    {isOpen ? <X size={24} /> : <Plus size={24} />}
                </button>
            )}

            {/* Quick Add Modal */}
            {isOpen && (
                <div className={styles.overlay} onClick={handleClose}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h2 className={styles.modalTitle}>Quick Add Task</h2>
                            <button
                                className={styles.closeButton}
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="What needs to be done?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={styles.titleInput}
                                required
                            />

                            <textarea
                                placeholder="Add a description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className={styles.descriptionInput}
                                rows={2}
                            />

                            <div className={styles.options}>
                                {/* Priority */}
                                <div className={styles.optionGroup}>
                                    <label className={styles.optionLabel}>
                                        <Flag size={14} />
                                        Priority
                                    </label>
                                    <div className={styles.pills}>
                                        {priorityConfig.map(p => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                className={`${styles.pill} ${priority === p.value ? styles.selected : ''}`}
                                                style={{ '--pill-color': p.color } as React.CSSProperties}
                                                onClick={() => setPriority(p.value)}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className={styles.optionGroup}>
                                    <label className={styles.optionLabel}>
                                        <Tag size={14} />
                                        Category
                                    </label>
                                    <div className={styles.pills}>
                                        {categoryConfig.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                className={`${styles.pill} ${category === c.value ? styles.selected : ''}`}
                                                style={{ '--pill-color': c.color } as React.CSSProperties}
                                                onClick={() => setCategory(c.value)}
                                            >
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Project Row */}
                                <div className={styles.optionRow}>
                                    <div className={styles.optionGroup}>
                                        <label className={styles.optionLabel}>
                                            <Calendar size={14} />
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className={styles.dateInput}
                                        />
                                    </div>

                                    {projects.length > 0 && (
                                        <div className={styles.optionGroup}>
                                            <label className={styles.optionLabel}>
                                                <FolderOpen size={14} />
                                                Project
                                            </label>
                                            <div className={styles.selectWrapper}>
                                                <select
                                                    value={projectId || ''}
                                                    onChange={(e) => setProjectId(e.target.value || null)}
                                                    className={styles.select}
                                                >
                                                    <option value="">No project</option>
                                                    {projects.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className={styles.selectIcon} size={14} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.footer}>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!title.trim() || isSubmitting}
                                >
                                    <Plus size={18} />
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
