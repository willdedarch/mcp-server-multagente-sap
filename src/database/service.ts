import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '../utils/logger.js';
import type {
  Project,
  Todo,
  Task,
  Analysis,
  Bug,
  ContextStack,
  ProjectStatus,
  TodoStatus,
  TaskStatus,
} from '../types/index.js';

// =====================================================
// TIPOS PARA O BANCO DE DADOS
// =====================================================

interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      todos: {
        Row: Todo;
        Insert: Omit<Todo, 'created_at'>;
        Update: Partial<Omit<Todo, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id'>;
        Update: Partial<Omit<Task, 'id'>>;
      };
      analyses: {
        Row: Analysis;
        Insert: Omit<Analysis, 'created_at'>;
        Update: Partial<Omit<Analysis, 'id' | 'created_at'>>;
      };
      bugs: {
        Row: Bug;
        Insert: Omit<Bug, 'reported_at'>;
        Update: Partial<Omit<Bug, 'id' | 'reported_at'>>;
      };
      context_stack: {
        Row: ContextStack;
        Insert: Omit<ContextStack, 'id' | 'saved_at'>;
        Update: Partial<Omit<ContextStack, 'id' | 'saved_at'>>;
      };
    };
  };
}

// =====================================================
// SERVIÇO DE BANCO DE DADOS
// =====================================================

