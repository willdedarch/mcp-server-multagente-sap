import { z } from 'zod';

// =====================================================
// ENUMS E CONSTANTES
// =====================================================

export const ProjectStatus = z.enum(['active', 'paused', 'completed', 'archived']);
export const TodoType = z.enum(['feature', 'bug', 'analysis', 'architecture', 'optimization', 'refactor']);
export const Priority = z.enum(['critical', 'high', 'medium', 'low']);
export const TodoStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'blocked']);
export const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']);
export const AnalysisType = z.enum(['flow', 'architecture', 'impact', 'performance', 'security', 'business_rule']);
export const BugSeverity = z.enum(['critical', 'high', 'medium', 'low']);
export const BugStatus = z.enum(['open', 'investigating', 'fixing', 'testing', 'resolved', 'closed', 'wontfix']);
export const ExecutionStatus = z.enum(['success', 'error', 'timeout', 'cancelled']);
export const AgentType = z.enum(['architect', 'developer', 'dba', 'qa', 'business', 'po']);

// =====================================================
// SCHEMAS DE DADOS
// =====================================================

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_name: z.string(),
  client_code: z.string().optional(),
  sap_version: z.string(),
  database_name: z.string(),
  server_name: z.string(),
  company_db: z.string(),
  settings: z.record(z.any()).default({}),
  business_rules: z.record(z.any()).default({}),
  status: ProjectStatus.default('active'),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  created_by: z.string().optional(),
  total_todos: z.number().default(0),
  completed_todos: z.number().default(0),
  total_bugs: z.number().default(0),
  resolved_bugs: z.number().default(0),
});

export const AgentConsensusSchema = z.object({
  architect: z.string().optional(),
  developer: z.string().optional(),
  dba: z.string().optional(),
  qa: z.string().optional(),
  business: z.string().optional(),
  po: z.string().optional(),
});

export const TodoSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: TodoType,
  priority: Priority,
  agent_consensus: AgentConsensusSchema.default({}),
  status: TodoStatus.default('pending'),
  progress_percentage: z.number().min(0).max(100).default(0),
  current_task_index: z.number().default(0),
  parent_todo_id: z.string().optional(),
  related_analysis_id: z.string().optional(),
  created_at: z.date().default(() => new Date()),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  estimated_hours: z.number().optional(),
  actual_hours: z.number().optional(),
  created_by: z.string(),
  assigned_to: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const TaskSchema = z.object({
  id: z.number().optional(),
  todo_id: z.string(),
  sequence_number: z.number(),
  title: z.string(),
  description: z.string().optional(),
  owner_agent: AgentType,
  status: TaskStatus.default('pending'),
  code_snippet: z.string().optional(),
  code_language: z.string().default('csharp'),
  test_scenarios: z.array(z.any()).default([]),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  execution_time_seconds: z.number().optional(),
  error_count: z.number().default(0),
  last_error: z.string().optional(),
  corrections_applied: z.array(z.any()).default([]),
  requires_confirmation: z.boolean().default(true),
  auto_confirmed: z.boolean().default(false),
  confirmed_by: z.string().optional(),
  confirmed_at: z.date().optional(),
  dependencies: z.array(z.number()).default([]),
  completion_criteria: z.array(z.any()).default([]),
});

export const AnalysisSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  type: AnalysisType,
  title: z.string(),
  trigger_command: z.string(),
  summary: z.string(),
  findings: z.record(z.any()).default({}),
  code_snapshot: z.record(z.any()).default({}),
  files_analyzed: z.array(z.string()).default([]),
  total_lines_analyzed: z.number().optional(),
  related_todos: z.array(z.string()).default([]),
  previous_analysis_id: z.string().optional(),
  created_at: z.date().default(() => new Date()),
  expires_at: z.date().optional(),
  is_current: z.boolean().default(true),
  created_by: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const BugSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  todo_id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  error_message: z.string().optional(),
  stack_trace: z.string().optional(),
  severity: BugSeverity,
  category: z.string().optional(),
  status: BugStatus.default('open'),
  steps_to_reproduce: z.array(z.any()).default([]),
  environment: z.record(z.any()).default({}),
  affected_modules: z.array(z.string()).default([]),
  root_cause: z.string().optional(),
  solution_applied: z.string().optional(),
  prevention_measures: z.string().optional(),
  reported_at: z.date().default(() => new Date()),
  reported_by: z.string().optional(),
  assigned_to: z.string().optional(),
  resolved_at: z.date().optional(),
  resolved_by: z.string().optional(),
  related_bugs: z.array(z.string()).default([]),
  caused_by_todo: z.string().optional(),
});

