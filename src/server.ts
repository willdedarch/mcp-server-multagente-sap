#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { DatabaseService } from './database/service.js';
import { CommandProcessor } from './commands/processor.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { ContextManager } from './utils/context.js';
import { Logger } from './utils/logger.js';
import type { CommandContext, CommandResult } from './types/index.js';

// =====================================================
// CONFIGURAÇÃO DO SERVIDOR MCP
// =====================================================

class SapB1MultiAgentServer {
  private server: Server;
  private db: DatabaseService;
  private commandProcessor: CommandProcessor;
  private agentOrchestrator: AgentOrchestrator;
  private contextManager: ContextManager;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: 'sap-b1-multiagent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger = new Logger('SapB1MultiAgentServer');
    this.db = new DatabaseService();
    this.agentOrchestrator = new AgentOrchestrator();
    this.contextManager = new ContextManager(this.db);
    this.commandProcessor = new CommandProcessor(
      this.db,
      this.agentOrchestrator,
      this.contextManager
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // Lista de ferramentas disponíveis
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analise',
            description: 'Análise profunda sem criar tarefas. Documenta fluxos, arquitetura, regras de negócio.',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Descrição do que deve ser analisado',
                },
                type: {
                  type: 'string',
                  enum: ['flow', 'architecture', 'impact', 'performance', 'security', 'business_rule'],
                  description: 'Tipo de análise a ser realizada',
                },
                scope: {
                  type: 'string',
                  description: 'Escopo da análise (opcional)',
                },
              },
              required: ['description'],
            },
          },
          {
            name: 'criar',
            description: 'Cria novo TODO com análise multi-agente.',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['feature', 'bug', 'analysis', 'architecture', 'optimization', 'refactor'],
                  description: 'Tipo do TODO',
                },
                description: {
                  type: 'string',
                  description: 'Descrição detalhada do TODO',
                },
                priority: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Prioridade do TODO',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags para categorização',
                },
              },
              required: ['type', 'description'],
            },
          },
          {
            name: 'executar',
            description: 'Executa task específica com código real.',
            inputSchema: {
              type: 'object',
              properties: {
                taskNumber: {
                  type: 'number',
                  description: 'Número da task a ser executada',
                },
                force: {
                  type: 'boolean',
                  description: 'Força execução mesmo com dependências pendentes',
                },
              },
              required: ['taskNumber'],
            },
          },
          {
            name: 'confirmar',
            description: 'Confirma que código funcionou.',
            inputSchema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  description: 'Notas sobre a confirmação (opcional)',
                },
              },
            },
          },
          {
            name: 'erro',
            description: 'Reporta erro no código gerado.',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Descrição do erro encontrado',
                },
                stackTrace: {
                  type: 'string',
                  description: 'Stack trace do erro (opcional)',
                },
                screenshot: {
                  type: 'string',
                  description: 'Screenshot do erro em base64 (opcional)',
                },
              },
              required: ['description'],
            },
          },
          {
            name: 'continuar',
            description: 'Retoma trabalho de onde parou.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'status',
            description: 'Visão geral do projeto.',
            inputSchema: {
              type: 'object',
              properties: {
                detailed: {
                  type: 'boolean',
                  description: 'Mostrar informações detalhadas',
                },
              },
            },
          },
          {
            name: 'revisar',
            description: 'Code review automático da task atual.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'testar',
            description: 'Gera testes para código atual.',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['unit', 'integration', 'e2e'],
                  description: 'Tipo de teste a ser gerado',
                },
              },
            },
          },
          {
            name: 'doc',
            description: 'Gera documentação.',
            inputSchema: {
              type: 'object',
              properties: {
                format: {
                  type: 'string',
                  enum: ['markdown', 'html', 'pdf'],
                  description: 'Formato da documentação',
                },
              },
            },
          },
          {
            name: 'rapido',
            description: 'Correção rápida sem análise profunda.',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Descrição da correção rápida',
                },
              },
              required: ['description'],
            },
          },
        ] satisfies Tool[],
      };
    });

    // Handler para execução de ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Extrair contexto do projeto (normalmente viria do Claude Project)
        const context: CommandContext = {
          projectId: process.env.DEFAULT_PROJECT_ID || 'PROJ-DEFAULT-001',
          userId: 'system',
          sessionId: `session-${Date.now()}`,
        };

        let result: CommandResult;

        switch (name) {
          case 'analise':
            result = await this.commandProcessor.handleAnalyze(args, context);
            break;
          case 'criar':
            result = await this.commandProcessor.handleCreate(args, context);
            break;
          case 'executar':
            result = await this.commandProcessor.handleExecute(args, context);
            break;
          case 'confirmar':
            result = await this.commandProcessor.handleConfirm(args, context);
            break;
          case 'erro':
            result = await this.commandProcessor.handleError(args, context);
            break;
          case 'continuar':
            result = await this.commandProcessor.handleContinue(args, context);
            break;
          case 'status':
            result = await this.commandProcessor.handleStatus(args, context);
            break;
          case 'revisar':
            result = await this.commandProcessor.handleReview(args, context);
            break;
          case 'testar':
            result = await this.commandProcessor.handleTest(args, context);
            break;
          case 'doc':
            result = await this.commandProcessor.handleDoc(args, context);
            break;
          case 'rapido':
            result = await this.commandProcessor.handleQuick(args, context);
            break;
          default:
            throw new Error(`Comando desconhecido: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: this.formatResult(result),
            },
          ],
        };
      } catch (error) {
        this.logger.error('Erro ao executar comando:', error);
        return {
          content: [
            {
              type: 'text',
              text: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logger.error('Erro no servidor MCP:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Recebido SIGINT, encerrando servidor...');
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      this.logger.info('Recebido SIGTERM, encerrando servidor...');
      await this.cleanup();
      process.exit(0);
    });
  }

  private formatResult(result: CommandResult): string {
    if (!result.success) {
      return `❌ **Erro**: ${result.message}\n${result.error ? `\n\`\`\`\n${result.error}\n\`\`\`` : ''}`;
    }

    let output = `✅ **${result.message}**\n`;

    if (result.data) {
      if (typeof result.data === 'string') {
        output += `\n${result.data}`;
      } else if (result.data.formatted) {
        output += `\n${result.data.formatted}`;
      } else {
        output += `\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``;
      }
    }

    return output;
  }

  private async cleanup(): Promise<void> {
    try {
      await this.db.disconnect();
      this.logger.info('Cleanup concluído');
    } catch (error) {
      this.logger.error('Erro durante cleanup:', error);
    }
  }

  async start(): Promise<void> {
    try {
      // Inicializar conexão com banco
      await this.db.connect();
      this.logger.info('Conectado ao banco de dados');

      // Inicializar transporte stdio
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.logger.info('Servidor SAP B1 Multi-Agent iniciado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function main(): Promise<void> {
  const server = new SapB1MultiAgentServer();
  await server.start();
}

// Executar apenas se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export { SapB1MultiAgentServer };

