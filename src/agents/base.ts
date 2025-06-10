import type { AgentType, AgentResponse, MultiAgentAnalysis, Todo, Task } from '../types/index.js';
import { Logger } from '../utils/logger.js';

// =====================================================
// INTERFACE BASE PARA AGENTES
// =====================================================

export interface AgentContext {
  projectId: string;
  todo?: Todo;
  task?: Task;
  description: string;
  codeContext?: string;
  previousAnalyses?: any[];
  businessRules?: Record<string, any>;
}

export abstract class BaseAgent {
  protected logger: Logger;
  public readonly type: AgentType;
  public readonly name: string;
  public readonly emoji: string;
  public readonly focus: string;
  public readonly keyQuestion: string;

  constructor(
    type: AgentType,
    name: string,
    emoji: string,
    focus: string,
    keyQuestion: string
  ) {
    this.type = type;
    this.name = name;
    this.emoji = emoji;
    this.focus = focus;
    this.keyQuestion = keyQuestion;
    this.logger = new Logger(`Agent-${name}`);
  }

  abstract analyze(context: AgentContext): Promise<AgentResponse>;

  protected calculateConfidence(factors: {
    complexity: number; // 1-5 (1=simples, 5=complexo)
    familiarity: number; // 1-5 (1=desconhecido, 5=familiar)
    riskLevel: number; // 1-5 (1=baixo, 5=alto)
    dataQuality: number; // 1-5 (1=ruim, 5=boa)
  }): number {
    const { complexity, familiarity, riskLevel, dataQuality } = factors;
    
    // Fórmula de confiança baseada nos fatores
    const baseConfidence = (familiarity + dataQuality) / 2;
    const complexityPenalty = (complexity - 1) * 0.1;
    const riskPenalty = (riskLevel - 1) * 0.15;
    
    const confidence = Math.max(0.1, Math.min(1.0, 
      (baseConfidence / 5) - complexityPenalty - riskPenalty
    ));
    
    return Math.round(confidence * 100) / 100;
  }

  protected formatResponse(
    response: string,
    confidence: number,
    suggestions: string[] = []
  ): AgentResponse {
    return {
      agent: this.type,
      response: `${this.emoji} **${this.name}**: ${response}`,
      confidence,
      suggestions,
    };
  }
}

// =====================================================
// AGENTE ARQUITETO DE SOLUÇÕES
// =====================================================

