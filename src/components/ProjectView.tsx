'use client';

import { useState, useMemo } from 'react';
import { usePlannerStore } from '@/store/planner';
import {
    CheckSquare,
    Calendar as CalendarIcon,
    Plus,
    Plane,
    Briefcase,
    Folder,
    Clock,
    Edit,
    ChevronLeft,
    ChevronRight,
    X,
    Flag,
    CheckCircle2,
    Circle,
    Trash2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import TaskModal from './TaskModal';
import ProjectModal from './ProjectModal';
import styles from './ProjectView.module.css';
import { Task } from '@/types';

const priorityColors = {
    urgent: 'var(--color-priority-urgent)',
    high: 'var(--color-priority-high)',
    medium: 'var(--color-priority-medium)',
    low: 'var(--color-priority-low)',
};

export default function ProjectView() {
    const {
        projects,
        activeProjectId,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        selectedDate
    } = usePlannerStore();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

    const project = projects.find(p => p.id === activeProjectId);

    if (!project) return null;

    const projectTasks = tasks.filter(t => t.project_id === activeProjectId);
    const completedTasks = projectTasks.filter(t => t.completed).length;
    const progress = projectTasks.length > 0
        ? Math.round((completedTasks / projectTasks.length) * 100)
        : 0;

    // Group tasks by status
    const inProgressTasks = projectTasks.filter(t => t.status === 'inProgress' && !t.completed);
    const todoTasks = projectTasks.filter(t => t.status === 'todo' && !t.completed);
    const completedTasksList = projectTasks.filter(t => t.completed);

    // Calendar days
    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        // Pad start with previous month days
        const startDay = start.getDay();
        const paddedDays: (Date | null)[] = [];
        for (let i = 0; i < startDay; i++) {
            paddedDays.push(null);
        }
        return [...paddedDays, ...days];
    }, [currentMonth]);

    // Get tasks for a specific date
    const getTasksForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return projectTasks.filter(t => t.dueDate === dateStr);
    };

    // Get tasks for selected popup date
    const selectedDateTasks = useMemo(() => {
        if (!selectedCalendarDate) return [];
        return projectTasks.filter(t => t.dueDate === selectedCalendarDate);
    }, [selectedCalendarDate, projectTasks]);

    const getProjectIcon = (type: string) => {
        switch (type) {
            case 'trip': return <Plane size={24} />;
            case 'work': return <Briefcase size={24} />;
            default: return <Folder size={24} />;
        }
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            addTask({
                title: newTaskTitle.trim(),
                completed: false,
                priority: 'medium',
                category: project.type === 'work' ? 'work' : 'personal',
                dueDate: selectedDate,
                status: 'todo',
            });
            setNewTaskTitle('');
        }
    };

    const handleDateClick = (date: Date, event: React.MouseEvent) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const rect = (event.target as HTMLElement).getBoundingClientRect();

        // Position popup near the clicked date
        setPopupPosition({
            x: Math.min(rect.left, window.innerWidth - 320),
            y: Math.min(rect.bottom + 8, window.innerHeight - 300)
        });
        setSelectedCalendarDate(dateStr);
    };

    const handleTaskClick = (task: Task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleQuickComplete = async (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        await toggleTask(taskId);
    };

    const handleQuickDelete = async (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        await deleteTask(taskId);
    };

    const renderTaskItem = (task: Task, showDate = true) => (
        <div
            key={task.id}
            className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
            onClick={() => handleTaskClick(task)}
        >
            <button
                className={styles.checkbox}
                onClick={(e) => handleQuickComplete(e, task.id)}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
                {task.completed ? (
                    <CheckCircle2 size={18} className={styles.checked} />
                ) : (
                    <Circle size={18} />
                )}
            </button>
            <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>{task.title}</span>
                <div className={styles.taskMeta}>
                    {showDate && task.dueDate && (
                        <span className={styles.metaItem}>
                            <CalendarIcon size={11} />
                            {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                    )}
                    {task.dueTime && (
                        <span className={styles.metaItem}>
                            <Clock size={11} />
                            {task.dueTime}
                        </span>
                    )}
                    {task.estimatedMinutes && (
                        <span className={styles.metaItem}>
                            {task.estimatedMinutes}m
                        </span>
                    )}
                </div>
            </div>
            <div className={styles.taskActions}>
                <Flag size={14} style={{ color: priorityColors[task.priority] }} />
                <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleQuickDelete(e, task.id)}
                    aria-label="Delete task"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.projectView} style={{ '--project-color': project.color } as any}>
            <header className={styles.header}>
                <div className={styles.projectInfo}>
                    <div className={styles.projectIcon}>
                        {getProjectIcon(project.type)}
                    </div>
                    <div className={styles.titles}>
                        <div className={styles.titleRow}>
                            <h2 className={styles.title}>{project.title}</h2>
                            <button
                                className={styles.editProjectBtn}
                                onClick={() => setIsEditModalOpen(true)}
                                title="Edit Project Details"
                            >
                                <Edit size={16} />
                            </button>
                        </div>
                        <p className={styles.subtitle}>{project.description || 'Project Workspace'}</p>
                    </div>
                </div>

                <div className={styles.stats}>
                    <div className={styles.progressRing}>
                        <svg viewBox="0 0 36 36" className={styles.progressSvg}>
                            <path
                                className={styles.progressBg}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={styles.progressFill}
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className={styles.progressText}>{progress}%</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{projectTasks.length}</span>
                        <span className={styles.statLabel}>Tasks</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>{completedTasks}</span>
                        <span className={styles.statLabel}>Done</span>
                    </div>
                </div>
            </header>

            <div className={styles.workspace}>
                {/* Checklist Section */}
                <section className={styles.checklistPane}>
                    <div className={styles.paneHeader}>
                        <h3 className={styles.paneTitle}>
                            <CheckSquare size={16} />
                            Checklist
                        </h3>
                        <button
                            className={styles.addDetailBtn}
                            onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                        >
                            <Plus size={14} />
                            Add with details
                        </button>
                    </div>

                    {/* Quick Add */}
                    <form onSubmit={handleAddTask} className={styles.quickAddForm}>
                        <input
                            type="text"
                            placeholder="+ Quick add task..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className={styles.quickAddInput}
                        />
                    </form>

                    <div className={styles.taskSections}>
                        {/* In Progress */}
                        {inProgressTasks.length > 0 && (
                            <div className={styles.taskSection}>
                                <h4 className={styles.sectionTitle}>
                                    <span className={styles.sectionDot} style={{ background: 'var(--color-accent-primary)' }} />
                                    In Progress ({inProgressTasks.length})
                                </h4>
                                <div className={styles.taskList}>
                                    {inProgressTasks.map(task => renderTaskItem(task))}
                                </div>
                            </div>
                        )}

                        {/* To Do */}
                        {todoTasks.length > 0 && (
                            <div className={styles.taskSection}>
                                <h4 className={styles.sectionTitle}>
                                    <span className={styles.sectionDot} style={{ background: 'var(--color-warning)' }} />
                                    To Do ({todoTasks.length})
                                </h4>
                                <div className={styles.taskList}>
                                    {todoTasks.map(task => renderTaskItem(task))}
                                </div>
                            </div>
                        )}

                        {/* Completed */}
                        {completedTasksList.length > 0 && (
                            <div className={styles.taskSection}>
                                <h4 className={styles.sectionTitle}>
                                    <span className={styles.sectionDot} style={{ background: 'var(--color-success)' }} />
                                    Completed ({completedTasksList.length})
                                </h4>
                                <div className={styles.taskList}>
                                    {completedTasksList.map(task => renderTaskItem(task))}
                                </div>
                            </div>
                        )}

                        {projectTasks.length === 0 && (
                            <div className={styles.emptyState}>
                                <CheckSquare size={32} className={styles.emptyIcon} />
                                <p>No tasks yet. Add one above!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Calendar Section */}
                <section className={styles.calendarPane}>
                    <div className={styles.paneHeader}>
                        <h3 className={styles.paneTitle}>
                            <CalendarIcon size={16} />
                            Upcoming
                        </h3>
                    </div>

                    <div className={styles.calendarHeader}>
                        <button
                            className={styles.calendarNav}
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className={styles.calendarMonth}>
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button
                            className={styles.calendarNav}
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className={styles.calendarGrid}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className={styles.calendarDayName}>{day}</div>
                        ))}
                        {calendarDays.map((day, index) => {
                            if (!day) {
                                return <div key={`empty-${index}`} className={styles.calendarDayEmpty} />;
                            }
                            const dayTasks = getTasksForDate(day);
                            const hasTask = dayTasks.length > 0;
                            const isSelected = selectedCalendarDate === format(day, 'yyyy-MM-dd');

                            return (
                                <button
                                    key={day.toISOString()}
                                    className={`${styles.calendarDay} ${isToday(day) ? styles.today : ''} ${isSelected ? styles.selected : ''} ${hasTask ? styles.hasTask : ''}`}
                                    onClick={(e) => handleDateClick(day, e)}
                                >
                                    <span className={styles.dayNumber}>{format(day, 'd')}</span>
                                    {hasTask && (
                                        <div className={styles.taskDots}>
                                            {dayTasks.slice(0, 3).map((t, i) => (
                                                <span
                                                    key={i}
                                                    className={styles.taskDot}
                                                    style={{ background: t.completed ? 'var(--color-success)' : priorityColors[t.priority] }}
                                                />
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <span className={styles.moreDots}>+{dayTasks.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Upcoming Tasks List */}
                    <div className={styles.upcomingList}>
                        <h4 className={styles.upcomingTitle}>Upcoming Tasks</h4>
                        {projectTasks
                            .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= new Date())
                            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                            .slice(0, 5)
                            .map(task => (
                                <div
                                    key={task.id}
                                    className={styles.upcomingItem}
                                    onClick={() => handleTaskClick(task)}
                                >
                                    <span className={styles.upcomingDate}>
                                        {format(new Date(task.dueDate!), 'MMM d')}
                                    </span>
                                    <span className={styles.upcomingTaskTitle}>{task.title}</span>
                                    <Flag size={12} style={{ color: priorityColors[task.priority] }} />
                                </div>
                            ))
                        }
                        {projectTasks.filter(t => !t.completed && t.dueDate).length === 0 && (
                            <p className={styles.noUpcoming}>No upcoming tasks scheduled</p>
                        )}
                    </div>
                </section>
            </div>

            {/* Date Tasks Popup */}
            {selectedCalendarDate && (
                <>
                    <div className={styles.popupOverlay} onClick={() => setSelectedCalendarDate(null)} />
                    <div
                        className={styles.datePopup}
                        style={{
                            left: `${popupPosition.x}px`,
                            top: `${popupPosition.y}px`
                        }}
                    >
                        <div className={styles.popupHeader}>
                            <h4>{format(new Date(selectedCalendarDate), 'EEEE, MMMM d')}</h4>
                            <button
                                className={styles.popupClose}
                                onClick={() => setSelectedCalendarDate(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className={styles.popupContent}>
                            {selectedDateTasks.length === 0 ? (
                                <p className={styles.noTasksText}>No tasks for this date</p>
                            ) : (
                                selectedDateTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`${styles.popupTask} ${task.completed ? styles.completed : ''}`}
                                        onClick={() => { handleTaskClick(task); setSelectedCalendarDate(null); }}
                                    >
                                        <button
                                            className={styles.popupCheckbox}
                                            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                        >
                                            {task.completed ? (
                                                <CheckCircle2 size={16} className={styles.checked} />
                                            ) : (
                                                <Circle size={16} />
                                            )}
                                        </button>
                                        <span className={styles.popupTaskTitle}>{task.title}</span>
                                        {task.dueTime && (
                                            <span className={styles.popupTime}>{task.dueTime}</span>
                                        )}
                                        <Flag size={12} style={{ color: priorityColors[task.priority] }} />
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            className={styles.popupAddBtn}
                            onClick={() => {
                                setEditingTask(null);
                                setIsTaskModalOpen(true);
                                setSelectedCalendarDate(null);
                            }}
                        >
                            <Plus size={14} />
                            Add task for this date
                        </button>
                    </div>
                </>
            )}

            {/* Modals */}
            <ProjectModal
                isOpen={isEditModalOpen}
                project={project}
                onClose={() => setIsEditModalOpen(false)}
            />

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
                editTask={editingTask}
                initialStatus="todo"
            />
        </div>
    );
}
