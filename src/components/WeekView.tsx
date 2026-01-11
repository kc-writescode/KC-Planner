'use client';

import { usePlannerStore } from '@/store/planner';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './WeekView.module.css';

export default function WeekView() {
    const { selectedDate, setSelectedDate, tasks, timeBlocks, dailyGoals } = usePlannerStore();

    const currentDate = new Date(selectedDate);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handlePrevWeek = () => {
        setSelectedDate(format(addDays(currentDate, -7), 'yyyy-MM-dd'));
    };

    const handleNextWeek = () => {
        setSelectedDate(format(addDays(currentDate, 7), 'yyyy-MM-dd'));
    };

    const getTasksForDay = (date: string) => tasks.filter(t => t.dueDate === date);
    const getGoalsForDay = (date: string) => dailyGoals.filter(g => g.date === date);
    const getBlocksForDay = (date: string) => timeBlocks.filter(b => b.date === date);

    return (
        <div className={styles.weekView}>
            <header className={styles.header}>
                <button className={styles.navButton} onClick={handlePrevWeek}>
                    <ChevronLeft size={20} />
                </button>
                <div className={styles.headerTitle}>
                    <h2>Week of {format(weekStart, 'MMM d')}</h2>
                    <p>{format(weekStart, 'yyyy')}</p>
                </div>
                <button className={styles.navButton} onClick={handleNextWeek}>
                    <ChevronRight size={20} />
                </button>
            </header>

            <div className={styles.weekGrid}>
                {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate === dateStr;
                    const dayTasks = getTasksForDay(dateStr);
                    const dayGoals = getGoalsForDay(dateStr);
                    const dayBlocks = getBlocksForDay(dateStr);
                    const completedTasks = dayTasks.filter(t => t.completed).length;

                    return (
                        <button
                            key={dateStr}
                            className={`${styles.dayCard} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                            onClick={() => setSelectedDate(dateStr)}
                        >
                            <div className={styles.dayHeader}>
                                <span className={styles.dayName}>{format(day, 'EEE')}</span>
                                <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className={styles.dayStats}>
                                {dayTasks.length > 0 && (
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{completedTasks}/{dayTasks.length}</span>
                                        <span className={styles.statLabel}>tasks</span>
                                    </div>
                                )}
                                {dayGoals.length > 0 && (
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{dayGoals.filter(g => g.completed).length}/{dayGoals.length}</span>
                                        <span className={styles.statLabel}>goals</span>
                                    </div>
                                )}
                                {dayBlocks.length > 0 && (
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{dayBlocks.length}</span>
                                        <span className={styles.statLabel}>blocks</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.dayPreview}>
                                {dayTasks.slice(0, 3).map(task => (
                                    <div
                                        key={task.id}
                                        className={`${styles.taskPreview} ${task.completed ? styles.completed : ''}`}
                                    >
                                        <span className={styles.taskDot} style={{
                                            background: task.completed ? 'var(--color-success)' : 'var(--color-text-tertiary)'
                                        }}></span>
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className={styles.moreItems}>+{dayTasks.length - 3} more</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
