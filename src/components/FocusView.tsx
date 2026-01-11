'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlannerStore } from '@/store/planner';
import { Play, Pause, RotateCcw, Target, Coffee, Clock, Zap } from 'lucide-react';
import styles from './FocusView.module.css';

const POMODORO_WORK = 25 * 60; // 25 minutes
const POMODORO_BREAK = 5 * 60; // 5 minutes
const DEEP_WORK = 90 * 60; // 90 minutes

type TimerMode = 'work' | 'break' | 'deep';

export default function FocusView() {
    const { tasks, focusSessions, startFocusSession, endFocusSession } = usePlannerStore();
    const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<TimerMode>('work');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const incompleteTasks = tasks.filter(t => !t.completed);

    const todaySessions = focusSessions.filter(s => {
        const sessionDate = new Date(s.startTime).toDateString();
        const today = new Date().toDateString();
        return sessionDate === today && s.completed;
    });

    const totalFocusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft]);

    const handleTimerComplete = () => {
        setIsRunning(false);
        if (currentSessionId) {
            endFocusSession(currentSessionId);
            setCurrentSessionId(null);
        }

        // Play notification sound
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Session Complete!', {
                body: mode === 'break' ? 'Break time is over. Ready to focus?' : 'Great work! Time for a break.',
            });
        }

        // Auto switch mode
        if (mode === 'work') {
            setMode('break');
            setTimeLeft(POMODORO_BREAK);
        } else {
            setMode('work');
            setTimeLeft(POMODORO_WORK);
        }
    };

    const toggleTimer = async () => {
        if (!isRunning) {
            const sessionId = await startFocusSession(selectedTaskId || undefined, mode === 'deep' ? 'deepWork' : 'pomodoro');
            setCurrentSessionId(sessionId);
        }
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        if (currentSessionId) {
            endFocusSession(currentSessionId);
            setCurrentSessionId(null);
        }
        setTimeLeft(mode === 'work' ? POMODORO_WORK : mode === 'break' ? POMODORO_BREAK : DEEP_WORK);
    };

    const switchMode = (newMode: TimerMode) => {
        setIsRunning(false);
        if (currentSessionId) {
            endFocusSession(currentSessionId);
            setCurrentSessionId(null);
        }
        setMode(newMode);
        setTimeLeft(newMode === 'work' ? POMODORO_WORK : newMode === 'break' ? POMODORO_BREAK : DEEP_WORK);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = (() => {
        const total = mode === 'work' ? POMODORO_WORK : mode === 'break' ? POMODORO_BREAK : DEEP_WORK;
        return ((total - timeLeft) / total) * 100;
    })();

    return (
        <div className={styles.focusView}>
            <header className={styles.header}>
                <h2 className={styles.title}>Focus Mode</h2>
                <p className={styles.subtitle}>Stay focused and track your deep work sessions</p>
            </header>

            <div className={styles.content}>
                {/* Stats */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <Zap size={20} className={styles.statIcon} />
                        <div>
                            <span className={styles.statValue}>{todaySessions.length}</span>
                            <span className={styles.statLabel}>Sessions</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <Clock size={20} className={styles.statIcon} />
                        <div>
                            <span className={styles.statValue}>{totalFocusMinutes}</span>
                            <span className={styles.statLabel}>Minutes</span>
                        </div>
                    </div>
                </div>

                {/* Timer */}
                <div className={styles.timerSection}>
                    <div className={styles.modeSelector}>
                        <button
                            className={`${styles.modeButton} ${mode === 'work' ? styles.active : ''}`}
                            onClick={() => switchMode('work')}
                        >
                            <Target size={16} />
                            Pomodoro
                        </button>
                        <button
                            className={`${styles.modeButton} ${mode === 'break' ? styles.active : ''}`}
                            onClick={() => switchMode('break')}
                        >
                            <Coffee size={16} />
                            Break
                        </button>
                        <button
                            className={`${styles.modeButton} ${mode === 'deep' ? styles.active : ''}`}
                            onClick={() => switchMode('deep')}
                        >
                            <Zap size={16} />
                            Deep Work
                        </button>
                    </div>

                    <div className={styles.timerContainer}>
                        <svg className={styles.timerRing} viewBox="0 0 200 200">
                            <circle
                                className={styles.timerTrack}
                                cx="100"
                                cy="100"
                                r="90"
                                fill="none"
                                strokeWidth="8"
                            />
                            <circle
                                className={styles.timerProgress}
                                cx="100"
                                cy="100"
                                r="90"
                                fill="none"
                                strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 90}`}
                                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                                style={{
                                    stroke: mode === 'work' ? 'var(--color-accent-primary)' :
                                        mode === 'break' ? 'var(--color-success)' : 'var(--color-warning)'
                                }}
                            />
                        </svg>
                        <div className={styles.timerDisplay}>
                            <span className={styles.timerTime}>{formatTime(timeLeft)}</span>
                            <span className={styles.timerLabel}>
                                {mode === 'work' ? 'Focus Time' : mode === 'break' ? 'Break Time' : 'Deep Work'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.timerControls}>
                        <button className={styles.controlButton} onClick={resetTimer}>
                            <RotateCcw size={20} />
                        </button>
                        <button
                            className={`${styles.playButton} ${isRunning ? styles.pause : ''}`}
                            onClick={toggleTimer}
                        >
                            {isRunning ? <Pause size={28} /> : <Play size={28} />}
                        </button>
                    </div>
                </div>

                {/* Task Selection */}
                <div className={styles.taskSection}>
                    <h3 className={styles.sectionTitle}>Focus on a task</h3>
                    <div className={styles.taskList}>
                        <button
                            className={`${styles.taskOption} ${selectedTaskId === null ? styles.selected : ''}`}
                            onClick={() => setSelectedTaskId(null)}
                        >
                            <span className={styles.taskDot}></span>
                            No specific task
                        </button>
                        {incompleteTasks.slice(0, 5).map(task => (
                            <button
                                key={task.id}
                                className={`${styles.taskOption} ${selectedTaskId === task.id ? styles.selected : ''}`}
                                onClick={() => setSelectedTaskId(task.id)}
                            >
                                <span className={styles.taskDot} style={{ background: 'var(--color-accent-primary)' }}></span>
                                {task.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
