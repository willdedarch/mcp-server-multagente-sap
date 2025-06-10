import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/service.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import { ContextManager } from '../utils/context.js';
import { Logger } from '../utils/logger.js';
import type {
  CommandContext,
  CommandResult,
  CreateCommand,
  AnalyzeCommand,
  ExecuteCommand,
  ErrorCommand,
  Todo,
  Task,
  Analysis,
  Bug,
  TodoType,
  Priority,
  AnalysisType,
  AgentType,
} from '../types/index.js';

// =====================================================
// PROCESSADOR DE COMANDOS
// =====================================================

export class CommandProcessor {
  private db: DatabaseService;
  private orchestrator: AgentOrchestrator;
  private contextManager: ContextManager;
  private logger: Logger;

  constructor(
    db: DatabaseService,
    orchestrator: AgentOrchestrator,
    contextManager: ContextManager
  ) {
    this.db = db;
    this.orchestrator = orchestrator;
    this.contextManager = contextManager;
    this.logger = new Logger('CommandProcessor');
  }

  // =====================================================
  // COMANDO /analise
  // =====================================================

  async handleAnalyze(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /analise');

      const { description, type = 'flow', scope } = args;

      if (!description) {
        return {
          success: false,
          message: 'Descrição é obrigatória para análise',
          error: 'Parâmetro description não fornecido'
        };
      }

      // Verificar se já existe análise similar recente
      const existingAnalyses = await this.db.searchAnalyses(context.projectId, description);
      const recentAnalysis = existingAnalyses.find(a => {
        const daysDiff = (Date.now() - a.created_at.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 7; // Análise dos últimos 7 dias
      });

      if (recentAnalysis) {
        return {
          success: true,
          message: 'Análise similar encontrada (últimos 7 dias)',
          data: {
            formatted: this.formatAnalysisResult(recentAnalysis),
            analysis: recentAnalysis
          }
        };
      }

      // Executar nova análise
      const analysisRequest = {
        projectId: context.projectId,
        description,
        type: 'analyze' as const,
        codeContext: scope,
      };

      const multiAgentAnalysis = await this.orchestrator.analyzeWithAllAgents(analysisRequest);

      // Salvar análise no banco
      const analysisId = `ANALYSIS-${Date.now()}`;
      const analysis: Omit<Analysis, 'created_at'> = {
        id: analysisId,
        project_id: context.projectId,
        type: type as AnalysisType,
        title: description.substring(0, 300),
        trigger_command: `/analise ${description}`,
        summary: multiAgentAnalysis.summary,
        findings: {
          consensus: multiAgentAnalysis.consensus,
          responses: multiAgentAnalysis.responses,
          recommendations: multiAgentAnalysis.recommendations,
        },
        code_snapshot: scope ? { scope } : {},
        files_analyzed: [],
        total_lines_analyzed: 0,
        related_todos: [],
        previous_analysis_id: undefined,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        is_current: true,
        created_by: context.userId,
        tags: [type],
      };

      const savedAnalysis = await this.db.createAnalysis(analysis);

      return {
        success: true,
        message: `Análise ${type} concluída e salva`,
        data: {
          formatted: this.formatAnalysisResult(savedAnalysis),
          analysis: savedAnalysis,
          multiAgentAnalysis
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /analise:', error);
      return {
        success: false,
        message: 'Erro ao executar análise',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDO /criar
  // =====================================================

  async handleCreate(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /criar');

      const { type, description, priority = 'medium', tags = [] } = args;

      if (!type || !description) {
        return {
          success: false,
          message: 'Tipo e descrição são obrigatórios',
          error: 'Parâmetros type e description não fornecidos'
        };
      }

      // Executar análise multi-agente
      const analysisRequest = {
        projectId: context.projectId,
        description,
        type: 'create' as const,
      };

      const multiAgentAnalysis = await this.orchestrator.analyzeWithAllAgents(analysisRequest);

      // Criar TODO
      const todoId = `TODO-${Date.now()}`;
      const todo: Omit<Todo, 'created_at'> = {
        id: todoId,
        project_id: context.projectId,
        title: description.substring(0, 500),
        description,
        type: type as TodoType,
        priority: priority as Priority,
        agent_consensus: multiAgentAnalysis.consensus,
        status: 'pending',
        progress_percentage: 0,
        current_task_index: 0,
        parent_todo_id: undefined,
        related_analysis_id: undefined,
        started_at: undefined,
        completed_at: undefined,
        estimated_hours: undefined,
        actual_hours: undefined,
        created_by: `/criar ${type}`,
        assigned_to: context.userId,
        tags: [...tags, type],
      };

      const savedTodo = await this.db.createTodo(todo);

      // Gerar tasks baseadas na análise
      const tasks = await this.generateTasksFromAnalysis(savedTodo, multiAgentAnalysis);

      // Salvar tasks
      const savedTasks: Task[] = [];
      for (const task of tasks) {
        const savedTask = await this.db.createTask(task);
        savedTasks.push(savedTask);
      }

      // Salvar contexto inicial
      await this.contextManager.saveContext({
        project_id: context.projectId,
        todo_id: todoId,
        task_id: savedTasks[0]?.id,
        next_action: 'Revisar TODO criado e executar primeira task',
        session_data: {
          multiAgentAnalysis,
          createdAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        message: `TODO ${type} criado com ${savedTasks.length} tasks`,
        data: {
          formatted: this.formatTodoCreationResult(savedTodo, savedTasks, multiAgentAnalysis),
          todo: savedTodo,
          tasks: savedTasks,
          analysis: multiAgentAnalysis
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /criar:', error);
      return {
        success: false,
        message: 'Erro ao criar TODO',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDO /executar
  // =====================================================

  async handleExecute(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /executar');

      const { taskNumber, force = false } = args;

      if (!taskNumber) {
        return {
          success: false,
          message: 'Número da task é obrigatório',
          error: 'Parâmetro taskNumber não fornecido'
        };
      }

      // Buscar TODO ativo
      const activeTodo = await this.db.getActiveTodo(context.projectId);
      if (!activeTodo) {
        return {
          success: false,
          message: 'Nenhum TODO ativo encontrado',
          error: 'Execute /continuar para retomar ou /criar para novo TODO'
        };
      }

      // Buscar tasks do TODO
      const tasks = await this.db.listTasks(activeTodo.id);
      const targetTask = tasks.find(t => t.sequence_number === taskNumber);

      if (!targetTask) {
        return {
          success: false,
          message: `Task ${taskNumber} não encontrada`,
          error: `TODO ${activeTodo.id} possui ${tasks.length} tasks`
        };
      }

      // Verificar dependências
      if (!force && targetTask.dependencies.length > 0) {
        const pendingDependencies = await this.checkTaskDependencies(targetTask);
        if (pendingDependencies.length > 0) {
          return {
            success: false,
            message: `Task ${taskNumber} possui dependências pendentes`,
            error: `Dependências: ${pendingDependencies.join(', ')}`
          };
        }
      }

      // Executar task
      const executionResult = await this.executeTask(targetTask, activeTodo, context);

      // Atualizar progresso do TODO
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const progressPercentage = Math.round((completedTasks / tasks.length) * 100);

      await this.db.updateTodo(activeTodo.id, {
        progress_percentage: progressPercentage,
        current_task_index: taskNumber,
      });

      return {
        success: true,
        message: `Task ${taskNumber} executada`,
        data: {
          formatted: this.formatTaskExecutionResult(targetTask, executionResult),
          task: targetTask,
          execution: executionResult,
          progress: progressPercentage
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /executar:', error);
      return {
        success: false,
        message: 'Erro ao executar task',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDO /confirmar
  // =====================================================

  async handleConfirm(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /confirmar');

      const { notes } = args;

      // Buscar task atual em execução
      const activeContext = await this.contextManager.getActiveContext(context.projectId);
      if (!activeContext || !activeContext.task_id) {
        return {
          success: false,
          message: 'Nenhuma task ativa para confirmar',
          error: 'Execute uma task primeiro com /executar'
        };
      }

      const task = await this.db.getTask(activeContext.task_id);
      if (!task) {
        return {
          success: false,
          message: 'Task não encontrada',
          error: `Task ID: ${activeContext.task_id}`
        };
      }

      if (task.status !== 'in_progress') {
        return {
          success: false,
          message: 'Task não está em execução',
          error: `Status atual: ${task.status}`
        };
      }

      // Confirmar task
      await this.db.updateTask(task.id!, {
        status: 'completed',
        completed_at: new Date(),
        confirmed_by: context.userId,
        confirmed_at: new Date(),
      });

      // Buscar próxima task
      const todo = await this.db.getTodo(task.todo_id);
      const nextTask = await this.db.getNextTask(task.todo_id, task.sequence_number);

      let nextAction = 'TODO concluído!';
      if (nextTask) {
        nextAction = `Próxima task: ${nextTask.sequence_number} - ${nextTask.title}`;
      } else if (todo) {
        // Verificar se TODO está completo
        const allTasks = await this.db.listTasks(todo.id);
        const completedTasks = allTasks.filter(t => t.status === 'completed');
        
        if (completedTasks.length === allTasks.length) {
          await this.db.updateTodo(todo.id, {
            status: 'completed',
            completed_at: new Date(),
            progress_percentage: 100,
          });
          nextAction = 'TODO concluído com sucesso! 🎉';
        }
      }

      // Atualizar contexto
      await this.contextManager.saveContext({
        project_id: context.projectId,
        todo_id: task.todo_id,
        task_id: nextTask?.id,
        next_action: nextAction,
        notes: notes || 'Task confirmada pelo usuário',
        session_data: {
          confirmedAt: new Date().toISOString(),
          confirmedBy: context.userId,
        },
      });

      return {
        success: true,
        message: 'Task confirmada com sucesso',
        data: {
          formatted: this.formatConfirmationResult(task, nextTask, nextAction),
          confirmedTask: task,
          nextTask,
          nextAction
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /confirmar:', error);
      return {
        success: false,
        message: 'Erro ao confirmar task',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDO /erro
  // =====================================================

  async handleError(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /erro');

      const { description, stackTrace, screenshot } = args;

      if (!description) {
        return {
          success: false,
          message: 'Descrição do erro é obrigatória',
          error: 'Parâmetro description não fornecido'
        };
      }

      // Buscar task atual
      const activeContext = await this.contextManager.getActiveContext(context.projectId);
      const currentTask = activeContext?.task_id ? await this.db.getTask(activeContext.task_id) : null;

      // Criar bug report
      const bugId = `BUG-${Date.now()}`;
      const bug: Omit<Bug, 'reported_at'> = {
        id: bugId,
        project_id: context.projectId,
        todo_id: currentTask?.todo_id,
        title: description.substring(0, 300),
        description,
        error_message: stackTrace,
        stack_trace: stackTrace,
        severity: 'medium',
        category: 'Logic',
        status: 'open',
        steps_to_reproduce: [],
        environment: {
          timestamp: new Date().toISOString(),
          context: activeContext,
          screenshot: screenshot ? 'Provided' : 'Not provided',
        },
        affected_modules: [],
        root_cause: undefined,
        solution_applied: undefined,
        prevention_measures: undefined,
        reported_by: context.userId,
        assigned_to: undefined,
        resolved_at: undefined,
        resolved_by: undefined,
        related_bugs: [],
        caused_by_todo: currentTask?.todo_id,
      };

      const savedBug = await this.db.createBug(bug);

      // Analisar erro com agentes
      const errorAnalysisRequest = {
        projectId: context.projectId,
        description: `ERRO: ${description}${stackTrace ? `\n\nStack Trace:\n${stackTrace}` : ''}`,
        type: 'analyze' as const,
        task: currentTask || undefined,
      };

      const errorAnalysis = await this.orchestrator.analyzeWithSpecificAgents(
        errorAnalysisRequest,
        ['developer', 'qa', 'architect']
      );

      // Atualizar task com erro
      if (currentTask) {
        await this.db.updateTask(currentTask.id!, {
          status: 'failed',
          error_count: (currentTask.error_count || 0) + 1,
          last_error: description,
          corrections_applied: [
            ...(currentTask.corrections_applied || []),
            {
              timestamp: new Date().toISOString(),
              error: description,
              analysis: errorAnalysis.summary,
            }
          ],
        });
      }

      return {
        success: true,
        message: 'Erro reportado e analisado',
        data: {
          formatted: this.formatErrorAnalysisResult(savedBug, errorAnalysis),
          bug: savedBug,
          analysis: errorAnalysis,
          task: currentTask
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /erro:', error);
      return {
        success: false,
        message: 'Erro ao processar erro reportado',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDO /continuar
  // =====================================================

  async handleContinue(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /continuar');

      // Buscar contexto ativo
      const activeContext = await this.contextManager.getActiveContext(context.projectId);
      
      if (!activeContext) {
        return {
          success: false,
          message: 'Nenhum contexto ativo encontrado',
          error: 'Inicie um novo TODO com /criar'
        };
      }

      // Buscar TODO e task atuais
      const todo = activeContext.todo_id ? await this.db.getTodo(activeContext.todo_id) : null;
      const task = activeContext.task_id ? await this.db.getTask(activeContext.task_id) : null;

      if (!todo) {
        return {
          success: false,
          message: 'TODO do contexto não encontrado',
          error: 'Contexto pode estar corrompido'
        };
      }

      // Buscar todas as tasks do TODO
      const allTasks = await this.db.listTasks(todo.id);
      const pendingTasks = allTasks.filter(t => t.status === 'pending');
      const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
      const completedTasks = allTasks.filter(t => t.status === 'completed');

      // Atualizar status do TODO se necessário
      if (todo.status === 'pending' && (inProgressTasks.length > 0 || completedTasks.length > 0)) {
        await this.db.updateTodo(todo.id, { status: 'in_progress' });
      }

      return {
        success: true,
        message: 'Contexto recuperado com sucesso',
        data: {
          formatted: this.formatContinueResult(todo, task, allTasks, activeContext),
          todo,
          currentTask: task,
          allTasks,
          context: activeContext,
          summary: {
            total: allTasks.length,
            completed: completedTasks.length,
            inProgress: inProgressTasks.length,
            pending: pendingTasks.length,
          }
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /continuar:', error);
      return {
        success: false,
        message: 'Erro ao recuperar contexto',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDO /status
  // =====================================================

  async handleStatus(args: any, context: CommandContext): Promise<CommandResult> {
    try {
      this.logger.info('Executando comando /status');

      const { detailed = false } = args;

      // Buscar estatísticas do projeto
      const stats = await this.db.getProjectStats(context.projectId);
      
      // Buscar TODOs ativos
      const activeTodos = await this.db.listTodos(context.projectId, 'in_progress');
      const pendingTodos = await this.db.listTodos(context.projectId, 'pending');
      const completedTodos = await this.db.listTodos(context.projectId, 'completed');
      
      // Buscar bugs abertos
      const openBugs = await this.db.listBugs(context.projectId, 'open');
      
      // Buscar contexto ativo
      const activeContext = await this.contextManager.getActiveContext(context.projectId);

      const statusData = {
        project: {
          id: context.projectId,
          stats,
        },
        todos: {
          active: activeTodos.length,
          pending: pendingTodos.length,
          completed: completedTodos.length,
          total: stats.totalTodos,
        },
        tasks: {
          completed: stats.completedTasks,
          total: stats.totalTasks,
        },
        bugs: {
          open: openBugs.length,
          resolved: stats.resolvedBugs,
          total: stats.totalBugs,
        },
        context: activeContext ? {
          todoId: activeContext.todo_id,
          taskId: activeContext.task_id,
          nextAction: activeContext.next_action,
        } : null,
      };

      return {
        success: true,
        message: 'Status do projeto',
        data: {
          formatted: this.formatStatusResult(statusData, detailed),
          ...statusData,
          detailed: detailed ? {
            activeTodos,
            pendingTodos,
            openBugs,
            activeContext,
          } : undefined,
        }
      };

    } catch (error) {
      this.logger.error('Erro no comando /status:', error);
      return {
        success: false,
        message: 'Erro ao obter status',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // =====================================================
  // COMANDOS AUXILIARES (implementação básica)
  // =====================================================

  async handleReview(args: any, context: CommandContext): Promise<CommandResult> {
    // TODO: Implementar code review automático
    return {
      success: true,
      message: 'Funcionalidade de review em desenvolvimento',
      data: { formatted: 'Code review será implementado em versão futura' }
    };
  }

  async handleTest(args: any, context: CommandContext): Promise<CommandResult> {
    // TODO: Implementar geração de testes
    return {
      success: true,
      message: 'Funcionalidade de testes em desenvolvimento',
      data: { formatted: 'Geração de testes será implementada em versão futura' }
    };
  }

  async handleDoc(args: any, context: CommandContext): Promise<CommandResult> {
    // TODO: Implementar geração de documentação
    return {
      success: true,
      message: 'Funcionalidade de documentação em desenvolvimento',
      data: { formatted: 'Geração de documentação será implementada em versão futura' }
    };
  }

  async handleQuick(args: any, context: CommandContext): Promise<CommandResult> {
    // TODO: Implementar correção rápida
    return {
      success: true,
      message: 'Funcionalidade de correção rápida em desenvolvimento',
      data: { formatted: 'Correção rápida será implementada em versão futura' }
    };
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private async generateTasksFromAnalysis(todo: Todo, analysis: any): Promise<Omit<Task, 'id'>[]> {
    const tasks: Omit<Task, 'id'>[] = [];
    
    // Gerar tasks baseadas no consenso dos agentes
    const { consensus } = analysis;
    
    // Task 1: Análise e planejamento (sempre presente)
    tasks.push({
      todo_id: todo.id,
      sequence_number: 1,
      title: 'Análise detalhada e planejamento',
      description: 'Revisar análise multi-agente e definir abordagem técnica',
      owner_agent: 'architect',
      status: 'pending',
      code_snippet: undefined,
      code_language: 'markdown',
      test_scenarios: [],
      started_at: undefined,
      completed_at: undefined,
      execution_time_seconds: undefined,
      error_count: 0,
      last_error: undefined,
      corrections_applied: [],
      requires_confirmation: true,
      auto_confirmed: false,
      confirmed_by: undefined,
      confirmed_at: undefined,
      dependencies: [],
      completion_criteria: ['Análise revisada', 'Abordagem definida'],
    });

    // Task 2: Implementação (baseada no desenvolvedor)
    if (consensus.developer) {
      tasks.push({
        todo_id: todo.id,
        sequence_number: 2,
        title: 'Implementação da solução',
        description: consensus.developer,
        owner_agent: 'developer',
        status: 'pending',
        code_snippet: undefined,
        code_language: 'csharp',
        test_scenarios: [],
        started_at: undefined,
        completed_at: undefined,
        execution_time_seconds: undefined,
        error_count: 0,
        last_error: undefined,
        corrections_applied: [],
        requires_confirmation: true,
        auto_confirmed: false,
        confirmed_by: undefined,
        confirmed_at: undefined,
        dependencies: [1],
        completion_criteria: ['Código implementado', 'Compilação sem erros'],
      });
    }

    // Task 3: Testes (baseada no QA)
    if (consensus.qa) {
      tasks.push({
        todo_id: todo.id,
        sequence_number: 3,
        title: 'Testes e validação',
        description: consensus.qa,
        owner_agent: 'qa',
        status: 'pending',
        code_snippet: undefined,
        code_language: 'csharp',
        test_scenarios: [],
        started_at: undefined,
        completed_at: undefined,
        execution_time_seconds: undefined,
        error_count: 0,
        last_error: undefined,
        corrections_applied: [],
        requires_confirmation: true,
        auto_confirmed: false,
        confirmed_by: undefined,
        confirmed_at: undefined,
        dependencies: [2],
        completion_criteria: ['Testes executados', 'Validação concluída'],
      });
    }

    return tasks;
  }

  private async checkTaskDependencies(task: Task): Promise<number[]> {
    const pendingDependencies: number[] = [];
    
    for (const depId of task.dependencies) {
      const depTask = await this.db.getTask(depId);
      if (!depTask || depTask.status !== 'completed') {
        pendingDependencies.push(depId);
      }
    }
    
    return pendingDependencies;
  }

  private async executeTask(task: Task, todo: Todo, context: CommandContext): Promise<any> {
    // Marcar task como em execução
    await this.db.updateTask(task.id!, {
      status: 'in_progress',
      started_at: new Date(),
    });

    // Executar análise específica do agente responsável
    const analysisRequest = {
      projectId: context.projectId,
      description: task.description || task.title,
      type: 'execute' as const,
      todo,
      task,
    };

    const agentAnalysis = await this.orchestrator.getAgentSpecificAnalysis(
      analysisRequest,
      task.owner_agent
    );

    // Simular execução (em implementação real, aqui seria executado o código)
    const executionResult = {
      agent: task.owner_agent,
      analysis: agentAnalysis,
      code: agentAnalysis?.response || 'Código a ser implementado',
      timestamp: new Date().toISOString(),
    };

    // Atualizar task com resultado
    await this.db.updateTask(task.id!, {
      code_snippet: executionResult.code,
      execution_time_seconds: 1, // Simulado
    });

    return executionResult;
  }

  // =====================================================
  // MÉTODOS DE FORMATAÇÃO
  // =====================================================

  private formatAnalysisResult(analysis: Analysis): string {
    return `## 📊 Análise: ${analysis.title}

**ID:** ${analysis.id}
**Tipo:** ${analysis.type}
**Criado:** ${analysis.created_at.toLocaleDateString()}

### Resumo
${analysis.summary}

### Principais Descobertas
${JSON.stringify(analysis.findings, null, 2)}

---
*Análise salva e disponível para consulta futura*`;
  }

  private formatTodoCreationResult(todo: Todo, tasks: Task[], analysis: any): string {
    return `## ✅ TODO Criado: ${todo.title}

**ID:** ${todo.id}
**Tipo:** ${todo.type}
**Prioridade:** ${todo.priority}
**Status:** ${todo.status}

### Tasks Geradas (${tasks.length})
${tasks.map(t => `${t.sequence_number}. **${t.title}** (${t.owner_agent})`).join('\n')}

### Consenso dos Agentes
${Object.entries(analysis.consensus).map(([agent, response]) => `**${agent}:** ${response}`).join('\n\n')}

### Próximos Passos
Execute \`/executar 1\` para começar a primeira task.`;
  }

  private formatTaskExecutionResult(task: Task, execution: any): string {
    return `## 🚀 Task Executada: ${task.title}

**Sequência:** ${task.sequence_number}
**Agente:** ${task.owner_agent}
**Status:** ${task.status}

### Resultado da Execução
${execution.code}

### Próximos Passos
- Teste o código implementado
- Execute \`/confirmar\` se funcionou corretamente
- Execute \`/erro "descrição"\` se encontrou problemas`;
  }

  private formatConfirmationResult(task: Task, nextTask: Task | null, nextAction: string): string {
    return `## ✅ Task Confirmada: ${task.title}

**Status:** Concluída com sucesso
**Confirmado em:** ${new Date().toLocaleString()}

### Próxima Ação
${nextAction}

${nextTask ? `Execute \`/executar ${nextTask.sequence_number}\` para continuar.` : '🎉 **TODO concluído!**'}`;
  }

  private formatErrorAnalysisResult(bug: Bug, analysis: any): string {
    return `## 🐛 Erro Reportado: ${bug.title}

**Bug ID:** ${bug.id}
**Severidade:** ${bug.severity}
**Status:** ${bug.status}

### Análise do Erro
${analysis.summary}

### Recomendações
${analysis.recommendations.join('\n- ')}

### Próximos Passos
- Revisar análise dos agentes
- Implementar correção sugerida
- Testar solução`;
  }

  private formatContinueResult(todo: Todo, task: Task | null, allTasks: Task[], context: any): string {
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const progress = Math.round((completedTasks.length / allTasks.length) * 100);

    return `## 🔄 Contexto Recuperado

### TODO Atual: ${todo.title}
**Status:** ${todo.status}
**Progresso:** ${progress}% (${completedTasks.length}/${allTasks.length} tasks)

${task ? `### Task Atual: ${task.title}
**Sequência:** ${task.sequence_number}
**Status:** ${task.status}
**Agente:** ${task.owner_agent}` : '### Nenhuma task ativa'}

### Próxima Ação
${context.next_action}

### Tasks Disponíveis
${allTasks.map(t => `${t.sequence_number}. ${t.title} (${t.status})`).join('\n')}`;
  }

  private formatStatusResult(data: any, detailed: boolean): string {
    return `## 📊 Status do Projeto

### Resumo Geral
- **TODOs:** ${data.todos.completed}/${data.todos.total} concluídos
- **Tasks:** ${data.tasks.completed}/${data.tasks.total} concluídas
- **Bugs:** ${data.bugs.resolved}/${data.bugs.total} resolvidos

### Estado Atual
- **TODOs Ativos:** ${data.todos.active}
- **TODOs Pendentes:** ${data.todos.pending}
- **Bugs Abertos:** ${data.bugs.open}

${data.context ? `### Contexto Ativo
- **TODO:** ${data.context.todoId}
- **Task:** ${data.context.taskId || 'Nenhuma'}
- **Próxima Ação:** ${data.context.nextAction}` : '### Nenhum contexto ativo'}

${detailed ? '\n*Use /continuar para retomar trabalho ou /criar para novo TODO*' : ''}`;
  }
}

