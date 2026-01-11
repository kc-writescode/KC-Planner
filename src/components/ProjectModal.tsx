'use client';

import { useState, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner';
import { X, Calendar as CalendarIcon, Plane, Briefcase, Home, Info } from 'lucide-react';
import { Project } from '@/types';
import styles from './ProjectModal.module.css';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project?: Project | null;
}

const PROJECT_TYPES = [
    { id: 'personal', label: 'Personal', icon: Home },
    { id: 'trip', label: 'Trip/Travel', icon: Plane },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'other', label: 'Other', icon: Info },
] as const;

const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4'
];

export default function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
    const { addProject, updateProject } = usePlannerStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<typeof PROJECT_TYPES[number]['id']>('personal');
    const [color, setColor] = useState(COLORS[0]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(project?.title || '');
            setDescription(project?.description || '');
            setType(project?.type || 'personal');
            setColor(project?.color || COLORS[0]);
            setStartDate(project?.startDate || '');
            setEndDate(project?.endDate || '');
        }
    }, [isOpen, project]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (project?.id) {
            await updateProject(project.id, {
                title,
                description,
                type,
                color,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
        } else {
            await addProject({
                title,
                description,
                type,
                color,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
        }
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{project?.id ? 'Edit Project' : 'New Project / Trip'}</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Japan Trip 2026"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your project or trip..."
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Type</label>
                        <div className={styles.typeGrid}>
                            {PROJECT_TYPES.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={`${styles.typeBtn} ${type === t.id ? styles.activeType : ''}`}
                                    onClick={() => setType(t.id)}
                                >
                                    <t.icon size={16} />
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === 'trip' && (
                        <div className={styles.dateBlock}>
                            <div className={styles.field}>
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.field}>
                        <label>Color</label>
                        <div className={styles.colorGrid}>
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`${styles.colorChip} ${color === c ? styles.activeColor : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            {project?.id ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
