export interface Project {
    id: string;
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    startDate?: string;
    endDate?: string;
    type: 'trip' | 'work' | 'personal' | 'other';
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: string;
    project_id?: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: 'work' | 'personal' | 'health' | 'learning' | 'social';
    dueDate?: string;
    dueTime?: string;
    estimatedMinutes?: number;
    actualMinutes?: number;
    subtasks: SubTask[];
    status: 'backlog' | 'todo' | 'inProgress' | 'done';
    order: number;
    recurring?: RecurringPattern;
    createdAt: string;
    updatedAt: string;
}

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface RecurringPattern {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
}

export interface TimeBlock {
    id: string;
    project_id?: string;
    title: string;
    startTime: string;
    endTime: string;
    date: string;
    category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'focus' | 'break';
    color?: string;
    taskId?: string;
    isBlocked: boolean;
    recurring?: RecurringPattern;
}

export interface Event {
    id: string;
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    category: 'work' | 'personal' | 'health' | 'learning' | 'social';
    calendarId?: string;
    isAllDay: boolean;
    recurring?: RecurringPattern;
}

export interface Habit {
    id: string;
    title: string;
    icon: string;
    frequency: 'daily' | 'weekly';
    targetCount: number;
    completedDates: string[];
    streak: number;
    color: string;
}

export interface FocusSession {
    id: string;
    startTime: string;
    endTime?: string;
    duration: number;
    taskId?: string;
    type: 'pomodoro' | 'deepWork';
    completed: boolean;
}

export interface DailyGoal {
    id: string;
    project_id?: string;
    title: string;
    completed: boolean;
    date: string;
    order: number;
}

export interface CalendarConnection {
    id: string;
    type: 'google' | 'apple';
    name: string;
    email: string;
    synced: boolean;
    lastSyncAt?: string;
}
