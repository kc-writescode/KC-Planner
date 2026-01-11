'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/store/planner';
import { format, subDays } from 'date-fns';
import { Plus, Flame, Check, Trash2 } from 'lucide-react';
import styles from './HabitsView.module.css';

const habitColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#10b981',
    '#06b6d4', '#3b82f6'
];

const habitIcons = ['🏃', '📚', '💧', '🧘', '💪', '🥗', '😴', '✍️', '🎯', '🧹'];

export default function HabitsView() {
    const { habits, addHabit, deleteHabit, toggleHabitForDate } = usePlannerStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('🎯');
    const [selectedColor, setSelectedColor] = useState(habitColors[0]);

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

    const handleAddHabit = () => {
        if (newHabitTitle.trim()) {
            addHabit({
                title: newHabitTitle.trim(),
                icon: selectedIcon,
                frequency: 'daily',
                targetCount: 1,
                color: selectedColor,
            });
            setNewHabitTitle('');
            setShowAddModal(false);
        }
    };

    return (
        <div className={styles.habitsView}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Habits</h2>
                    <p className={styles.subtitle}>Build consistency with daily habits</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Add Habit
                </button>
            </header>

            {habits.length === 0 ? (
                <div className={styles.emptyState}>
                    <Flame size={48} className={styles.emptyIcon} />
                    <h3>No habits yet</h3>
                    <p>Start building your daily habits to track your progress</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        Create your first habit
                    </button>
                </div>
            ) : (
                <div className={styles.habitsGrid}>
                    {/* Days header */}
                    <div className={styles.daysHeader}>
                        <div className={styles.habitInfo}></div>
                        {last7Days.map(day => (
                            <div key={day.toISOString()} className={styles.dayColumn}>
                                <span className={styles.dayName}>{format(day, 'EEE')}</span>
                                <span className={styles.dayNumber}>{format(day, 'd')}</span>
                            </div>
                        ))}
                        <div className={styles.streakColumn}>Streak</div>
                    </div>

                    {/* Habit rows */}
                    {habits.map(habit => (
                        <div key={habit.id} className={styles.habitRow}>
                            <div className={styles.habitInfo}>
                                <span className={styles.habitIcon} style={{ background: habit.color }}>
                                    {habit.icon}
                                </span>
                                <div className={styles.habitDetails}>
                                    <span className={styles.habitTitle}>{habit.title}</span>
                                    <span className={styles.habitFreq}>{habit.frequency}</span>
                                </div>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => deleteHabit(habit.id)}
                                    aria-label="Delete habit"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {last7Days.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isCompleted = habit.completedDates.includes(dateStr);
                                const isToday = format(today, 'yyyy-MM-dd') === dateStr;

                                return (
                                    <button
                                        key={day.toISOString()}
                                        className={`${styles.habitCheck} ${isCompleted ? styles.completed : ''} ${isToday ? styles.today : ''}`}
                                        onClick={() => toggleHabitForDate(habit.id, dateStr)}
                                        style={{ '--habit-color': habit.color } as React.CSSProperties}
                                    >
                                        {isCompleted && <Check size={16} />}
                                    </button>
                                );
                            })}

                            <div className={styles.streakColumn}>
                                <span className={styles.streakBadge} style={{ background: habit.color }}>
                                    <Flame size={12} />
                                    {habit.streak}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Habit Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Add New Habit</h3>

                        <div className={styles.formGroup}>
                            <label>Habit Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Exercise, Read, Meditate..."
                                value={newHabitTitle}
                                onChange={(e) => setNewHabitTitle(e.target.value)}
                                className={styles.input}
                                autoFocus
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Icon</label>
                            <div className={styles.iconGrid}>
                                {habitIcons.map(icon => (
                                    <button
                                        key={icon}
                                        className={`${styles.iconOption} ${selectedIcon === icon ? styles.selected : ''}`}
                                        onClick={() => setSelectedIcon(icon)}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Color</label>
                            <div className={styles.colorGrid}>
                                {habitColors.map(color => (
                                    <button
                                        key={color}
                                        className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ''}`}
                                        style={{ background: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-primary" onClick={handleAddHabit}>
                                Add Habit
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