export class DatabaseService {
  private client: SupabaseClient<Database> | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DatabaseService');
  }

  async connect(): Promise<void> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidas');
      }

      this.client = createClient<Database>(supabaseUrl, supabaseKey);
      
      // Testar conexão
      const { error } = await this.client.from('projects').select('count').limit(1);
      if (error) {
        throw new Error(`Erro ao conectar com Supabase: ${error.message}`);
      }

      this.logger.info('Conectado ao Supabase com sucesso');
    } catch (error) {
      this.logger.error('Erro ao conectar com banco:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Supabase não requer desconexão explícita
    this.client = null;
    this.logger.info('Desconectado do banco');
  }

  private ensureConnected(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error('Banco de dados não conectado');
    }
    return this.client;
  }

  // =====================================================
  // OPERAÇÕES COM PROJETOS
  // =====================================================

  async getProject(id: string): Promise<Project | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Erro ao buscar projeto: ${error.message}`);
    }

    return data;
  }

  async createProject(project: Omit<Project, 'created_at' | 'updated_at'>): Promise<Project> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar projeto: ${error.message}`);
    }

    return data;
  }

  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('projects')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar projeto: ${error.message}`);
    }

    return data;
  }

  async listProjects(status?: ProjectStatus): Promise<Project[]> {
    const client = this.ensureConnected();
    let query = client.from('projects').select('*').order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar projetos: ${error.message}`);
    }

    return data || [];
  }

  // =====================================================
  // OPERAÇÕES COM TODOS
  // =====================================================

  async getTodo(id: string): Promise<Todo | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar TODO: ${error.message}`);
    }

    return data;
  }

  async createTodo(todo: Omit<Todo, 'created_at'>): Promise<Todo> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('todos')
      .insert(todo)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar TODO: ${error.message}`);
    }

    return data;
  }

  async updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'created_at'>>): Promise<Todo> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar TODO: ${error.message}`);
    }

    return data;
  }

  async listTodos(projectId: string, status?: TodoStatus): Promise<Todo[]> {
    const client = this.ensureConnected();
    let query = client
      .from('todos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar TODOs: ${error.message}`);
    }

    return data || [];
  }

  async getActiveTodo(projectId: string): Promise<Todo | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('todos')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar TODO ativo: ${error.message}`);
    }

    return data;
  }

  // =====================================================
  // OPERAÇÕES COM TASKS
  // =====================================================

  async getTask(id: number): Promise<Task | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar task: ${error.message}`);
    }

    return data;
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar task: ${error.message}`);
    }

    return data;
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id'>>): Promise<Task> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar task: ${error.message}`);
    }

    return data;
  }

  async listTasks(todoId: string, status?: TaskStatus): Promise<Task[]> {
    const client = this.ensureConnected();
    let query = client
      .from('tasks')
      .select('*')
      .eq('todo_id', todoId)
      .order('sequence_number', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar tasks: ${error.message}`);
    }

    return data || [];
  }

  async getCurrentTask(todoId: string): Promise<Task | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('todo_id', todoId)
      .eq('status', 'in_progress')
      .order('sequence_number', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar task atual: ${error.message}`);
    }

    return data;
  }

  async getNextTask(todoId: string, currentSequence: number): Promise<Task | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('todo_id', todoId)
      .eq('status', 'pending')
      .gt('sequence_number', currentSequence)
      .order('sequence_number', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar próxima task: ${error.message}`);
    }

    return data;
  }

  // =====================================================
  // OPERAÇÕES COM ANÁLISES
  // =====================================================

  async createAnalysis(analysis: Omit<Analysis, 'created_at'>): Promise<Analysis> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('analyses')
      .insert(analysis)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar análise: ${error.message}`);
    }

    return data;
  }

  async getAnalysis(id: string): Promise<Analysis | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar análise: ${error.message}`);
    }

    return data;
  }

  async searchAnalyses(projectId: string, query: string): Promise<Analysis[]> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_current', true)
      .textSearch('search_vector', query)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar análises: ${error.message}`);
    }

    return data || [];
  }

  // =====================================================
  // OPERAÇÕES COM CONTEXTO
  // =====================================================

  async saveContext(context: Omit<ContextStack, 'id' | 'saved_at'>): Promise<ContextStack> {
    const client = this.ensureConnected();
    
    // Desativar contextos anteriores
    await client
      .from('context_stack')
      .update({ is_active: false })
      .eq('project_id', context.project_id);

    const { data, error } = await client
      .from('context_stack')
      .insert({ ...context, is_active: true })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar contexto: ${error.message}`);
    }

    return data;
  }

  async getActiveContext(projectId: string): Promise<ContextStack | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('context_stack')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('saved_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar contexto ativo: ${error.message}`);
    }

    return data;
  }

  // =====================================================
  // OPERAÇÕES COM BUGS
  // =====================================================

  async createBug(bug: Omit<Bug, 'reported_at'>): Promise<Bug> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('bugs')
      .insert(bug)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar bug: ${error.message}`);
    }

    return data;
  }

  async updateBug(id: string, updates: Partial<Omit<Bug, 'id' | 'reported_at'>>): Promise<Bug> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('bugs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar bug: ${error.message}`);
    }

    return data;
  }

  async listBugs(projectId: string, status?: string): Promise<Bug[]> {
    const client = this.ensureConnected();
    let query = client
      .from('bugs')
      .select('*')
      .eq('project_id', projectId)
      .order('reported_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar bugs: ${error.message}`);
    }

    return data || [];
  }

  // =====================================================
  // ESTATÍSTICAS E MÉTRICAS
  // =====================================================

  async getProjectStats(projectId: string): Promise<{
    totalTodos: number;
    completedTodos: number;
    totalTasks: number;
    completedTasks: number;
    totalBugs: number;
    resolvedBugs: number;
    activeAnalyses: number;
  }> {
    const client = this.ensureConnected();

    // Buscar todos os TODOs do projeto
    const todosResult = await client.from('todos').select('id, status').eq('project_id', projectId);
    const todos = todosResult.data || [];
    const todoIds = todos.map(t => t.id);

    // Buscar tasks dos TODOs
    let tasksResult = { data: [] as any[] };
    if (todoIds.length > 0) {
      tasksResult = await client.from('tasks').select('status').in('todo_id', todoIds);
    }

    const [bugsResult, analysesResult] = await Promise.all([
      client.from('bugs').select('status').eq('project_id', projectId),
      client.from('analyses').select('is_current').eq('project_id', projectId).eq('is_current', true),
    ]);

    const tasks = tasksResult.data || [];
    const bugs = bugsResult.data || [];
    const analyses = analysesResult.data || [];

    return {
      totalTodos: todos.length,
      completedTodos: todos.filter(t => t.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalBugs: bugs.length,
      resolvedBugs: bugs.filter(b => ['resolved', 'closed'].includes(b.status)).length,
      activeAnalyses: analyses.length,
    };
  }

  // =====================================================
  // MÉTODOS ADICIONAIS PARA CONTEXTO
  // =====================================================

  async updateContext(id: number, updates: Partial<Omit<ContextStack, 'id' | 'saved_at'>>): Promise<ContextStack> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('context_stack')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar contexto: ${error.message}`);
    }

    return data;
  }

  async getContext(id: number): Promise<ContextStack | null> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('context_stack')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Erro ao buscar contexto: ${error.message}`);
    }

    return data;
  }

  async getContextHistory(projectId: string, limit: number = 10): Promise<ContextStack[]> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('context_stack')
      .select('*')
      .eq('project_id', projectId)
      .order('saved_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erro ao buscar histórico de contexto: ${error.message}`);
    }

    return data || [];
  }

  async deleteOldContexts(projectId: string, cutoffDate: Date): Promise<number> {
    const client = this.ensureConnected();
    const { data, error } = await client
      .from('context_stack')
      .delete()
      .eq('project_id', projectId)
      .eq('is_active', false)
      .lt('saved_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Erro ao deletar contextos antigos: ${error.message}`);
    }

    return data?.length || 0;
  }
}

