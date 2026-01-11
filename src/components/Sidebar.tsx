'use client';

import { useState, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner';
import { format } from 'date-fns';
import {
    Calendar,
    CheckSquare,
    Target,
    Clock,
    Kanban,
    Flame,
    Settings,
    Sun,
    CalendarDays,
    CalendarRange,
    X,
    Plus,
    Folder,
    Plane,
    Briefcase,
    Edit,
    Trash2,
    LogOut
} from 'lucide-react';
import ProjectModal from './ProjectModal';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings?: () => void;
}

const smartLists = [
    { id: 'inbox', label: 'Inbox', icon: CheckSquare },
    { id: 'day', label: 'Today', icon: Sun },
    { id: 'week', label: 'Upcoming', icon: CalendarRange },
] as const;

export default function Sidebar({ isOpen, onClose, onOpenSettings }: SidebarProps) {
    const [today, setToday] = useState<Date | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<any>(null);
    const {
        activeView,
        setActiveView,
        tasks,
        habits,
        dailyGoals,
        projects,
        activeProjectId,
        setActiveProjectId,
        deleteProject,
        signOut
    } = usePlannerStore();

    useEffect(() => {
        setToday(new Date());
    }, []);

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const todayGoals = today ? dailyGoals.filter(g => g.date === format(today, 'yyyy-MM-dd')) : [];
    const completedGoals = todayGoals.filter(g => g.completed).length;

    const handleNavClick = (viewId: string) => {
        setActiveView(viewId as any);
        setActiveProjectId(null); // Reset project when clicking a smart list
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const handleProjectClick = (projectId: string) => {
        setActiveProjectId(projectId);
        setActiveView('day'); // Default to day view context within project or something similar
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const getProjectIcon = (type: string) => {
        switch (type) {
            case 'trip': return <Plane size={18} />;
            case 'work': return <Briefcase size={18} />;
            default: return <Folder size={18} />;
        }
    };

    const handleEditProject = (e: React.MouseEvent, project: any) => {
        e.stopPropagation();
        setProjectToEdit(project);
        setIsProjectModalOpen(true);
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project? Tasks will remain but lose their project assignment.')) {
            deleteProject(id);
        }
    };

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={onClose}
            />
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <div className={styles.logoSection}>
                        <div className={styles.logoIcon}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className={styles.logo}>Perfect Planner</h1>
                            <p className={styles.date}>{today ? format(today, 'EEEE, MMMM d') : 'Loading...'}</p>
                        </div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{completedTasks}/{totalTasks}</div>
                        <div className={styles.statLabel}>Tasks</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{completedGoals}/{todayGoals.length || 3}</div>
                        <div className={styles.statLabel}>Goals</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{habits.reduce((max, h) => Math.max(max, h.streak), 0)}</div>
                        <div className={styles.statLabel}>Streak</div>
                    </div>
                </div>

                <div className={styles.navContainer}>
                    <nav className={styles.nav}>
                        <nav className={styles.nav}>
                            <p className={styles.navLabel}>Smart Lists</p>
                            <ul className={styles.navList}>
                                {smartLists.map(({ id, label, icon: Icon }) => (
                                    <li key={id}>
                                        <button
                                            className={`${styles.navItem} ${activeView === id && activeProjectId === null ? styles.active : ''}`}
                                            onClick={() => handleNavClick(id)}
                                        >
                                            <Icon size={20} />
                                            <span>{label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </nav>

                    <nav className={styles.nav}>
                        <div className={styles.navHeader}>
                            <p className={styles.navLabel}>Projects & Trips</p>
                            <button
                                className={styles.addProjectBtn}
                                onClick={() => setIsProjectModalOpen(true)}
                                title="New Project"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <ul className={styles.navList}>
                            <li>
                                <button
                                    className={`${styles.navItem} ${activeProjectId === null && activeView === 'inbox' ? styles.active : ''}`}
                                    onClick={() => handleNavClick('inbox')}
                                >
                                    <Folder size={20} />
                                    <span>All Projects</span>
                                </button>
                            </li>
                            {projects.map((project) => (
                                <li key={project.id}>
                                    <button
                                        className={`${styles.navItem} ${activeProjectId === project.id ? styles.active : ''}`}
                                        onClick={() => handleProjectClick(project.id)}
                                    >
                                        <div
                                            className={styles.projectColor}
                                            style={{ background: project.color }}
                                        />
                                        {getProjectIcon(project.type)}
                                        <span className={styles.projectTitle}>{project.title}</span>
                                        <div className={styles.projectActions}>
                                            <button
                                                className={styles.projectActionBtn}
                                                onClick={(e) => handleEditProject(e, project)}
                                                title="Edit Project"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                className={`${styles.projectActionBtn} ${styles.delete}`}
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                                title="Delete Project"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className={styles.footer}>
                    <button className={styles.settingsButton} onClick={onOpenSettings}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                    <button
                        className={`${styles.settingsButton} ${styles.logoutButton}`}
                        onClick={() => {
                            if (confirm('Are you sure you want to sign out?')) {
                                signOut();
                            }
                        }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <ProjectModal
                isOpen={isProjectModalOpen}
                project={projectToEdit}
                onClose={() => {
                    setIsProjectModalOpen(false);
                    setProjectToEdit(null);
                }}
            />
        </>
    );
}