export class ArchitectAgent extends BaseAgent {
  constructor() {
    super(
      'architect',
      'Arquiteto de Soluções',
      '🏗️',
      'Soluções simples e pragmáticas',
      'Qual a solução mais simples?'
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Analisando: ${context.description}`);

    try {
      // Análise arquitetural baseada no contexto
      const analysis = this.performArchitecturalAnalysis(context);
      
      const confidence = this.calculateConfidence({
        complexity: analysis.complexity,
        familiarity: 4, // Arquitetura SAP B1 é familiar
        riskLevel: analysis.riskLevel,
        dataQuality: context.codeContext ? 4 : 2,
      });

      return this.formatResponse(
        analysis.recommendation,
        confidence,
        analysis.suggestions
      );
    } catch (error) {
      this.logger.error('Erro na análise arquitetural:', error);
      return this.formatResponse(
        'Erro na análise arquitetural. Recomendo revisão manual.',
        0.1
      );
    }
  }

  private performArchitecturalAnalysis(context: AgentContext): {
    recommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const { description, todo } = context;
    const type = todo?.type || 'feature';
    
    // Análise baseada no tipo e descrição
    if (type === 'integration') {
      return this.analyzeIntegration(description);
    } else if (type === 'bug') {
      return this.analyzeBugFix(description);
    } else if (type === 'feature') {
      return this.analyzeFeature(description);
    } else {
      return this.analyzeGeneral(description);
    }
  }

  private analyzeIntegration(description: string): {
    recommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isApiIntegration = /api|webservice|rest|soap/i.test(description);
    const isFileIntegration = /arquivo|file|csv|xml|txt/i.test(description);
    const isDatabaseIntegration = /banco|database|sql|query/i.test(description);

    if (isApiIntegration) {
      return {
        recommendation: 'Use Service Layer para integrações API. Evite DI API para operações simples. Implemente retry logic e tratamento de erros robusto.',
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Implementar cache para reduzir chamadas',
          'Usar async/await para melhor performance',
          'Validar dados antes de enviar para SAP',
          'Implementar logging detalhado'
        ]
      };
    } else if (isFileIntegration) {
      return {
        recommendation: 'Use processamento em lotes para arquivos grandes. Valide estrutura antes de processar. Implemente rollback em caso de erro.',
        complexity: 2,
        riskLevel: 2,
        suggestions: [
          'Processar em chunks de 100-500 registros',
          'Validar encoding do arquivo',
          'Criar backup antes de processar',
          'Implementar progress tracking'
        ]
      };
    } else if (isDatabaseIntegration) {
      return {
        recommendation: 'Use views ou stored procedures quando possível. Evite queries diretas em tabelas SAP. Implemente connection pooling.',
        complexity: 3,
        riskLevel: 3,
        suggestions: [
          'Usar transações para operações múltiplas',
          'Implementar timeout adequado',
          'Validar permissões antes de executar',
          'Monitorar performance das queries'
        ]
      };
    }

    return {
      recommendation: 'Defina claramente o tipo de integração antes de prosseguir. Considere Service Layer como primeira opção.',
      complexity: 2,
      riskLevel: 1,
      suggestions: [
        'Mapear dados de entrada e saída',
        'Definir formato de erro padrão',
        'Implementar versionamento da API'
      ]
    };
  }

  private analyzeBugFix(description: string): {
    recommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isPerformanceIssue = /lento|performance|timeout|demora/i.test(description);
    const isDataIssue = /dados|cálculo|valor|inconsistente/i.test(description);
    const isUIIssue = /tela|interface|botão|campo/i.test(description);

    if (isPerformanceIssue) {
      return {
        recommendation: 'Identifique o gargalo primeiro. Use profiler para queries lentas. Considere índices ou otimização de queries.',
        complexity: 4,
        riskLevel: 3,
        suggestions: [
          'Analisar execution plan das queries',
          'Verificar índices nas tabelas envolvidas',
          'Implementar cache se apropriado',
          'Considerar paginação para grandes volumes'
        ]
      };
    } else if (isDataIssue) {
      return {
        recommendation: 'Reproduza o erro em ambiente controlado. Valide regras de negócio. Teste com dados reais.',
        complexity: 3,
        riskLevel: 4,
        suggestions: [
          'Criar casos de teste específicos',
          'Validar fórmulas de cálculo',
          'Verificar configurações do sistema',
          'Implementar logs detalhados'
        ]
      };
    } else if (isUIIssue) {
      return {
        recommendation: 'Teste em diferentes resoluções e browsers. Valide eventos e bindings. Use ferramentas de debug do browser.',
        complexity: 2,
        riskLevel: 2,
        suggestions: [
          'Testar em Chrome, Firefox e Edge',
          'Validar responsividade',
          'Verificar console de erros JavaScript',
          'Testar com diferentes usuários'
        ]
      };
    }

    return {
      recommendation: 'Reproduza o erro consistentemente antes de implementar correção. Documente passos para reprodução.',
      complexity: 3,
      riskLevel: 3,
      suggestions: [
        'Criar ambiente de teste isolado',
        'Documentar cenários de erro',
        'Implementar testes de regressão'
      ]
    };
  }

  private analyzeFeature(description: string): {
    recommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isCrudOperation = /criar|editar|excluir|listar|crud/i.test(description);
    const isReportFeature = /relatório|report|dashboard|gráfico/i.test(description);
    const isWorkflowFeature = /workflow|aprovação|processo|fluxo/i.test(description);

    if (isCrudOperation) {
      return {
        recommendation: 'Use padrão Repository para acesso a dados. Implemente validações no backend. Use DTOs para transferência.',
        complexity: 2,
        riskLevel: 2,
        suggestions: [
          'Implementar validação de entrada',
          'Usar transações para operações múltiplas',
          'Implementar soft delete quando apropriado',
          'Criar testes unitários para cada operação'
        ]
      };
    } else if (isReportFeature) {
      return {
        recommendation: 'Use Crystal Reports ou ferramentas nativas SAP. Otimize queries para grandes volumes. Implemente cache.',
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Usar views para simplificar queries',
          'Implementar filtros eficientes',
          'Considerar exportação para Excel/PDF',
          'Implementar paginação para relatórios grandes'
        ]
      };
    } else if (isWorkflowFeature) {
      return {
        recommendation: 'Use SAP Approval Procedures quando possível. Implemente estado consistente. Documente fluxo claramente.',
        complexity: 4,
        riskLevel: 3,
        suggestions: [
          'Mapear todos os estados possíveis',
          'Implementar notificações automáticas',
          'Criar logs de auditoria',
          'Testar todos os cenários de aprovação'
        ]
      };
    }

    return {
      recommendation: 'Defina requisitos funcionais claramente. Considere impacto em módulos existentes. Planeje testes abrangentes.',
      complexity: 3,
      riskLevel: 2,
      suggestions: [
        'Criar protótipo da interface',
        'Validar com usuários finais',
        'Documentar regras de negócio',
        'Planejar migração de dados se necessário'
      ]
    };
  }

  private analyzeGeneral(description: string): {
    recommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      recommendation: 'Analise requisitos detalhadamente. Considere alternativas simples primeiro. Documente decisões arquiteturais.',
      complexity: 3,
      riskLevel: 2,
      suggestions: [
        'Quebrar em tarefas menores',
        'Identificar dependências',
        'Estimar esforço realisticamente',
        'Planejar testes desde o início'
      ]
    };
  }
}

