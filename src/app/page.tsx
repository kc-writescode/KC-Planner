'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlannerStore } from '@/store/planner';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DayView from '@/components/DayView';
import KanbanBoard from '@/components/KanbanBoard';
import InboxView from '@/components/InboxView';
import HabitsView from '@/components/HabitsView';
import FocusView from '@/components/FocusView';
import WeekView from '@/components/WeekView';
import MonthView from '@/components/MonthView';
import QuickAdd from '@/components/QuickAdd';
import ProjectView from '@/components/ProjectView';
import AuthComponent from '@/components/Auth';
import CommandPalette from '@/components/CommandPalette';
import SettingsModal from '@/components/SettingsModal';
import { ToastProvider } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { Search, Command } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const {
    activeView,
    activeProjectId,
    sidebarOpen,
    setSidebarOpen,
    setActiveView,
    initializeData,
    isLoading,
    error
  } = usePlannerStore();

  const [mounted, setMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    setMounted(true);
    initializeData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      usePlannerStore.getState().setUser(session?.user || null);
      if (session?.user) {
        usePlannerStore.getState().initializeData();
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeData]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }

      // Quick add: Cmd/Ctrl + Shift + A or just 'n' key
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }

      // Settings: Cmd/Ctrl + ,
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }

      // View shortcuts (single keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            setActiveView('day');
            break;
          case 'w':
            e.preventDefault();
            setActiveView('week');
            break;
          case 'm':
            e.preventDefault();
            setActiveView('month');
            break;
          case 'k':
            e.preventDefault();
            setActiveView('kanban');
            break;
          case 'i':
            e.preventDefault();
            setActiveView('inbox');
            break;
          case 'h':
            e.preventDefault();
            setActiveView('habits');
            break;
          case 'f':
            e.preventDefault();
            setActiveView('focus');
            break;
          case 'n':
            e.preventDefault();
            setQuickAddOpen(true);
            break;
          case '/':
            e.preventDefault();
            setCommandPaletteOpen(true);
            break;
          case 'escape':
            if (sidebarOpen) {
              setSidebarOpen(false);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, sidebarOpen, setSidebarOpen]);

  const handleOpenQuickAdd = useCallback(() => {
    setQuickAddOpen(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  if (!mounted) return null;

  if (!usePlannerStore.getState().user) {
    return (
      <ToastProvider>
        <AuthComponent />
      </ToastProvider>
    );
  }

  if (isLoading) {
    return (
      <ToastProvider>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Syncing with database...</p>
        </div>
      </ToastProvider>
    );
  }

  if (error) {
    return (
      <ToastProvider>
        <div className={styles.loading}>
          <p style={{ color: 'var(--color-error)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={() => initializeData()}>
            Retry
          </button>
        </div>
      </ToastProvider>
    );
  }

  const renderView = () => {
    // If a project is active, prioritize the Project Workspace
    if (activeProjectId) {
      return <ProjectView />;
    }

    switch (activeView) {
      case 'inbox':
        return <InboxView />;
      case 'day':
        return <DayView />;
      case 'week':
        return <WeekView />;
      case 'month':
        return <MonthView />;
      case 'kanban':
        return <KanbanBoard />;
      case 'habits':
        return <HabitsView />;
      case 'focus':
        return <FocusView />;
      default:
        return <DayView />;
    }
  };

  return (
    <ToastProvider>
      <div className={styles.appContainer}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenSettings={handleOpenSettings} />

        <main className={`${styles.mainContent} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <header className={styles.header}>
            <button
              className={styles.menuButton}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className={`${styles.logo} ${sidebarOpen ? styles.logoSidebarOpen : ''}`}>Perfect Planner</h1>

            {/* Search button for quick access */}
            <button
              className={styles.searchButton}
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Open command palette"
              title="Search (⌘K or /)"
            >
              <Search size={18} />
              <span className={styles.searchHint}>
                <Command size={12} />K
              </span>
            </button>
          </header>

          <div className={styles.viewContainer}>
            {renderView()}
          </div>
        </main>

        <QuickAdd isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
        <BottomNav />

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOpenSettings={handleOpenSettings}
          onOpenQuickAdd={handleOpenQuickAdd}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}
