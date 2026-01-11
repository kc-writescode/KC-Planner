'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Task } from '@/types';
import {
    X,
    Calendar,
    Clock,
    Flag,
    Tag,
    FolderOpen,
    AlertCircle,
    Trash2,
    Check,
    ChevronDown
} from 'lucide-react';
import styles from './TaskModal.module.css';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStatus?: Task['status'];
    editTask?: Task | null;
}

const priorities: { value: Task['priority']; label: string; color: string }[] = [
    { value: 'urgent', label: 'Urgent', color: 'var(--color-priority-urgent)' },
    { value: 'high', label: 'High', color: 'var(--color-priority-high)' },
    { value: 'medium', label: 'Medium', color: 'var(--color-priority-medium)' },
    { value: 'low', label: 'Low', color: 'var(--color-priority-low)' },
];

const categories: { value: Task['category']; label: string; color: string }[] = [
    { value: 'work', label: 'Work', color: 'var(--color-category-work)' },
    { value: 'personal', label: 'Personal', color: 'var(--color-category-personal)' },
    { value: 'health', label: 'Health', color: 'var(--color-category-health)' },
    { value: 'learning', label: 'Learning', color: 'var(--color-category-learning)' },
    { value: 'social', label: 'Social', color: 'var(--color-category-social)' },
];

const statuses: { value: Task['status']; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
];

export default function TaskModal({ isOpen, onClose, initialStatus = 'todo', editTask }: TaskModalProps) {
    const { addTask, updateTask, deleteTask, projects, activeProjectId } = usePlannerStore();
    const titleInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [category, setCategory] = useState<Task['category']>('personal');
    const [status, setStatus] = useState<Task['status']>(initialStatus);
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [estimatedMinutes, setEstimatedMinutes] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or editTask changes
    useEffect(() => {
        if (isOpen) {
            if (editTask) {
                setTitle(editTask.title);
                setDescription(editTask.description || '');
                setPriority(editTask.priority);
                setCategory(editTask.category);
                setStatus(editTask.status);
                setDueDate(editTask.dueDate || '');
                setDueTime(editTask.dueTime || '');
                setEstimatedMinutes(editTask.estimatedMinutes?.toString() || '');
                setProjectId(editTask.project_id || null);
            } else {
                setTitle('');
                setDescription('');
                setPriority('medium');
                setCategory('personal');
                setStatus(initialStatus);
                setDueDate('');
                setDueTime('');
                setEstimatedMinutes('');
                setProjectId(activeProjectId);
            }
            setShowDeleteConfirm(false);

            // Focus title input after a brief delay
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, editTask, initialStatus, activeProjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const taskData = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                category,
                status,
                dueDate: dueDate || undefined,
                dueTime: dueTime || undefined,
                estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
                project_id: projectId || undefined,
                completed: status === 'done',
            };

            if (editTask) {
                await updateTask(editTask.id, taskData);
            } else {
                await addTask(taskData);
            }
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editTask) return;

        setIsSubmitting(true);
        try {
            await deleteTask(editTask.id);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
            onClick={(e) => e.target === e.currentTarget && onClose()}
            onKeyDown={handleKeyDown}
        >
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {editTask ? 'Edit Task' : 'Create Task'}
                    </h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.body}>
                        {/* Title Input */}
                        <div className={styles.fieldGroup}>
                            <input
                                ref={titleInputRef}
                                type="text"
                                className={styles.titleInput}
                                placeholder="Task title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className={styles.fieldGroup}>
                            <textarea
                                className={styles.descriptionInput}
                                placeholder="Add a description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Status & Priority Row */}
                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    <Tag size={14} />
                                    Status
                                </label>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.select}
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as Task['status'])}
                                    >
                                        {statuses.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className={styles.selectIcon} size={14} />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    <Flag size={14} />
                                    Priority
                                </label>
                                <div className={styles.priorityGroup}>
                                    {priorities.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            className={`${styles.priorityButton} ${priority === p.value ? styles.active : ''}`}
                                            style={{ '--priority-color': p.color } as React.CSSProperties}
                                            onClick={() => setPriority(p.value)}
                                            title={p.label}
                                        >
                                            <Flag size={14} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>
                                <Tag size={14} />
                                Category
                            </label>
                            <div className={styles.categoryGroup}>
                                {categories.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        className={`${styles.categoryButton} ${category === c.value ? styles.active : ''}`}
                                        style={{ '--category-color': c.color } as React.CSSProperties}
                                        onClick={() => setCategory(c.value)}
                                    >
                                        <span className={styles.categoryDot} />
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date & Time Row */}
                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    <Calendar size={14} />
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    <Clock size={14} />
                                    Due Time
                                </label>
                                <input
                                    type="time"
                                    className={styles.input}
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Estimated Time & Project Row */}
                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    <Clock size={14} />
                                    Estimated Time
                                </label>
                                <div className={styles.inputWithSuffix}>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        placeholder="30"
                                        value={estimatedMinutes}
                                        onChange={(e) => setEstimatedMinutes(e.target.value)}
                                        min="1"
                                    />
                                    <span className={styles.suffix}>min</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    <FolderOpen size={14} />
                                    Project
                                </label>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.select}
                                        value={projectId || ''}
                                        onChange={(e) => setProjectId(e.target.value || null)}
                                    >
                                        <option value="">No project</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className={styles.selectIcon} size={14} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        {editTask && !showDeleteConfirm && (
                            <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}

                        {showDeleteConfirm && (
                            <div className={styles.deleteConfirm}>
                                <AlertCircle size={16} />
                                <span>Delete this task?</span>
                                <button
                                    type="button"
                                    className={styles.confirmDeleteButton}
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                >
                                    Yes, delete
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelDeleteButton}
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div className={styles.footerActions}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!title.trim() || isSubmitting}
                            >
                                <Check size={16} />
                                {editTask ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