export const ContextStackSchema = z.object({
  id: z.number().optional(),
  project_id: z.string(),
  todo_id: z.string().optional(),
  task_id: z.number().optional(),
  file_path: z.string().optional(),
  line_number: z.number().optional(),
  cursor_position: z.number().optional(),
  working_directory: z.string().optional(),
  open_files: z.array(z.any()).default([]),
  terminal_output: z.string().optional(),
  session_data: z.record(z.any()).default({}),
  next_action: z.string().optional(),
  notes: z.string().optional(),
  saved_at: z.date().default(() => new Date()),
  resumed_at: z.date().optional(),
  is_active: z.boolean().default(false),
  stack_depth: z.number().default(0),
  parent_context_id: z.number().optional(),
});

// =====================================================
// TIPOS DERIVADOS
// =====================================================

export type Project = z.infer<typeof ProjectSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type Bug = z.infer<typeof BugSchema>;
export type ContextStack = z.infer<typeof ContextStackSchema>;
export type AgentConsensus = z.infer<typeof AgentConsensusSchema>;

// =====================================================
// TIPOS DE COMANDOS
// =====================================================

export interface CommandContext {
  projectId: string;
  userId?: string;
  sessionId?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface AgentResponse {
  agent: AgentType;
  response: string;
  confidence: number;
  suggestions?: string[];
}

export interface MultiAgentAnalysis {
  consensus: AgentConsensus;
  responses: AgentResponse[];
  summary: string;
  recommendations: string[];
}

// =====================================================
// TIPOS DE COMANDOS ESPECÍFICOS
// =====================================================

export const CreateCommandSchema = z.object({
  type: TodoType,
  description: z.string(),
  priority: Priority.optional(),
  tags: z.array(z.string()).optional(),
});

export const AnalyzeCommandSchema = z.object({
  type: AnalysisType,
  description: z.string(),
  scope: z.string().optional(),
});

export const ExecuteCommandSchema = z.object({
  taskNumber: z.number(),
  force: z.boolean().optional(),
});

export const ErrorCommandSchema = z.object({
  description: z.string(),
  stackTrace: z.string().optional(),
  screenshot: z.string().optional(),
});

export type CreateCommand = z.infer<typeof CreateCommandSchema>;
export type AnalyzeCommand = z.infer<typeof AnalyzeCommandSchema>;
export type ExecuteCommand = z.infer<typeof ExecuteCommandSchema>;
export type ErrorCommand = z.infer<typeof ErrorCommandSchema>;

// =====================================================
// CONFIGURAÇÕES E CONSTANTES
// =====================================================

export const AGENT_ROLES = {
  architect: {
    name: 'Arquiteto de Soluções',
    emoji: '🏗️',
    focus: 'Soluções simples e pragmáticas',
    question: 'Qual a solução mais simples?',
  },
  developer: {
    name: 'Desenvolvedor Sênior',
    emoji: '💻',
    focus: 'Código REAL que funciona',
    question: 'Como fazer funcionar HOJE?',
  },
  dba: {
    name: 'DBA Especialista',
    emoji: '🗄️',
    focus: 'Performance e integridade',
    question: 'Qual o impacto na performance?',
  },
  qa: {
    name: 'QA Analyst',
    emoji: '🧪',
    focus: 'Edge cases e testes',
    question: 'Onde pode quebrar?',
  },
  business: {
    name: 'Analista de Negócios',
    emoji: '📊',
    focus: 'Processo SAP real',
    question: 'Isso resolve o problema real?',
  },
  po: {
    name: 'Product Owner',
    emoji: '🎯',
    focus: 'Priorização e valor',
    question: 'É isso que devemos fazer agora?',
  },
} as const;

export const DEFAULT_SETTINGS = {
  autoConfirm: false,
  showCode: 'full', // 'full' | 'minimal' | 'none'
  language: 'pt-BR',
  mode: 'standard', // 'standard' | 'expert'
  maxTasksPerTodo: 10,
  analysisExpirationDays: 30,
} as const;

