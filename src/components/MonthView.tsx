'use client';

import { usePlannerStore } from '@/store/planner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MonthView.module.css';

export default function MonthView() {
    const { selectedDate, setSelectedDate, tasks, dailyGoals } = usePlannerStore();

    const currentDate = new Date(selectedDate);
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const handlePrevMonth = () => {
        setSelectedDate(format(subMonths(currentDate, 1), 'yyyy-MM-dd'));
    };

    const handleNextMonth = () => {
        setSelectedDate(format(addMonths(currentDate, 1), 'yyyy-MM-dd'));
    };

    const getTasksForDay = (date: string) => tasks.filter(t => t.dueDate === date);
    const getGoalsForDay = (date: string) => dailyGoals.filter(g => g.date === date);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className={styles.monthView}>
            <header className={styles.header}>
                <button className={styles.navButton} onClick={handlePrevMonth}>
                    <ChevronLeft size={20} />
                </button>
                <h2 className={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</h2>
                <button className={styles.navButton} onClick={handleNextMonth}>
                    <ChevronRight size={20} />
                </button>
            </header>

            <div className={styles.calendar}>
                <div className={styles.weekHeader}>
                    {weekDays.map(day => (
                        <div key={day} className={styles.weekDay}>{day}</div>
                    ))}
                </div>

                <div className={styles.daysGrid}>
                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDate === dateStr;
                        const dayTasks = getTasksForDay(dateStr);
                        const dayGoals = getGoalsForDay(dateStr);
                        const hasItems = dayTasks.length > 0 || dayGoals.length > 0;
                        const completedTasks = dayTasks.filter(t => t.completed).length;

                        return (
                            <button
                                key={dateStr}
                                className={`
                  ${styles.dayCell} 
                  ${!isCurrentMonth ? styles.otherMonth : ''} 
                  ${isToday ? styles.today : ''} 
                  ${isSelected ? styles.selected : ''}
                  ${hasItems ? styles.hasItems : ''}
                `}
                                onClick={() => setSelectedDate(dateStr)}
                            >
                                <span className={`${styles.dayNumber} ${isToday ? styles.todayNumber : ''}`}>
                                    {format(day, 'd')}
                                </span>

                                {hasItems && (
                                    <div className={styles.indicators}>
                                        {dayTasks.length > 0 && (
                                            <span
                                                className={`${styles.indicator} ${completedTasks === dayTasks.length ? styles.completed : ''}`}
                                            >
                                                {dayTasks.length}
                                            </span>
                                        )}
                                        {dayGoals.length > 0 && (
                                            <span className={styles.goalIndicator}>🎯</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected day preview */}
            <div className={styles.preview}>
                <h3 className={styles.previewTitle}>
                    {format(new Date(selectedDate), 'EEEE, MMMM d')}
                </h3>
                <div className={styles.previewContent}>
                    {getTasksForDay(selectedDate).length === 0 && getGoalsForDay(selectedDate).length === 0 ? (
                        <p className={styles.emptyPreview}>No tasks or goals for this day</p>
                    ) : (
                        <>
                            {getGoalsForDay(selectedDate).map(goal => (
                                <div key={goal.id} className={`${styles.previewItem} ${goal.completed ? styles.completed : ''}`}>
                                    🎯 {goal.title}
                                </div>
                            ))}
                            {getTasksForDay(selectedDate).map(task => (
                                <div key={task.id} className={`${styles.previewItem} ${task.completed ? styles.completed : ''}`}>
                                    <span
                                        className={styles.taskCheck}
                                        style={{ background: task.completed ? 'var(--color-success)' : 'var(--color-border)' }}
                                    ></span>
                                    {task.title}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
