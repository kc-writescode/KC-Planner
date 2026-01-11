'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/store/planner';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Target, Clock, CheckCircle2 } from 'lucide-react';
import TaskItem from './TaskItem';
import TimeBlockGrid from './TimeBlockGrid';
import styles from './DayView.module.css';

export default function DayView() {
    const {
        selectedDate,
        setSelectedDate,
        tasks,
        dailyGoals,
        addDailyGoal,
        toggleDailyGoal,
        deleteDailyGoal,
        addTask,
        activeProjectId,
        projects
    } = usePlannerStore();

    const [newGoal, setNewGoal] = useState('');
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const date = new Date(selectedDate);
    const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDate;

    const todayTasks = tasks.filter(t =>
        t.dueDate === selectedDate &&
        (!activeProjectId || t.project_id === activeProjectId)
    );
    const todayGoals = dailyGoals.filter(g =>
        g.date === selectedDate &&
        (!activeProjectId || g.project_id === activeProjectId)
    );
    const completedTasks = todayTasks.filter(t => t.completed).length;

    const activeProject = projects.find(p => p.id === activeProjectId);

    const handlePrevDay = () => setSelectedDate(format(subDays(date, 1), 'yyyy-MM-dd'));
    const handleNextDay = () => setSelectedDate(format(addDays(date, 1), 'yyyy-MM-dd'));
    const handleToday = () => setSelectedDate(format(new Date(), 'yyyy-MM-dd'));

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGoal.trim() && todayGoals.length < 3) {
            addDailyGoal(newGoal.trim(), selectedDate);
            setNewGoal('');
        }
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            addTask({
                title: newTaskTitle.trim(),
                completed: false,
                priority: 'medium',
                category: 'personal',
                dueDate: selectedDate,
                status: 'todo',
            });
            setNewTaskTitle('');
            setShowAddTask(false);
        }
    };

    return (
        <div className={styles.dayView}>
            <header className={styles.header}>
                <div className={styles.dateNav}>
                    <button className={styles.navButton} onClick={handlePrevDay} aria-label="Previous day">
                        <ChevronLeft size={20} />
                    </button>
                    <div className={styles.dateDisplay}>
                        <h2 className={styles.dateTitle}>
                            {isToday ? 'Today' : format(date, 'EEEE')}
                        </h2>
                        <p className={styles.dateSubtitle}>{format(date, 'MMMM d, yyyy')}</p>
                    </div>
                    {activeProject && (
                        <div className={styles.projectBadge} style={{ '--project-color': activeProject.color } as any}>
                            <span className={styles.projectDot} />
                            {activeProject.title}
                        </div>
                    )}
                    <button className={styles.navButton} onClick={handleNextDay} aria-label="Next day">
                        <ChevronRight size={20} />
                    </button>
                </div>
                {!isToday && (
                    <button className={styles.todayButton} onClick={handleToday}>
                        Go to Today
                    </button>
                )}
            </header>

            <div className={styles.content}>
                {/* Daily Goals Section */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <Target size={20} className={styles.sectionIcon} />
                            <h3>Daily Goals</h3>
                            <span className={styles.badge}>{todayGoals.filter(g => g.completed).length}/{todayGoals.length}</span>
                        </div>
                        <p className={styles.sectionHint}>Focus on 3 key priorities</p>
                    </div>

                    <div className={styles.goalsList}>
                        {todayGoals.map((goal, index) => (
                            <div key={goal.id} className={`${styles.goalItem} ${goal.completed ? styles.completed : ''}`}>
                                <span className={styles.goalNumber}>{index + 1}</span>
                                <button
                                    className={styles.goalCheckbox}
                                    onClick={() => toggleDailyGoal(goal.id)}
                                >
                                    {goal.completed && <CheckCircle2 size={20} />}
                                </button>
                                <span className={styles.goalText}>{goal.title}</span>
                                <button
                                    className={styles.goalDelete}
                                    onClick={() => deleteDailyGoal(goal.id)}
                                    aria-label="Delete goal"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {todayGoals.length < 3 && (
                            <form onSubmit={handleAddGoal} className={styles.addGoalForm}>
                                <span className={styles.goalNumber}>{todayGoals.length + 1}</span>
                                <input
                                    type="text"
                                    placeholder="Add a priority goal..."
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    className={styles.goalInput}
                                />
                            </form>
                        )}
                    </div>
                </section>

                {/* Tasks Section */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <CheckCircle2 size={20} className={styles.sectionIcon} />
                            <h3>Tasks</h3>
                            <span className={styles.badge}>{completedTasks}/{todayTasks.length}</span>
                        </div>
                        <button
                            className={styles.addButton}
                            onClick={() => setShowAddTask(!showAddTask)}
                        >
                            <Plus size={18} />
                            Add Task
                        </button>
                    </div>

                    {showAddTask && (
                        <form onSubmit={handleAddTask} className={styles.addTaskForm}>
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className={styles.taskInput}
                                autoFocus
                            />
                            <div className={styles.addTaskActions}>
                                <button type="submit" className="btn btn-primary btn-sm">Add</button>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddTask(false)}>Cancel</button>
                            </div>
                        </form>
                    )}

                    <div className={styles.tasksList}>
                        {todayTasks.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No tasks for this day</p>
                                <button
                                    className={styles.emptyAction}
                                    onClick={() => setShowAddTask(true)}
                                >
                                    Add your first task
                                </button>
                            </div>
                        ) : (
                            todayTasks.map(task => (
                                <TaskItem key={task.id} task={task} />
                            ))
                        )}
                    </div>
                </section>

                {/* Time Blocks Section */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <Clock size={20} className={styles.sectionIcon} />
                            <h3>Schedule</h3>
                        </div>
                    </div>
                    <TimeBlockGrid date={selectedDate} />
                </section>
            </div>
        </div>
    );
}
