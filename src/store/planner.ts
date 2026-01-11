import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TimeBlock, Habit, FocusSession, DailyGoal } from '@/types';
import {
    tasksApi,
    timeBlocksApi,
    dailyGoalsApi,
    habitsApi,
    focusSessionsApi,
    projectsApi,
    DbTask,
    DbTimeBlock,
    DbDailyGoal,
    DbHabit,
    DbFocusSession,
    DbProject,
    supabase
} from '@/lib/supabase';
import { Project } from '@/types';
import { User } from '@supabase/supabase-js';

interface PlannerState {
    // Auth
    user: User | null;
    setUser: (user: User | null) => void;
    signOut: () => Promise<void>;

    // Loading state
    isLoading: boolean;
    error: string | null;

    // Tasks
    tasks: Task[];
    loadTasks: () => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'order'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    moveTaskToStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
    reorderTasks: (tasks: Task[]) => void;

    // Time Blocks
    timeBlocks: TimeBlock[];
    loadTimeBlocks: () => Promise<void>;
    addTimeBlock: (block: Omit<TimeBlock, 'id'>) => Promise<void>;
    deleteTimeBlock: (id: string) => Promise<void>;

    // Daily Goals
    dailyGoals: DailyGoal[];
    loadDailyGoals: () => Promise<void>;
    addDailyGoal: (title: string, date: string) => Promise<void>;
    toggleDailyGoal: (id: string) => Promise<void>;
    deleteDailyGoal: (id: string) => Promise<void>;

    // Habits
    habits: Habit[];
    loadHabits: () => Promise<void>;
    addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak'>) => Promise<void>;
    deleteHabit: (id: string) => Promise<void>;
    toggleHabitForDate: (id: string, date: string) => Promise<void>;

    // Focus Sessions
    focusSessions: FocusSession[];
    loadFocusSessions: () => Promise<void>;
    startFocusSession: (taskId?: string, type?: 'pomodoro' | 'deepWork') => Promise<string>;
    endFocusSession: (id: string) => Promise<void>;

    // Projects
    projects: Project[];
    loadProjects: () => Promise<void>;
    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    activeProjectId: string | null; // null means 'All'
    setActiveProjectId: (id: string | null) => void;

    // UI State
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeView: 'day' | 'week' | 'month' | 'kanban' | 'timeline' | 'habits' | 'focus' | 'inbox';
    setActiveView: (view: PlannerState['activeView']) => void;

    // Init
    initializeData: () => Promise<void>;
}

// Helper to convert DB types to app types
const dbTaskToTask = (dbTask: DbTask): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || undefined,
    completed: dbTask.completed,
    priority: dbTask.priority,
    category: dbTask.category,
    dueDate: dbTask.due_date || undefined,
    dueTime: dbTask.due_time || undefined,
    estimatedMinutes: dbTask.estimated_minutes || undefined,
    actualMinutes: dbTask.actual_minutes || undefined,
    subtasks: [],
    status: dbTask.status,
    order: dbTask.order,
    project_id: dbTask.project_id || undefined,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
});

const dbTimeBlockToTimeBlock = (db: DbTimeBlock): TimeBlock => ({
    id: db.id,
    title: db.title,
    startTime: db.start_time,
    endTime: db.end_time,
    date: db.date,
    category: db.category,
    color: db.color || undefined,
    taskId: db.task_id || undefined,
    isBlocked: db.is_blocked,
    project_id: db.project_id || undefined,
});

const dbGoalToGoal = (db: DbDailyGoal): DailyGoal => ({
    id: db.id,
    title: db.title,
    completed: db.completed,
    date: db.date,
    order: db.order,
    project_id: db.project_id || undefined,
});

const dbHabitToHabit = (db: DbHabit & { habit_completions?: { completed_date: string }[] }): Habit => {
    const completedDates = db.habit_completions?.map(c => c.completed_date) || [];

    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDates.includes(dateStr)) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    return {
        id: db.id,
        title: db.title,
        icon: db.icon,
        frequency: db.frequency,
        targetCount: db.target_count,
        completedDates,
        streak,
        color: db.color,
    };
};

const dbSessionToSession = (db: DbFocusSession): FocusSession => ({
    id: db.id,
    startTime: db.start_time,
    endTime: db.end_time || undefined,
    duration: db.duration,
    taskId: db.task_id || undefined,
    type: db.type,
    completed: db.completed,
});

