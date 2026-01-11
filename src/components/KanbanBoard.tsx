'use client';

import { useState } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Task } from '@/types';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from '@hello-pangea/dnd';
import {
    Plus,
    Circle,
    CheckCircle2,
    GripVertical,
    Flag,
    Calendar,
    Clock,
    FolderOpen,
    MoreHorizontal,
    Edit2,
    Trash2,
    X
} from 'lucide-react';
import TaskModal from './TaskModal';
import styles from './KanbanBoard.module.css';

type KanbanStatus = 'backlog' | 'todo' | 'inProgress' | 'done';

interface Column {
    id: KanbanStatus;
    title: string;
    color: string;
}

const columns: Column[] = [
    { id: 'backlog', title: 'Backlog', color: 'var(--color-text-tertiary)' },
    { id: 'todo', title: 'To Do', color: 'var(--color-info)' },
    { id: 'inProgress', title: 'In Progress', color: 'var(--color-warning)' },
    { id: 'done', title: 'Done', color: 'var(--color-success)' },
];

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

export default function KanbanBoard() {
    const { tasks, toggleTask, reorderTasks, deleteTask, activeProjectId, projects } = usePlannerStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState<KanbanStatus>('todo');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const getTasksByStatus = (status: KanbanStatus) => {
        return tasks
            .filter(t =>
                t.status === status &&
                (!activeProjectId || t.project_id === activeProjectId)
            )
            .sort((a, b) => a.order - b.order);
    };

    const activeProject = projects.find(p => p.id === activeProjectId);

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;

        // Move to new status
        const newStatus = destination.droppableId as KanbanStatus;

        // Get tasks in destination column
        const destTasks = getTasksByStatus(newStatus).filter(t => t.id !== draggableId);

        // Insert at new position
        const updatedTasks = tasks.map(t => {
            if (t.id === draggableId) {
                return {
                    ...t,
                    status: newStatus,
                    order: destination.index,
                    completed: newStatus === 'done',
                    updatedAt: new Date().toISOString(),
                };
            }

            if (t.status === newStatus && t.id !== draggableId) {
                const currentIndex = destTasks.findIndex(dt => dt.id === t.id);
                if (currentIndex >= destination.index) {
                    return { ...t, order: currentIndex + 1 };
                }
            }

            return t;
        });

        reorderTasks(updatedTasks);
    };

    const openAddModal = (status: KanbanStatus) => {
        setEditingTask(null);
        setModalStatus(status);
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setModalStatus(task.status);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const handleDeleteTask = (taskId: string) => {
        deleteTask(taskId);
        setActiveMenu(null);
    };

    const getProjectForTask = (projectId?: string) => {
        if (!projectId) return null;
        return projects.find(p => p.id === projectId);
    };

    const formatDueDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <div className={styles.kanbanBoard}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h2 className={styles.title}>Kanban Board</h2>
                    {activeProject && (
                        <div className={styles.projectBadge} style={{ '--project-color': activeProject.color } as any}>
                            <span className={styles.projectDot} />
                            {activeProject.title}
                        </div>
                    )}
                </div>
                <p className={styles.subtitle}>Drag and drop tasks between columns</p>
            </header>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className={styles.columnsContainer}>
                    {columns.map(column => {
                        const columnTasks = getTasksByStatus(column.id);

                        return (
                            <div key={column.id} className={styles.column}>
                                <div className={styles.columnHeader}>
                                    <div className={styles.columnTitle}>
                                        <span
                                            className={styles.columnDot}
                                            style={{ background: column.color }}
                                        />
                                        <h3>{column.title}</h3>
                                        <span className={styles.columnCount}>{columnTasks.length}</span>
                                    </div>
                                    <button
                                        className={styles.addColumnButton}
                                        onClick={() => openAddModal(column.id)}
                                        aria-label={`Add task to ${column.title}`}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`${styles.columnContent} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
                                        >
                                            {columnTasks.map((task, index) => {
                                                const taskProject = getProjectForTask(task.project_id);

                                                return (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`${styles.taskCard} ${snapshot.isDragging ? styles.dragging : ''} ${task.completed ? styles.completed : ''}`}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    '--category-color': categoryColors[task.category],
                                                                } as any}
                                                            >
                                                                <div
                                                                    {...provided.dragHandleProps}
                                                                    className={styles.dragHandle}
                                                                >
                                                                    <GripVertical size={14} />
                                                                </div>

                                                                <button
                                                                    className={styles.checkbox}
                                                                    onClick={() => toggleTask(task.id)}
                                                                >
                                                                    {task.completed ? (
                                                                        <CheckCircle2 size={18} className={styles.checked} />
                                                                    ) : (
                                                                        <Circle size={18} />
                                                                    )}
                                                                </button>

                                                                <div className={styles.taskContent}>
                                                                    <p className={styles.taskTitle}>{task.title}</p>

                                                                    {task.description && (
                                                                        <p className={styles.taskDescription}>{task.description}</p>
                                                                    )}

                                                                    <div className={styles.taskMeta}>
                                                                        {task.dueDate && (
                                                                            <span className={`${styles.taskMetaItem} ${isOverdue(task.dueDate) && !task.completed ? styles.overdue : ''}`}>
                                                                                <Calendar size={12} />
                                                                                {formatDueDate(task.dueDate)}
                                                                            </span>
                                                                        )}

                                                                        {task.dueTime && (
                                                                            <span className={styles.taskMetaItem}>
                                                                                <Clock size={12} />
                                                                                {task.dueTime}
                                                                            </span>
                                                                        )}

                                                                        {task.estimatedMinutes && (
                                                                            <span className={styles.taskMetaItem}>
                                                                                {task.estimatedMinutes}m
                                                                            </span>
                                                                        )}

                                                                        {taskProject && (
                                                                            <span
                                                                                className={styles.taskProject}
                                                                                style={{ '--project-color': taskProject.color } as any}
                                                                            >
                                                                                <FolderOpen size={10} />
                                                                                {taskProject.title}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className={styles.taskActions}>
                                                                    <span
                                                                        className={styles.priority}
                                                                        style={{ color: priorityColors[task.priority] }}
                                                                        title={`${task.priority} priority`}
                                                                    >
                                                                        <Flag size={12} />
                                                                    </span>

                                                                    <div className={styles.menuWrapper}>
                                                                        <button
                                                                            className={styles.menuButton}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveMenu(activeMenu === task.id ? null : task.id);
                                                                            }}
                                                                            aria-label="Task options"
                                                                        >
                                                                            <MoreHorizontal size={14} />
                                                                        </button>

                                                                        {activeMenu === task.id && (
                                                                            <div className={styles.menu}>
                                                                                <button
                                                                                    className={styles.menuItem}
                                                                                    onClick={() => openEditModal(task)}
                                                                                >
                                                                                    <Edit2 size={14} />
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}

                                            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                                <div className={styles.emptyColumn}>
                                                    <p>No tasks</p>
                                                    <button
                                                        className={styles.emptyAddButton}
                                                        onClick={() => openAddModal(column.id)}
                                                    >
                                                        + Add a task
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* Click outside to close menu */}
            {activeMenu && (
                <div
                    className={styles.menuOverlay}
                    onClick={() => setActiveMenu(null)}
                />
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                }}
                initialStatus={modalStatus}
                editTask={editingTask}
            />
        </div>
    );
}
