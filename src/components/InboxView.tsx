'use client';

import { useState, useMemo } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Task } from '@/types';
import {
    Inbox,
    Filter,
    SortAsc,
    Calendar,
    Flag,
    Tag,
    FolderOpen,
    CheckCircle2,
    Circle,
    Clock,
    ChevronDown,
    ChevronRight,
    AlertCircle,
    MoreHorizontal,
    Edit2,
    Trash2,
    ArrowRight,
    X
} from 'lucide-react';
import TaskModal from './TaskModal';
import styles from './InboxView.module.css';

type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'category';
type FilterStatus = 'all' | 'pending' | 'completed' | 'overdue';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
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

export default function InboxView() {
    const { tasks, projects, toggleTask, deleteTask, moveTaskToStatus } = usePlannerStore();
    const [sortBy, setSortBy] = useState<SortOption>('dueDate');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [filterPriority, setFilterPriority] = useState<string | null>(null);
    const [filterProject, setFilterProject] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overdue: true,
        today: true,
        upcoming: true,
        noDate: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = (dateStr?: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date < today;
    };

    const isToday = (dateStr?: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
    };

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Status filter
        switch (filterStatus) {
            case 'pending':
                result = result.filter(t => !t.completed);
                break;
            case 'completed':
                result = result.filter(t => t.completed);
                break;
            case 'overdue':
                result = result.filter(t => !t.completed && isOverdue(t.dueDate));
                break;
        }

        // Category filter
        if (filterCategory) {
            result = result.filter(t => t.category === filterCategory);
        }

        // Priority filter
        if (filterPriority) {
            result = result.filter(t => t.priority === filterPriority);
        }

        // Project filter
        if (filterProject) {
            result = result.filter(t => t.project_id === filterProject);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'priority':
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'createdAt':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });

        return result;
    }, [tasks, filterStatus, filterCategory, filterPriority, filterProject, sortBy]);

    // Group tasks by date
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {
            overdue: [],
            today: [],
            upcoming: [],
            noDate: [],
        };

        filteredTasks.forEach(task => {
            if (!task.dueDate) {
                groups.noDate.push(task);
            } else if (!task.completed && isOverdue(task.dueDate)) {
                groups.overdue.push(task);
            } else if (isToday(task.dueDate)) {
                groups.today.push(task);
            } else {
                groups.upcoming.push(task);
            }
        });

        return groups;
    }, [filteredTasks]);

    const activeFiltersCount = [filterCategory, filterPriority, filterProject].filter(Boolean).length;

    const clearFilters = () => {
        setFilterCategory(null);
        setFilterPriority(null);
        setFilterProject(null);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const formatDueDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(dateStr)) return 'Today';

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getProjectById = (id?: string) => {
        if (!id) return null;
        return projects.find(p => p.id === id);
    };

    const handleQuickComplete = async (taskId: string) => {
        await toggleTask(taskId);
    };

    const handleMoveToToday = async (task: Task) => {
        const todayStr = new Date().toISOString().split('T')[0];
        // This would need updateTask to support dueDate update
    };

    const renderTaskItem = (task: Task) => {
        const project = getProjectById(task.project_id);

        return (
            <div
                key={task.id}
                className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
                style={{ '--category-color': categoryColors[task.category] } as React.CSSProperties}
            >
                <button
                    className={styles.checkbox}
                    onClick={() => handleQuickComplete(task.id)}
                    aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                    {task.completed ? (
                        <CheckCircle2 size={20} className={styles.checked} />
                    ) : (
                        <Circle size={20} />
                    )}
                </button>

                <div className={styles.taskContent} onClick={() => { setEditingTask(task); setIsModalOpen(true); }}>
                    <p className={styles.taskTitle}>{task.title}</p>
                    {task.description && (
                        <p className={styles.taskDescription}>{task.description}</p>
                    )}
                    <div className={styles.taskMeta}>
                        {task.dueDate && (
                            <span className={`${styles.metaItem} ${isOverdue(task.dueDate) && !task.completed ? styles.overdue : ''}`}>
                                <Calendar size={12} />
                                {formatDueDate(task.dueDate)}
                                {task.dueTime && ` at ${task.dueTime}`}
                            </span>
                        )}
                        {task.estimatedMinutes && (
                            <span className={styles.metaItem}>
                                <Clock size={12} />
                                {task.estimatedMinutes}m
                            </span>
                        )}
                        {project && (
                            <span
                                className={styles.projectBadge}
                                style={{ '--project-color': project.color } as React.CSSProperties}
                            >
                                <FolderOpen size={10} />
                                {project.title}
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.taskActions}>
                    <span
                        className={styles.priorityBadge}
                        style={{ color: priorityColors[task.priority] }}
                        title={`${task.priority} priority`}
                    >
                        <Flag size={14} />
                    </span>
                    <span
                        className={styles.categoryDot}
                        style={{ background: categoryColors[task.category] }}
                        title={task.category}
                    />
                </div>
            </div>
        );
    };

    const renderSection = (title: string, key: string, tasks: Task[], icon: React.ReactNode, variant?: string) => {
        if (tasks.length === 0) return null;

        return (
            <div className={`${styles.section} ${variant ? styles[variant] : ''}`}>
                <button
                    className={styles.sectionHeader}
                    onClick={() => toggleSection(key)}
                >
                    <span className={styles.sectionIcon}>{icon}</span>
                    <span className={styles.sectionTitle}>{title}</span>
                    <span className={styles.sectionCount}>{tasks.length}</span>
                    {expandedSections[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {expandedSections[key] && (
                    <div className={styles.sectionContent}>
                        {tasks.map(renderTaskItem)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.inboxView}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <Inbox className={styles.titleIcon} size={28} />
                    <div>
                        <h2 className={styles.title}>Inbox</h2>
                        <p className={styles.subtitle}>
                            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                </div>

                <div className={styles.actions}>
                    {/* Sort Dropdown */}
                    <div className={styles.dropdown}>
                        <button className={styles.dropdownTrigger}>
                            <SortAsc size={16} />
                            <span className={styles.dropdownLabel}>Sort</span>
                            <ChevronDown size={14} />
                        </button>
                        <div className={styles.dropdownMenu}>
                            {[
                                { value: 'dueDate', label: 'Due Date' },
                                { value: 'priority', label: 'Priority' },
                                { value: 'createdAt', label: 'Recently Added' },
                                { value: 'category', label: 'Category' },
                            ].map(option => (
                                <button
                                    key={option.value}
                                    className={`${styles.dropdownItem} ${sortBy === option.value ? styles.active : ''}`}
                                    onClick={() => setSortBy(option.value as SortOption)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <button
                        className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={16} />
                        <span>Filter</span>
                        {activeFiltersCount > 0 && (
                            <span className={styles.filterBadge}>{activeFiltersCount}</span>
                        )}
                    </button>
                </div>
            </header>

            {/* Filters Panel */}
            {showFilters && (
                <div className={styles.filtersPanel}>
                    {/* Status Tabs */}
                    <div className={styles.statusTabs}>
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'completed', label: 'Completed' },
                        ].map(status => (
                            <button
                                key={status.value}
                                className={`${styles.statusTab} ${filterStatus === status.value ? styles.active : ''}`}
                                onClick={() => setFilterStatus(status.value as FilterStatus)}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.filterGroups}>
                        {/* Category Filter */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Category</label>
                            <div className={styles.filterOptions}>
                                {Object.entries(categoryColors).map(([cat, color]) => (
                                    <button
                                        key={cat}
                                        className={`${styles.filterOption} ${filterCategory === cat ? styles.active : ''}`}
                                        style={{ '--filter-color': color } as React.CSSProperties}
                                        onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                                    >
                                        <span className={styles.filterDot} />
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority Filter */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Priority</label>
                            <div className={styles.filterOptions}>
                                {Object.entries(priorityColors).map(([pri, color]) => (
                                    <button
                                        key={pri}
                                        className={`${styles.filterOption} ${filterPriority === pri ? styles.active : ''}`}
                                        style={{ '--filter-color': color } as React.CSSProperties}
                                        onClick={() => setFilterPriority(filterPriority === pri ? null : pri)}
                                    >
                                        <Flag size={12} style={{ color }} />
                                        {pri}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Project Filter */}
                        {projects.length > 0 && (
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Project</label>
                                <div className={styles.filterOptions}>
                                    {projects.map(project => (
                                        <button
                                            key={project.id}
                                            className={`${styles.filterOption} ${filterProject === project.id ? styles.active : ''}`}
                                            style={{ '--filter-color': project.color } as React.CSSProperties}
                                            onClick={() => setFilterProject(filterProject === project.id ? null : project.id)}
                                        >
                                            <FolderOpen size={12} style={{ color: project.color }} />
                                            {project.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {activeFiltersCount > 0 && (
                        <button className={styles.clearFilters} onClick={clearFilters}>
                            <X size={14} />
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Task Sections */}
            <div className={styles.content}>
                {filteredTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Inbox size={48} className={styles.emptyIcon} />
                        <h3>No tasks found</h3>
                        <p>
                            {activeFiltersCount > 0
                                ? 'Try adjusting your filters'
                                : 'Your inbox is empty. Add a task to get started!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {renderSection('Overdue', 'overdue', groupedTasks.overdue, <AlertCircle size={18} />, 'overdue')}
                        {renderSection('Today', 'today', groupedTasks.today, <Calendar size={18} />, 'today')}
                        {renderSection('Upcoming', 'upcoming', groupedTasks.upcoming, <ArrowRight size={18} />)}
                        {renderSection('No Due Date', 'noDate', groupedTasks.noDate, <Clock size={18} />)}
                    </>
                )}
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                editTask={editingTask}
            />
        </div>
    );
}
