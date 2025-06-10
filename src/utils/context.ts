import type { DatabaseService } from '../database/service.js';
import type { ContextStack } from '../types/index.js';
import { Logger } from './logger.js';

// =====================================================
// GERENCIADOR DE CONTEXTO
// =====================================================

export interface ContextData {
  project_id: string;
  todo_id?: string;
  task_id?: number;
  file_path?: string;
  line_number?: number;
  cursor_position?: number;
  working_directory?: string;
  open_files?: any[];
  terminal_output?: string;
  session_data?: Record<string, any>;
  next_action?: string;
  notes?: string;
  stack_depth?: number;
  parent_context_id?: number;
}

export class ContextManager {
  private db: DatabaseService;
  private logger: Logger;
  private contextStack: Map<string, ContextStack[]> = new Map();

  constructor(db: DatabaseService) {
    this.db = db;
    this.logger = new Logger('ContextManager');
  }

  async saveContext(data: ContextData): Promise<ContextStack> {
    try {
      this.logger.debug(`Salvando contexto para projeto ${data.project_id}`);
// ANTES da linha 40, adicionar:
       const contextToSave: Omit<ContextStack, 'id' | 'saved_at'> = {
          project_id: data.project_id,
          open_files: data.open_files ?? [],
          session_data: data.session_data ?? {},
          is_active: true,
          stack_depth: data.stack_depth ?? 0,
          todo_id: data.todo_id,
          task_id: data.task_id,
          file_path: data.file_path,
          line_number: data.line_number,
          cursor_position: data.cursor_position,
          working_directory: data.working_directory,
          terminal_output: data.terminal_output,
          next_action: data.next_action,
          notes: data.notes,
          parent_context_id: data.parent_context_id,
        };
        const context = await this.db.saveContext(contextToSave);
      
      // Atualizar cache local
      const projectContexts = this.contextStack.get(data.project_id) || [];
      projectContexts.push(context);
      this.contextStack.set(data.project_id, projectContexts);

      this.logger.info(`Contexto salvo: ${context.id}`);
      return context;

    } catch (error) {
      this.logger.error('Erro ao salvar contexto:', error);
      throw error;
    }
  }

  async getActiveContext(projectId: string): Promise<ContextStack | null> {
    try {
      // Tentar buscar do cache primeiro
      const cachedContexts = this.contextStack.get(projectId);
      if (cachedContexts && cachedContexts.length > 0) {
        const activeContext = cachedContexts.find(c => c.is_active);
        if (activeContext) {
          return activeContext;
        }
      }

      // Buscar do banco de dados
      const context = await this.db.getActiveContext(projectId);
      
      if (context) {
        // Atualizar cache
        const projectContexts = this.contextStack.get(projectId) || [];
        const existingIndex = projectContexts.findIndex(c => c.id === context.id);
        
        if (existingIndex >= 0) {
          projectContexts[existingIndex] = context;
        } else {
          projectContexts.push(context);
        }
        
        this.contextStack.set(projectId, projectContexts);
      }

      return context;

    } catch (error) {
      this.logger.error('Erro ao buscar contexto ativo:', error);
      return null;
    }
  }

  async pushContext(projectId: string, data: Partial<ContextData>): Promise<ContextStack> {
    try {
      const currentContext = await this.getActiveContext(projectId);
      const stackDepth = currentContext ? (currentContext.stack_depth || 0) + 1 : 0;

      const newContextData: ContextData = {
        project_id: projectId,
        stack_depth: stackDepth,
        parent_context_id: currentContext?.id,
        ...data,
      };

      return await this.saveContext(newContextData);

    } catch (error) {
      this.logger.error('Erro ao empilhar contexto:', error);
      throw error;
    }
  }

  async popContext(projectId: string): Promise<ContextStack | null> {
    try {
      const currentContext = await this.getActiveContext(projectId);
      
      if (!currentContext || !currentContext.parent_context_id) {
        this.logger.warn('Nenhum contexto pai para retornar');
        return null;
      }

      // Desativar contexto atual
      await this.db.updateContext(currentContext.id!, { is_active: false });

      // Ativar contexto pai
      const parentContext = await this.db.getContext(currentContext.parent_context_id);
      if (parentContext) {
        await this.db.updateContext(parentContext.id!, { 
          is_active: true,
          resumed_at: new Date(),
        });

        // Atualizar cache
        this.updateContextCache(projectId, parentContext);
        
        return parentContext;
      }

      return null;

    } catch (error) {
      this.logger.error('Erro ao desempilhar contexto:', error);
      throw error;
    }
  }

  async updateCurrentContext(projectId: string, updates: Partial<ContextData>): Promise<ContextStack | null> {
    try {
      const currentContext = await this.getActiveContext(projectId);
      
      if (!currentContext) {
        this.logger.warn('Nenhum contexto ativo para atualizar');
        return null;
      }

      const updatedContext = await this.db.updateContext(currentContext.id!, updates);
      
      // Atualizar cache
      this.updateContextCache(projectId, updatedContext);
      
      return updatedContext;

    } catch (error) {
      this.logger.error('Erro ao atualizar contexto:', error);
      throw error;
    }
  }

  async getContextHistory(projectId: string, limit: number = 10): Promise<ContextStack[]> {
    try {
      const contexts = await this.db.getContextHistory(projectId, limit);
      
      // Atualizar cache
      this.contextStack.set(projectId, contexts);
      
      return contexts;

    } catch (error) {
      this.logger.error('Erro ao buscar histórico de contexto:', error);
      return [];
    }
  }

  async clearInactiveContexts(projectId: string, olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await this.db.deleteOldContexts(projectId, cutoffDate);
      
      // Limpar cache
      this.contextStack.delete(projectId);
      
      this.logger.info(`Removidos ${deletedCount} contextos antigos do projeto ${projectId}`);
      return deletedCount;

    } catch (error) {
      this.logger.error('Erro ao limpar contextos antigos:', error);
      return 0;
    }
  }

  getContextSummary(context: ContextStack): {
    description: string;
    location: string;
    nextAction: string;
    age: string;
  } {
    const age = this.formatAge(context.saved_at);
    const location = context.file_path 
      ? `${context.file_path}:${context.line_number || 0}`
      : context.working_directory || 'Unknown';

    return {
      description: `TODO: ${context.todo_id || 'None'}, Task: ${context.task_id || 'None'}`,
      location,
      nextAction: context.next_action || 'No action defined',
      age,
    };
  }

  private updateContextCache(projectId: string, context: ContextStack): void {
    const projectContexts = this.contextStack.get(projectId) || [];
    const existingIndex = projectContexts.findIndex(c => c.id === context.id);
    
    if (existingIndex >= 0) {
      projectContexts[existingIndex] = context;
    } else {
      projectContexts.push(context);
    }
    
    this.contextStack.set(projectId, projectContexts);
  }

  private formatAge(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dia(s) atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora(s) atrás`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minuto(s) atrás`;
    } else {
      return 'Agora mesmo';
    }
  }

  // Métodos para debugging e monitoramento
  getCacheStats(): { [projectId: string]: number } {
    const stats: { [projectId: string]: number } = {};
    
    for (const [projectId, contexts] of this.contextStack.entries()) {
      stats[projectId] = contexts.length;
    }
    
    return stats;
  }

  clearCache(projectId?: string): void {
    if (projectId) {
      this.contextStack.delete(projectId);
      this.logger.info(`Cache limpo para projeto ${projectId}`);
    } else {
      this.contextStack.clear();
      this.logger.info('Cache de contextos limpo completamente');
    }
  }
}

