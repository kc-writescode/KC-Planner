'use client';

import { usePlannerStore } from '@/store/planner';
import { Sun, CalendarRange, CheckSquare } from 'lucide-react';
import styles from './BottomNav.module.css';

const navItems = [
    { id: 'inbox', label: 'Inbox', icon: CheckSquare },
    { id: 'day', label: 'Today', icon: Sun },
    { id: 'week', label: 'Upcoming', icon: CalendarRange },
] as const;

export default function BottomNav() {
    const { activeView, setActiveView, setActiveProjectId } = usePlannerStore();

    const handleNavClick = (viewId: string) => {
        setActiveView(viewId as any);
        setActiveProjectId(null);
    };

    return (
        <nav className={styles.bottomNav}>
            <ul className={styles.navList}>
                {navItems.map(({ id, label, icon: Icon }) => (
                    <li key={id}>
                        <button
                            className={`${styles.navItem} ${activeView === id ? styles.active : ''}`}
                            onClick={() => handleNavClick(id)}
                        >
                            <Icon size={22} />
                            <span>{label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
