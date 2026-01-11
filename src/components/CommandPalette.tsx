'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Task, Project } from '@/types';
import {
    Search,
    X,
    Calendar,
    CheckSquare,
    FolderOpen,
    Plus,
    Clock,
    Target,
    Zap,
    Layout,
    ListTodo,
    CalendarDays,
    Settings,
    Flag,
    ArrowRight,
    Command
} from 'lucide-react';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenQuickAdd: () => void;
}

type CommandType = 'navigation' | 'action' | 'task' | 'project';

interface CommandItem {
    id: string;
    type: CommandType;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    shortcut?: string;
    action: () => void;
    priority?: Task['priority'];
    category?: Task['category'];
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

export default function CommandPalette({ isOpen, onClose, onOpenSettings, onOpenQuickAdd }: CommandPaletteProps) {
    const {
        tasks,
        projects,
        setActiveView,
        setActiveProjectId,
        toggleTask,
        setSelectedDate
    } = usePlannerStore();

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Navigation commands
    const navigationCommands: CommandItem[] = useMemo(() => [
        {
            id: 'nav-day',
            type: 'navigation',
            icon: <Calendar size={18} />,
            title: 'Go to Day View',
            subtitle: 'View today\'s schedule',
            shortcut: 'D',
            action: () => { setActiveView('day'); onClose(); }
        },
        {
            id: 'nav-week',
            type: 'navigation',
            icon: <CalendarDays size={18} />,
            title: 'Go to Week View',
            subtitle: 'View weekly overview',
            shortcut: 'W',
            action: () => { setActiveView('week'); onClose(); }
        },
        {
            id: 'nav-month',
            type: 'navigation',
            icon: <CalendarDays size={18} />,
            title: 'Go to Month View',
            subtitle: 'View monthly calendar',
            shortcut: 'M',
            action: () => { setActiveView('month'); onClose(); }
        },
        {
            id: 'nav-kanban',
            type: 'navigation',
            icon: <Layout size={18} />,
            title: 'Go to Kanban Board',
            subtitle: 'Manage tasks by status',
            shortcut: 'K',
            action: () => { setActiveView('kanban'); onClose(); }
        },
        {
            id: 'nav-inbox',
            type: 'navigation',
            icon: <ListTodo size={18} />,
            title: 'Go to Inbox',
            subtitle: 'View all tasks',
            shortcut: 'I',
            action: () => { setActiveView('inbox'); onClose(); }
        },
        {
            id: 'nav-habits',
            type: 'navigation',
            icon: <Target size={18} />,
            title: 'Go to Habits',
            subtitle: 'Track daily habits',
            shortcut: 'H',
            action: () => { setActiveView('habits'); onClose(); }
        },
        {
            id: 'nav-focus',
            type: 'navigation',
            icon: <Zap size={18} />,
            title: 'Start Focus Session',
            subtitle: 'Pomodoro timer',
            shortcut: 'F',
            action: () => { setActiveView('focus'); onClose(); }
        },
    ], [setActiveView, onClose]);

    // Action commands
    const actionCommands: CommandItem[] = useMemo(() => [
        {
            id: 'action-add-task',
            type: 'action',
            icon: <Plus size={18} />,
            title: 'Create New Task',
            subtitle: 'Add a new task to your list',
            shortcut: 'N',
            action: () => { onOpenQuickAdd(); onClose(); }
        },
        {
            id: 'action-today',
            type: 'action',
            icon: <Calendar size={18} />,
            title: 'Go to Today',
            subtitle: 'Jump to today\'s date',
            action: () => {
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setActiveView('day');
                onClose();
            }
        },
        {
            id: 'action-all-projects',
            type: 'action',
            icon: <FolderOpen size={18} />,
            title: 'View All Projects',
            subtitle: 'Clear project filter',
            action: () => { setActiveProjectId(null); onClose(); }
        },
        {
            id: 'action-settings',
            type: 'action',
            icon: <Settings size={18} />,
            title: 'Open Settings',
            subtitle: 'Configure preferences',
            shortcut: ',',
            action: () => { onOpenSettings(); onClose(); }
        },
    ], [onOpenQuickAdd, onOpenSettings, setSelectedDate, setActiveView, setActiveProjectId, onClose]);

    // Project commands
    const projectCommands: CommandItem[] = useMemo(() =>
        projects.map(project => ({
            id: `project-${project.id}`,
            type: 'project' as CommandType,
            icon: <FolderOpen size={18} style={{ color: project.color }} />,
            title: project.title,
            subtitle: `Switch to ${project.title} project`,
            action: () => { setActiveProjectId(project.id); onClose(); }
        })),
        [projects, setActiveProjectId, onClose]
    );

    // Task commands (incomplete tasks only)
    const taskCommands: CommandItem[] = useMemo(() =>
        tasks
            .filter(task => !task.completed)
            .slice(0, 20) // Limit to 20 recent tasks
            .map(task => ({
                id: `task-${task.id}`,
                type: 'task' as CommandType,
                icon: <CheckSquare size={18} />,
                title: task.title,
                subtitle: task.dueDate
                    ? `Due ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : undefined,
                priority: task.priority,
                category: task.category,
                action: () => { toggleTask(task.id); onClose(); }
            })),
        [tasks, toggleTask, onClose]
    );

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        const allCommands = [
            ...navigationCommands,
            ...actionCommands,
            ...projectCommands,
            ...taskCommands
        ];

        if (!query.trim()) {
            // Show navigation and action commands by default
            return [...navigationCommands, ...actionCommands].slice(0, 10);
        }

        const lowerQuery = query.toLowerCase();
        return allCommands.filter(cmd =>
            cmd.title.toLowerCase().includes(lowerQuery) ||
            cmd.subtitle?.toLowerCase().includes(lowerQuery)
        );
    }, [query, navigationCommands, actionCommands, projectCommands, taskCommands]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredCommands.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [filteredCommands, selectedIndex, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        selectedElement?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    // Reset selection when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands.length]);

    if (!isOpen) return null;

    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        const group = cmd.type;
        if (!acc[group]) acc[group] = [];
        acc[group].push(cmd);
        return acc;
    }, {} as Record<CommandType, CommandItem[]>);

    const groupLabels: Record<CommandType, string> = {
        navigation: 'Navigation',
        action: 'Actions',
        project: 'Projects',
        task: 'Tasks'
    };

    let currentIndex = 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.palette}
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search tasks, projects, or type a command..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                    <div className={styles.shortcutHint}>
                        <kbd>esc</kbd> to close
                    </div>
                </div>

                <div ref={listRef} className={styles.commandList}>
                    {filteredCommands.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No results found for "{query}"</p>
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([type, commands]) => (
                            <div key={type} className={styles.group}>
                                <div className={styles.groupLabel}>
                                    {groupLabels[type as CommandType]}
                                </div>
                                {commands.map(cmd => {
                                    const index = currentIndex++;
                                    return (
                                        <button
                                            key={cmd.id}
                                            data-index={index}
                                            className={`${styles.commandItem} ${index === selectedIndex ? styles.selected : ''}`}
                                            onClick={cmd.action}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <span
                                                className={styles.commandIcon}
                                                style={cmd.category ? { color: categoryColors[cmd.category] } : undefined}
                                            >
                                                {cmd.icon}
                                            </span>
                                            <div className={styles.commandContent}>
                                                <span className={styles.commandTitle}>{cmd.title}</span>
                                                {cmd.subtitle && (
                                                    <span className={styles.commandSubtitle}>{cmd.subtitle}</span>
                                                )}
                                            </div>
                                            {cmd.priority && (
                                                <Flag
                                                    size={12}
                                                    className={styles.priorityIcon}
                                                    style={{ color: priorityColors[cmd.priority] }}
                                                />
                                            )}
                                            {cmd.shortcut && (
                                                <kbd className={styles.shortcut}>{cmd.shortcut}</kbd>
                                            )}
                                            <ArrowRight className={styles.arrowIcon} size={14} />
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerHints}>
                        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                        <span><kbd>↵</kbd> select</span>
                        <span><kbd>esc</kbd> close</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
