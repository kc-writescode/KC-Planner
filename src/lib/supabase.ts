import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Deployment might fail or functionality will be limited.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Database types
export interface DbProject {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  start_date: string | null;
  end_date: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  user_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'work' | 'personal' | 'health' | 'learning' | 'social';
  due_date: string | null;
  due_time: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  status: 'backlog' | 'todo' | 'inProgress' | 'done';
  order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTimeBlock {
  id: string;
  user_id: string | null;
  project_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  date: string;
  category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'focus' | 'break';
  color: string | null;
  task_id: string | null;
  is_blocked: boolean;
  created_at: string;
}

export interface DbDailyGoal {
  id: string;
  user_id: string | null;
  project_id: string | null;
  title: string;
  completed: boolean;
  date: string;
  order: number;
  created_at: string;
}

export interface DbHabit {
  id: string;
  user_id: string | null;
  title: string;
  icon: string;
  frequency: 'daily' | 'weekly';
  target_count: number;
  color: string;
  created_at: string;
}

export interface DbHabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}

export interface DbFocusSession {
  id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  task_id: string | null;
  type: 'pomodoro' | 'deepWork';
  completed: boolean;
  created_at: string;
}

// Tasks API
export const projectsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as DbProject[];
  },
  async create(project: Partial<DbProject>) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    if (error) throw error;
    return data as DbProject;
  },
  async update(id: string, updates: Partial<DbProject>) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as DbProject;
  },
  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const tasksApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return data as DbTask[];
  },

  async create(task: Omit<DbTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;
    return data as DbTask;
  },

  async update(id: string, updates: Partial<DbTask>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as DbTask;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
};

// Time Blocks API
export const timeBlocksApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('time_blocks')
      .select('*')
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data as DbTimeBlock[];
  },

  async create(block: Omit<DbTimeBlock, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('time_blocks')
      .insert(block)
      .select()
      .single();
    if (error) throw error;
    return data as DbTimeBlock;
  },

  async delete(id: string) {
    const { error } = await supabase.from('time_blocks').delete().eq('id', id);
    if (error) throw error;
  },
};

// Daily Goals API
export const dailyGoalsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .order('order', { ascending: true });
    if (error) throw error;
    return data as DbDailyGoal[];
  },

  async create(goal: Omit<DbDailyGoal, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('daily_goals')
      .insert(goal)
      .select()
      .single();
    if (error) throw error;
    return data as DbDailyGoal;
  },

  async update(id: string, updates: Partial<DbDailyGoal>) {
    const { data, error } = await supabase
      .from('daily_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as DbDailyGoal;
  },

  async delete(id: string) {
    const { error } = await supabase.from('daily_goals').delete().eq('id', id);
    if (error) throw error;
  },
};

// Habits API
export const habitsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('habits')
      .select('*, habit_completions(completed_date)');
    if (error) throw error;
    return data;
  },

  async create(habit: Omit<DbHabit, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();
    if (error) throw error;
    return data as DbHabit;
  },

  async delete(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleCompletion(habitId: string, date: string) {
    // Check if completion exists
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .eq('completed_date', date)
      .single();

    if (existing) {
      // Remove completion
      await supabase.from('habit_completions').delete().eq('id', existing.id);
      return false;
    } else {
      // Add completion
      await supabase.from('habit_completions').insert({
        habit_id: habitId,
        completed_date: date,
      });
      return true;
    }
  },
};

// Focus Sessions API
export const focusSessionsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .order('start_time', { ascending: false });
    if (error) throw error;
    return data as DbFocusSession[];
  },

  async create(session: Omit<DbFocusSession, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(session)
      .select()
      .single();
    if (error) throw error;
    return data as DbFocusSession;
  },

  async update(id: string, updates: Partial<DbFocusSession>) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as DbFocusSession;
  },
};
