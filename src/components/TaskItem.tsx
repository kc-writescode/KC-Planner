'use client';

import { usePlannerStore } from '@/store/planner';
import { Task } from '@/types';
import {
    Circle,
    CheckCircle2,
    Clock,
    Flag,
    Trash2,
    GripVertical,
    Edit2,
    Check,
    X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import styles from './TaskItem.module.css';

interface TaskItemProps {
    task: Task;
    showDragHandle?: boolean;
    compact?: boolean;
}

const priorityColors = {
    urgent: 'var(--color-priority-urgent)',
    high: 'var(--color-priority-high)',
    medium: 'var(--color-priority-medium)',
    low: 'var(--color-priority-low)',
};

const categoryColors = {
    work: 'var(--color-category-work)',
    personal: 'var(--color-category-personal)',
    health: 'var(--color-category-health)',
    learning: 'var(--color-category-learning)',
    social: 'var(--color-category-social)',
};

export default function TaskItem({ task, showDragHandle, compact }: TaskItemProps) {
    const { toggleTask, deleteTask, updateTask } = usePlannerStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDesc, setEditDesc] = useState(task.description || '');
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (editTitle.trim() && (editTitle !== task.title || editDesc !== (task.description || ''))) {
            await updateTask(task.id, {
                title: editTitle.trim(),
                description: editDesc.trim() || undefined
            });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(task.title);
        setEditDesc(task.description || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div
            className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${compact ? styles.compact : ''}`}
            style={{ '--category-color': categoryColors[task.category] } as React.CSSProperties}
        >
            {showDragHandle && !isEditing && (
                <div className={styles.dragHandle}>
                    <GripVertical size={16} />
                </div>
            )}

            {!isEditing && (
                <button
                    className={styles.checkbox}
                    onClick={() => toggleTask(task.id)}
                    aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                    {task.completed ? (
                        <CheckCircle2 size={20} className={styles.checked} />
                    ) : (
                        <Circle size={20} />
                    )}
                </button>
            )}

            <div className={styles.content}>
                {isEditing ? (
                    <div className={styles.editForm}>
                        <input
                            ref={titleInputRef}
                            type="text"
                            className={styles.editInput}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        {!compact && (
                            <textarea
                                className={styles.editTextArea}
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Add description..."
                                rows={2}
                            />
                        )}
                        <div className={styles.actions}>
                            <button onClick={handleSave} className={styles.editButton} title="Save">
                                <Check size={16} />
                            </button>
                            <button onClick={handleCancel} className={styles.editButton} title="Cancel">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className={styles.title}>{task.title}</p>
                        {!compact && task.description && (
                            <p className={styles.description}>{task.description}</p>
                        )}

                        <div className={styles.meta}>
                            {task.dueTime && (
                                <span className={styles.metaItem}>
                                    <Clock size={12} />
                                    {task.dueTime}
                                </span>
                            )}
                            {task.estimatedMinutes && (
                                <span className={styles.metaItem}>
                                    {task.estimatedMinutes}m
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className={styles.actions}>
                {!isEditing && (
                    <>
                        <button
                            className={styles.editButton}
                            onClick={() => setIsEditing(true)}
                            aria-label="Edit task"
                        >
                            <Edit2 size={14} />
                        </button>
                        <span
                            className={styles.priority}
                            style={{ color: priorityColors[task.priority] }}
                            title={task.priority}
                        >
                            <Flag size={14} />
                        </span>

                        <button
                            className={styles.deleteButton}
                            onClick={() => deleteTask(task.id)}
                            aria-label="Delete task"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
