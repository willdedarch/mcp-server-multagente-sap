import { ArchitectAgent } from './base.js';
import { DeveloperAgent, DBAAgent, QAAgent } from './specialists.js';
import { BusinessAgent, ProductOwnerAgent } from './business.js';
import type { 
  AgentResponse, 
  MultiAgentAnalysis, 
  AgentConsensus,
  AgentType,
  Todo,
  Task 
} from '../types/index.js';
import { Logger } from '../utils/logger.js';

// =====================================================
// ORQUESTRADOR DE AGENTES
// =====================================================

export interface AnalysisRequest {
  projectId: string;
  description: string;
  type?: 'create' | 'analyze' | 'execute' | 'review';
  todo?: Todo;
  task?: Task;
  codeContext?: string;
  businessRules?: Record<string, any>;
  previousAnalyses?: any[];
}

export class AgentOrchestrator {
  private agents: Map<AgentType, any>;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AgentOrchestrator');
    this.agents = new Map();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.agents.set('architect', new ArchitectAgent());
    this.agents.set('developer', new DeveloperAgent());
    this.agents.set('dba', new DBAAgent());
    this.agents.set('qa', new QAAgent());
    this.agents.set('business', new BusinessAgent());
    this.agents.set('po', new ProductOwnerAgent());

    this.logger.info('Agentes inicializados:', Array.from(this.agents.keys()));
  }

  async analyzeWithAllAgents(request: AnalysisRequest): Promise<MultiAgentAnalysis> {
    this.logger.info(`Iniciando análise multi-agente: ${request.description}`);

    try {
      const context = {
        projectId: request.projectId,
        description: request.description,
        todo: request.todo,
        task: request.task,
        codeContext: request.codeContext,
        businessRules: request.businessRules,
        previousAnalyses: request.previousAnalyses,
      };

      // Executar análise de todos os agentes em paralelo
      const agentPromises = Array.from(this.agents.entries()).map(async ([type, agent]) => {
        try {
          const response = await agent.analyze(context);
          this.logger.debug(`Agente ${type} concluído com confiança ${response.confidence}`);
          return response;
        } catch (error) {
          this.logger.error(`Erro no agente ${type}:`, error);
          return {
            agent: type,
            response: `❌ Erro na análise do agente ${type}`,
            confidence: 0.1,
            suggestions: ['Revisar manualmente']
          } as AgentResponse;
        }
      });

      const responses = await Promise.all(agentPromises);

      // Gerar consenso
      const consensus = this.generateConsensus(responses);
      const summary = this.generateSummary(responses, consensus);
      const recommendations = this.generateRecommendations(responses);

      const analysis: MultiAgentAnalysis = {
        consensus,
        responses,
        summary,
        recommendations,
      };

      this.logger.info('Análise multi-agente concluída');
      return analysis;

    } catch (error) {
      this.logger.error('Erro na análise multi-agente:', error);
      throw new Error(`Falha na análise multi-agente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async analyzeWithSpecificAgents(
    request: AnalysisRequest, 
    agentTypes: AgentType[]
  ): Promise<MultiAgentAnalysis> {
    this.logger.info(`Análise com agentes específicos: ${agentTypes.join(', ')}`);

    const context = {
      projectId: request.projectId,
      description: request.description,
      todo: request.todo,
      task: request.task,
      codeContext: request.codeContext,
      businessRules: request.businessRules,
      previousAnalyses: request.previousAnalyses,
    };

    const responses: AgentResponse[] = [];

    for (const agentType of agentTypes) {
      const agent = this.agents.get(agentType);
      if (agent) {
        try {
          const response = await agent.analyze(context);
          responses.push(response);
        } catch (error) {
          this.logger.error(`Erro no agente ${agentType}:`, error);
          responses.push({
            agent: agentType,
            response: `❌ Erro na análise do agente ${agentType}`,
            confidence: 0.1,
            suggestions: ['Revisar manualmente']
          });
        }
      }
    }

    const consensus = this.generateConsensus(responses);
    const summary = this.generateSummary(responses, consensus);
    const recommendations = this.generateRecommendations(responses);

    return {
      consensus,
      responses,
      summary,
      recommendations,
    };
  }

  private generateConsensus(responses: AgentResponse[]): AgentConsensus {
    const consensus: AgentConsensus = {};

    for (const response of responses) {
      // Extrair a parte principal da resposta (sem emoji e nome do agente)
      const cleanResponse = response.response.replace(/^[🏗️💻🗄️🧪📊🎯]\s*\*\*[^*]+\*\*:\s*/, '');
      consensus[response.agent] = cleanResponse;
    }

    return consensus;
  }

  private generateSummary(responses: AgentResponse[], consensus: AgentConsensus): string {
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const highConfidenceResponses = responses.filter(r => r.confidence >= 0.7);
    const lowConfidenceResponses = responses.filter(r => r.confidence < 0.5);

    let summary = `## 📋 Resumo da Análise Multi-Agente\n\n`;
    summary += `**Confiança Média:** ${(avgConfidence * 100).toFixed(1)}%\n`;
    summary += `**Agentes com Alta Confiança:** ${highConfidenceResponses.length}/${responses.length}\n\n`;

    if (lowConfidenceResponses.length > 0) {
      summary += `⚠️ **Atenção:** ${lowConfidenceResponses.length} agente(s) com baixa confiança:\n`;
      for (const response of lowConfidenceResponses) {
        summary += `- ${response.agent}: ${(response.confidence * 100).toFixed(1)}%\n`;
      }
      summary += '\n';
    }

    // Identificar consensos e divergências
    const architectView = consensus.architect;
    const developerView = consensus.developer;
    const dbaView = consensus.dba;

    if (architectView && developerView) {
      const hasAlignment = this.checkAlignment(architectView, developerView);
      if (hasAlignment) {
        summary += `✅ **Alinhamento Técnico:** Arquiteto e Desenvolvedor estão alinhados\n`;
      } else {
        summary += `⚠️ **Divergência Técnica:** Revisar alinhamento entre Arquiteto e Desenvolvedor\n`;
      }
    }

    if (dbaView && (dbaView.includes('ATENÇÃO') || dbaView.includes('performance'))) {
      summary += `🗄️ **Alerta de Performance:** DBA identificou possíveis impactos\n`;
    }

    return summary;
  }

  private checkAlignment(view1: string, view2: string): boolean {
    // Verificação simples de alinhamento baseada em palavras-chave
    const keywords1 = this.extractKeywords(view1);
    const keywords2 = this.extractKeywords(view2);
    
    const commonKeywords = keywords1.filter(k => keywords2.includes(k));
    return commonKeywords.length >= 2; // Pelo menos 2 palavras-chave em comum
  }

  private extractKeywords(text: string): string[] {
    const keywords = text.toLowerCase().match(/\b(service layer|api|async|performance|cache|transaction|validation|test|database|query|index)\b/g);
    return keywords || [];
  }

  private generateRecommendations(responses: AgentResponse[]): string[] {
    const allSuggestions: string[] = [];
    const priorityKeywords = ['crítico', 'urgente', 'atenção', 'impacto'];

    // Coletar todas as sugestões
    for (const response of responses) {
      if (response.suggestions) {
        allSuggestions.push(...response.suggestions);
      }
    }

    // Remover duplicatas e priorizar
    const uniqueSuggestions = Array.from(new Set(allSuggestions));
    
    // Ordenar por prioridade (sugestões com palavras-chave prioritárias primeiro)
    const prioritizedSuggestions = uniqueSuggestions.sort((a, b) => {
      const aPriority = priorityKeywords.some(keyword => 
        a.toLowerCase().includes(keyword)
      ) ? 1 : 0;
      const bPriority = priorityKeywords.some(keyword => 
        b.toLowerCase().includes(keyword)
      ) ? 1 : 0;
      
      return bPriority - aPriority;
    });

    // Limitar a 10 recomendações principais
    return prioritizedSuggestions.slice(0, 10);
  }

  async getAgentSpecificAnalysis(
    request: AnalysisRequest, 
    agentType: AgentType
  ): Promise<AgentResponse | null> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      this.logger.warn(`Agente ${agentType} não encontrado`);
      return null;
    }

    try {
      const context = {
        projectId: request.projectId,
        description: request.description,
        todo: request.todo,
        task: request.task,
        codeContext: request.codeContext,
        businessRules: request.businessRules,
        previousAnalyses: request.previousAnalyses,
      };

      return await agent.analyze(context);
    } catch (error) {
      this.logger.error(`Erro no agente ${agentType}:`, error);
      return {
        agent: agentType,
        response: `❌ Erro na análise do agente ${agentType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        confidence: 0.1,
        suggestions: ['Revisar manualmente', 'Verificar logs para mais detalhes']
      };
    }
  }

  getAvailableAgents(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  getAgentInfo(agentType: AgentType): { name: string; emoji: string; focus: string; question: string } | null {
    const agent = this.agents.get(agentType);
    if (!agent) return null;

    return {
      name: agent.name,
      emoji: agent.emoji,
      focus: agent.focus,
      question: agent.keyQuestion,
    };
  }

  async validateAnalysisQuality(analysis: MultiAgentAnalysis): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar confiança geral
    const avgConfidence = analysis.responses.reduce((sum, r) => sum + r.confidence, 0) / analysis.responses.length;
    if (avgConfidence < 0.6) {
      issues.push('Confiança média baixa na análise');
      recommendations.push('Revisar contexto e fornecer mais informações');
    }

    // Verificar se todos os agentes responderam
    const expectedAgents: AgentType[] = ['architect', 'developer', 'dba', 'qa', 'business', 'po'];
    const respondedAgents = analysis.responses.map(r => r.agent);
    const missingAgents = expectedAgents.filter(a => !respondedAgents.includes(a));
    
    if (missingAgents.length > 0) {
      issues.push(`Agentes não responderam: ${missingAgents.join(', ')}`);
      recommendations.push('Verificar se todos os agentes estão funcionando');
    }

    // Verificar divergências críticas
    const hasHighRiskWarnings = analysis.responses.some(r => 
      r.response.includes('CRÍTICO') || r.response.includes('ATENÇÃO')
    );
    
    if (hasHighRiskWarnings) {
      recommendations.push('Revisar cuidadosamente os alertas de risco');
      recommendations.push('Considerar implementação faseada');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