const dbProjectToProject = (db: DbProject): Project => ({
    id: db.id,
    title: db.title,
    description: db.description || undefined,
    color: db.color || undefined,
    icon: db.icon || undefined,
    startDate: db.start_date || undefined,
    endDate: db.end_date || undefined,
    type: db.type as Project['type'],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

const getToday = () => new Date().toISOString().split('T')[0];

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isLoading: false,
            error: null,
            tasks: [],
            timeBlocks: [],
            dailyGoals: [],
            habits: [],
            focusSessions: [],
            projects: [],
            activeProjectId: null,
            selectedDate: getToday(),
            sidebarOpen: true,
            activeView: 'day',

            // Auth actions
            setUser: (user) => set({ user }),
            signOut: async () => {
                await supabase.auth.signOut();
                set({ user: null, activeProjectId: null });
            },

            // Initialize all data from Supabase
            initializeData: async () => {
                // Check current session
                const { data: { session } } = await supabase.auth.getSession();
                set({ user: session?.user || null });

                if (!session?.user) {
                    set({ isLoading: false });
                    return;
                }

                set({ isLoading: true, error: null });
                try {
                    await Promise.all([
                        get().loadProjects(),
                        get().loadTasks(),
                        get().loadTimeBlocks(),
                        get().loadDailyGoals(),
                        get().loadHabits(),
                        get().loadFocusSessions(),
                    ]);
                } catch (error) {
                    set({ error: (error as Error).message });
                } finally {
                    set({ isLoading: false });
                }
            },

            // Task actions
            loadTasks: async () => {
                try {
                    const dbTasks = await tasksApi.getAll();
                    set({ tasks: dbTasks.map(dbTaskToTask) });
                } catch (error) {
                    console.error('Failed to load tasks:', error);
                }
            },

            addTask: async (taskData) => {
                try {
                    const tasks = get().tasks;
                    // Use provided project_id if set, otherwise fall back to activeProjectId
                    const projectId = taskData.project_id !== undefined
                        ? taskData.project_id
                        : get().activeProjectId;
                    const dbTask = await tasksApi.create({
                        title: taskData.title,
                        description: taskData.description || null,
                        completed: taskData.completed,
                        priority: taskData.priority,
                        category: taskData.category,
                        due_date: taskData.dueDate || null,
                        due_time: taskData.dueTime || null,
                        estimated_minutes: taskData.estimatedMinutes || null,
                        actual_minutes: taskData.actualMinutes || null,
                        status: taskData.status,
                        order: tasks.filter(t => t.status === taskData.status).length,
                        project_id: projectId || null,
                    });
                    set({ tasks: [...tasks, dbTaskToTask(dbTask)] });
                } catch (error) {
                    console.error('Failed to add task:', error);
                }
            },

            updateTask: async (id, updates) => {
                try {
                    const dbUpdates: Partial<DbTask> = {};
                    if (updates.title !== undefined) dbUpdates.title = updates.title;
                    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
                    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
                    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
                    if (updates.category !== undefined) dbUpdates.category = updates.category;
                    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
                    if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime || null;
                    if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes || null;
                    if (updates.status !== undefined) dbUpdates.status = updates.status;
                    if (updates.order !== undefined) dbUpdates.order = updates.order;
                    if (updates.project_id !== undefined) dbUpdates.project_id = updates.project_id || null;

                    await tasksApi.update(id, dbUpdates);
                    set({
                        tasks: get().tasks.map(t =>
                            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                        ),
                    });
                } catch (error) {
                    console.error('Failed to update task:', error);
                }
            },

            deleteTask: async (id) => {
                try {
                    await tasksApi.delete(id);
                    set({ tasks: get().tasks.filter(t => t.id !== id) });
                } catch (error) {
                    console.error('Failed to delete task:', error);
                }
            },

            toggleTask: async (id) => {
                const task = get().tasks.find(t => t.id === id);
                if (!task) return;

                try {
                    await tasksApi.update(id, { completed: !task.completed });
                    set({
                        tasks: get().tasks.map(t =>
                            t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
                        ),
                    });
                } catch (error) {
                    console.error('Failed to toggle task:', error);
                }
            },

            moveTaskToStatus: async (taskId, newStatus) => {
                const task = get().tasks.find(t => t.id === taskId);
                if (!task) return;

                try {
                    const tasksInNewStatus = get().tasks.filter(t => t.status === newStatus);
                    await tasksApi.update(taskId, {
                        status: newStatus,
                        order: tasksInNewStatus.length,
                        completed: newStatus === 'done',
                    });

                    set({
                        tasks: get().tasks.map(t =>
                            t.id === taskId
                                ? { ...t, status: newStatus, completed: newStatus === 'done', order: tasksInNewStatus.length }
                                : t
                        ),
                    });
                } catch (error) {
                    console.error('Failed to move task:', error);
                }
            },

            reorderTasks: (tasks) => set({ tasks }),

            // Time Block actions
            loadTimeBlocks: async () => {
                try {
                    const dbBlocks = await timeBlocksApi.getAll();
                    set({ timeBlocks: dbBlocks.map(dbTimeBlockToTimeBlock) });
                } catch (error) {
                    console.error('Failed to load time blocks:', error);
                }
            },

            addTimeBlock: async (blockData) => {
                try {
                    const dbBlock = await timeBlocksApi.create({
                        title: blockData.title,
                        start_time: blockData.startTime,
                        end_time: blockData.endTime,
                        date: blockData.date,
                        category: blockData.category,
                        color: blockData.color || null,
                        task_id: blockData.taskId || null,
                        is_blocked: blockData.isBlocked,
                        project_id: get().activeProjectId,
                    });
                    set({ timeBlocks: [...get().timeBlocks, dbTimeBlockToTimeBlock(dbBlock)] });
                } catch (error) {
                    console.error('Failed to add time block:', error);
                }
            },

            deleteTimeBlock: async (id) => {
                try {
                    await timeBlocksApi.delete(id);
                    set({ timeBlocks: get().timeBlocks.filter(b => b.id !== id) });
                } catch (error) {
                    console.error('Failed to delete time block:', error);
                }
            },

            // Daily Goal actions
            loadDailyGoals: async () => {
                try {
                    const dbGoals = await dailyGoalsApi.getAll();
                    set({ dailyGoals: dbGoals.map(dbGoalToGoal) });
                } catch (error) {
                    console.error('Failed to load daily goals:', error);
                }
            },

            addDailyGoal: async (title, date) => {
                const goals = get().dailyGoals.filter(g => g.date === date);
                if (goals.length >= 3) return;

                try {
                    const dbGoal = await dailyGoalsApi.create({
                        title,
                        completed: false,
                        date,
                        order: goals.length,
                        project_id: get().activeProjectId,
                    });
                    set({ dailyGoals: [...get().dailyGoals, dbGoalToGoal(dbGoal)] });
                } catch (error) {
                    console.error('Failed to add daily goal:', error);
                }
            },

            toggleDailyGoal: async (id) => {
                const goal = get().dailyGoals.find(g => g.id === id);
                if (!goal) return;

                try {
                    await dailyGoalsApi.update(id, { completed: !goal.completed });
                    set({
                        dailyGoals: get().dailyGoals.map(g =>
                            g.id === id ? { ...g, completed: !g.completed } : g
                        ),
                    });
                } catch (error) {
                    console.error('Failed to toggle goal:', error);
                }
            },

            deleteDailyGoal: async (id) => {
                try {
                    await dailyGoalsApi.delete(id);
                    set({ dailyGoals: get().dailyGoals.filter(g => g.id !== id) });
                } catch (error) {
                    console.error('Failed to delete goal:', error);
                }
            },

            // Habit actions
            loadHabits: async () => {
                try {
                    const dbHabits = await habitsApi.getAll();
                    set({ habits: dbHabits.map(dbHabitToHabit) });
                } catch (error) {
                    console.error('Failed to load habits:', error);
                }
            },

            addHabit: async (habitData) => {
                try {
                    const dbHabit = await habitsApi.create({
                        title: habitData.title,
                        icon: habitData.icon,
                        frequency: habitData.frequency,
                        target_count: habitData.targetCount,
                        color: habitData.color,
                    });
                    const newHabit: Habit = {
                        ...dbHabitToHabit(dbHabit),
                        completedDates: [],
                        streak: 0,
                    };
                    set({ habits: [...get().habits, newHabit] });
                } catch (error) {
                    console.error('Failed to add habit:', error);
                }
            },

            deleteHabit: async (id) => {
                try {
                    await habitsApi.delete(id);
                    set({ habits: get().habits.filter(h => h.id !== id) });
                } catch (error) {
                    console.error('Failed to delete habit:', error);
                }
            },

            toggleHabitForDate: async (id, date) => {
                try {
                    const added = await habitsApi.toggleCompletion(id, date);

                    set({
                        habits: get().habits.map(h => {
                            if (h.id !== id) return h;

                            const completedDates = added
                                ? [...h.completedDates, date]
                                : h.completedDates.filter(d => d !== date);

                            // Recalculate streak
                            let streak = 0;
                            const today = new Date();
                            for (let i = 0; i < 365; i++) {
                                const checkDate = new Date(today);
                                checkDate.setDate(checkDate.getDate() - i);
                                const dateStr = checkDate.toISOString().split('T')[0];
                                if (completedDates.includes(dateStr)) {
                                    streak++;
                                } else if (i > 0) {
                                    break;
                                }
                            }

                            return { ...h, completedDates, streak };
                        }),
                    });
                } catch (error) {
                    console.error('Failed to toggle habit:', error);
                }
            },

            // Focus Session actions
            loadFocusSessions: async () => {
                try {
                    const dbSessions = await focusSessionsApi.getAll();
                    set({ focusSessions: dbSessions.map(dbSessionToSession) });
                } catch (error) {
                    console.error('Failed to load focus sessions:', error);
                }
            },

            startFocusSession: async (taskId, type = 'pomodoro') => {
                try {
                    const dbSession = await focusSessionsApi.create({
                        start_time: new Date().toISOString(),
                        end_time: null,
                        duration: 0,
                        task_id: taskId || null,
                        type,
                        completed: false,
                    });
                    set({ focusSessions: [...get().focusSessions, dbSessionToSession(dbSession)] });
                    return dbSession.id;
                } catch (error) {
                    console.error('Failed to start focus session:', error);
                    return '';
                }
            },

            endFocusSession: async (id) => {
                const session = get().focusSessions.find(s => s.id === id);
                if (!session) return;

                try {
                    const endTime = new Date().toISOString();
                    const duration = Math.floor(
                        (new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60
                    );

                    await focusSessionsApi.update(id, {
                        end_time: endTime,
                        duration,
                        completed: true,
                    });

                    set({
                        focusSessions: get().focusSessions.map(s =>
                            s.id === id ? { ...s, endTime, duration, completed: true } : s
                        ),
                    });
                } catch (error) {
                    console.error('Failed to end focus session:', error);
                }
            },

            // Project actions
            loadProjects: async () => {
                try {
                    const dbProjects = await projectsApi.getAll();
                    set({ projects: dbProjects.map(dbProjectToProject) });
                } catch (error) {
                    console.error('Failed to load projects:', error);
                }
            },

            addProject: async (projectData) => {
                try {
                    const dbProject = await projectsApi.create({
                        title: projectData.title,
                        description: projectData.description || null,
                        color: projectData.color || null,
                        icon: projectData.icon || null,
                        start_date: projectData.startDate || null,
                        end_date: projectData.endDate || null,
                        type: projectData.type,
                    });
                    set({ projects: [dbProjectToProject(dbProject), ...get().projects] });
                    set({ activeProjectId: dbProject.id });
                } catch (error) {
                    console.error('Failed to add project:', error);
                }
            },

            updateProject: async (id, updates) => {
                try {
                    const dbUpdates: Partial<DbProject> = {};
                    if (updates.title !== undefined) dbUpdates.title = updates.title;
                    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
                    if (updates.color !== undefined) dbUpdates.color = updates.color || null;
                    if (updates.icon !== undefined) dbUpdates.icon = updates.icon || null;
                    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
                    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
                    if (updates.type !== undefined) dbUpdates.type = updates.type;

                    await projectsApi.update(id, dbUpdates);
                    set({
                        projects: get().projects.map(p =>
                            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
                        ),
                    });
                } catch (error) {
                    console.error('Failed to update project:', error);
                }
            },

            deleteProject: async (id) => {
                try {
                    await projectsApi.delete(id);
                    if (get().activeProjectId === id) {
                        set({ activeProjectId: null });
                    }
                    set({
                        projects: get().projects.filter(p => p.id !== id),
                        tasks: get().tasks.map(t => t.project_id === id ? { ...t, project_id: undefined } : t),
                        timeBlocks: get().timeBlocks.map(b => b.project_id === id ? { ...b, project_id: undefined } : b),
                        dailyGoals: get().dailyGoals.map(g => g.project_id === id ? { ...g, project_id: undefined } : g),
                    });
                } catch (error) {
                    console.error('Failed to delete project:', error);
                }
            },

            setActiveProjectId: (id) => set({ activeProjectId: id }),

            // UI actions
            setSelectedDate: (date) => set({ selectedDate: date }),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setActiveView: (view) => set({ activeView: view }),
        }),
        {
            name: 'planner-storage',
            partialize: (state) => ({
                selectedDate: state.selectedDate,
                sidebarOpen: state.sidebarOpen,
                activeView: state.activeView,
                activeProjectId: state.activeProjectId,
            }),
        }
    )
);
