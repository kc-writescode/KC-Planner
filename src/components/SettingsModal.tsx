'use client';

import { useState, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner';
import {
    X,
    User,
    Bell,
    Clock,
    Palette,
    LogOut,
    ChevronRight,
    Moon,
    Sun,
    Monitor
} from 'lucide-react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'notifications' | 'focus' | 'appearance';

interface Settings {
    theme: 'light' | 'dark' | 'system';
    defaultView: string;
    startOfWeek: 'sunday' | 'monday';
    timeFormat: '12h' | '24h';
    pomodoroWork: number;
    pomodoroBreak: number;
    deepWorkDuration: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    reminderTime: number;
}

const defaultSettings: Settings = {
    theme: 'dark',
    defaultView: 'day',
    startOfWeek: 'sunday',
    timeFormat: '12h',
    pomodoroWork: 25,
    pomodoroBreak: 5,
    deepWorkDuration: 90,
    notificationsEnabled: true,
    soundEnabled: true,
    reminderTime: 15,
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user, signOut } = usePlannerStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('planner-settings');
        if (savedSettings) {
            setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
        }
    }, []);

    // Save settings to localStorage
    const saveSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('planner-settings', JSON.stringify(updated));
    };

    const handleSignOut = async () => {
        setIsSaving(true);
        try {
            await signOut();
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'General', icon: <User size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'focus', label: 'Focus Timer', icon: <Clock size={18} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    ];

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Settings</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Tabs */}
                    <nav className={styles.tabs}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <ChevronRight className={styles.tabArrow} size={16} />
                            </button>
                        ))}
                    </nav>

                    {/* Tab Content */}
                    <div className={styles.tabContent}>
                        {activeTab === 'general' && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Account</h3>
                                <div className={styles.userCard}>
                                    <div className={styles.avatar}>
                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className={styles.userInfo}>
                                        <p className={styles.userEmail}>{user?.email || 'Not signed in'}</p>
                                        <p className={styles.userMeta}>Signed in via Supabase</p>
                                    </div>
                                </div>

                                <h3 className={styles.sectionTitle}>Preferences</h3>

                                <div className={styles.field}>
                                    <label className={styles.label}>Default View</label>
                                    <select
                                        className={styles.select}
                                        value={settings.defaultView}
                                        onChange={e => saveSettings({ defaultView: e.target.value })}
                                    >
                                        <option value="day">Day View</option>
                                        <option value="week">Week View</option>
                                        <option value="month">Month View</option>
                                        <option value="kanban">Kanban Board</option>
                                        <option value="inbox">Inbox</option>
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Start of Week</label>
                                    <select
                                        className={styles.select}
                                        value={settings.startOfWeek}
                                        onChange={e => saveSettings({ startOfWeek: e.target.value as 'sunday' | 'monday' })}
                                    >
                                        <option value="sunday">Sunday</option>
                                        <option value="monday">Monday</option>
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Time Format</label>
                                    <select
                                        className={styles.select}
                                        value={settings.timeFormat}
                                        onChange={e => saveSettings({ timeFormat: e.target.value as '12h' | '24h' })}
                                    >
                                        <option value="12h">12-hour (1:00 PM)</option>
                                        <option value="24h">24-hour (13:00)</option>
                                    </select>
                                </div>

                                <button
                                    className={styles.signOutButton}
                                    onClick={handleSignOut}
                                    disabled={isSaving}
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Notifications</h3>

                                <div className={styles.toggle}>
                                    <div className={styles.toggleInfo}>
                                        <label className={styles.label}>Enable Notifications</label>
                                        <p className={styles.hint}>Receive reminders for tasks and focus sessions</p>
                                    </div>
                                    <button
                                        className={`${styles.toggleSwitch} ${settings.notificationsEnabled ? styles.on : ''}`}
                                        onClick={() => saveSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                                        role="switch"
                                        aria-checked={settings.notificationsEnabled}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>

                                <div className={styles.toggle}>
                                    <div className={styles.toggleInfo}>
                                        <label className={styles.label}>Sound Effects</label>
                                        <p className={styles.hint}>Play sounds for timer completion</p>
                                    </div>
                                    <button
                                        className={`${styles.toggleSwitch} ${settings.soundEnabled ? styles.on : ''}`}
                                        onClick={() => saveSettings({ soundEnabled: !settings.soundEnabled })}
                                        role="switch"
                                        aria-checked={settings.soundEnabled}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Reminder Time</label>
                                    <p className={styles.hint}>How early to remind before due time</p>
                                    <select
                                        className={styles.select}
                                        value={settings.reminderTime}
                                        onChange={e => saveSettings({ reminderTime: parseInt(e.target.value) })}
                                    >
                                        <option value="5">5 minutes before</option>
                                        <option value="10">10 minutes before</option>
                                        <option value="15">15 minutes before</option>
                                        <option value="30">30 minutes before</option>
                                        <option value="60">1 hour before</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'focus' && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Pomodoro Timer</h3>

                                <div className={styles.field}>
                                    <label className={styles.label}>Work Duration</label>
                                    <div className={styles.sliderContainer}>
                                        <input
                                            type="range"
                                            min="15"
                                            max="60"
                                            step="5"
                                            value={settings.pomodoroWork}
                                            onChange={e => saveSettings({ pomodoroWork: parseInt(e.target.value) })}
                                            className={styles.slider}
                                        />
                                        <span className={styles.sliderValue}>{settings.pomodoroWork} min</span>
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Break Duration</label>
                                    <div className={styles.sliderContainer}>
                                        <input
                                            type="range"
                                            min="3"
                                            max="15"
                                            step="1"
                                            value={settings.pomodoroBreak}
                                            onChange={e => saveSettings({ pomodoroBreak: parseInt(e.target.value) })}
                                            className={styles.slider}
                                        />
                                        <span className={styles.sliderValue}>{settings.pomodoroBreak} min</span>
                                    </div>
                                </div>

                                <h3 className={styles.sectionTitle}>Deep Work</h3>

                                <div className={styles.field}>
                                    <label className={styles.label}>Session Duration</label>
                                    <div className={styles.sliderContainer}>
                                        <input
                                            type="range"
                                            min="60"
                                            max="180"
                                            step="15"
                                            value={settings.deepWorkDuration}
                                            onChange={e => saveSettings({ deepWorkDuration: parseInt(e.target.value) })}
                                            className={styles.slider}
                                        />
                                        <span className={styles.sliderValue}>{settings.deepWorkDuration} min</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Theme</h3>

                                <div className={styles.themeOptions}>
                                    <button
                                        className={`${styles.themeOption} ${settings.theme === 'light' ? styles.active : ''}`}
                                        onClick={() => saveSettings({ theme: 'light' })}
                                    >
                                        <Sun size={24} />
                                        <span>Light</span>
                                    </button>
                                    <button
                                        className={`${styles.themeOption} ${settings.theme === 'dark' ? styles.active : ''}`}
                                        onClick={() => saveSettings({ theme: 'dark' })}
                                    >
                                        <Moon size={24} />
                                        <span>Dark</span>
                                    </button>
                                    <button
                                        className={`${styles.themeOption} ${settings.theme === 'system' ? styles.active : ''}`}
                                        onClick={() => saveSettings({ theme: 'system' })}
                                    >
                                        <Monitor size={24} />
                                        <span>System</span>
                                    </button>
                                </div>

                                <p className={styles.themeNote}>
                                    Theme changes will apply automatically
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
