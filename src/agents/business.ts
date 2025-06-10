import { BaseAgent, type AgentContext } from './base.js';
import type { AgentResponse } from '../types/index.js';

// =====================================================
// AGENTE ANALISTA DE NEGÓCIOS
// =====================================================

export class BusinessAgent extends BaseAgent {
  constructor() {
    super(
      'business',
      'Analista de Negócios',
      '📊',
      'Processo SAP real',
      'Isso resolve o problema real?'
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Analisando impacto no negócio: ${context.description}`);

    try {
      const analysis = this.performBusinessAnalysis(context);
      
      const confidence = this.calculateConfidence({
        complexity: analysis.complexity,
        familiarity: 4, // Processos SAP são conhecidos
        riskLevel: analysis.riskLevel,
        dataQuality: context.businessRules ? 5 : 3,
      });

      return this.formatResponse(
        analysis.businessImpact,
        confidence,
        analysis.suggestions
      );
    } catch (error) {
      this.logger.error('Erro na análise de negócio:', error);
      return this.formatResponse(
        'Erro na análise de impacto no negócio. Recomendo validação manual com usuários.',
        0.1
      );
    }
  }

  private performBusinessAnalysis(context: AgentContext): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const { description } = context;
    
    const isFinancial = /financeiro|contábil|fiscal|imposto|faturamento/i.test(description);
    const isInventory = /estoque|item|produto|movimentação/i.test(description);
    const isSales = /vendas|pedido|cliente|comissão/i.test(description);
    const isPurchasing = /compras|fornecedor|cotação|ordem/i.test(description);
    const isReporting = /relatório|dashboard|kpi|análise/i.test(description);

    if (isFinancial) {
      return this.analyzeFinancialImpact(description);
    } else if (isInventory) {
      return this.analyzeInventoryImpact(description);
    } else if (isSales) {
      return this.analyzeSalesImpact(description);
    } else if (isPurchasing) {
      return this.analyzePurchasingImpact(description);
    } else if (isReporting) {
      return this.analyzeReportingImpact(description);
    } else {
      return this.analyzeGeneralBusinessImpact(description);
    }
  }

  private analyzeFinancialImpact(description: string): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      businessImpact: 'IMPACTO FINANCEIRO CRÍTICO: Mudanças no módulo financeiro afetam compliance fiscal, relatórios contábeis e fluxo de caixa. Validar com contador e auditor antes da implementação.',
      complexity: 5,
      riskLevel: 5,
      suggestions: [
        'Validar com departamento contábil',
        'Verificar impacto em relatórios fiscais',
        'Testar com dados do mês anterior',
        'Validar cálculos de impostos',
        'Verificar integração com sistemas externos',
        'Criar backup antes de implementar',
        'Planejar rollback se necessário',
        'Documentar mudanças para auditoria'
      ]
    };
  }

  private analyzeInventoryImpact(description: string): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      businessImpact: 'IMPACTO NO ESTOQUE: Alterações podem afetar disponibilidade de produtos, custos e planejamento de compras. Coordenar com almoxarifado e compras.',
      complexity: 4,
      riskLevel: 4,
      suggestions: [
        'Validar com equipe de almoxarifado',
        'Verificar impacto no planejamento MRP',
        'Testar com produtos de alta rotatividade',
        'Validar cálculos de custo médio',
        'Verificar relatórios de movimentação',
        'Coordenar com equipe de compras',
        'Planejar inventário após mudanças'
      ]
    };
  }

  private analyzeSalesImpact(description: string): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      businessImpact: 'IMPACTO NAS VENDAS: Mudanças podem afetar processo de vendas, comissionamento e relacionamento com clientes. Treinar equipe comercial.',
      complexity: 3,
      riskLevel: 3,
      suggestions: [
        'Treinar equipe de vendas',
        'Validar cálculo de comissões',
        'Testar processo completo de vendas',
        'Verificar impacto nos preços',
        'Validar com clientes piloto',
        'Atualizar materiais de treinamento',
        'Monitorar satisfação do cliente'
      ]
    };
  }

  private analyzePurchasingImpact(description: string): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      businessImpact: 'IMPACTO NAS COMPRAS: Alterações podem afetar relacionamento com fornecedores, prazos de entrega e custos. Coordenar com equipe de compras.',
      complexity: 3,
      riskLevel: 3,
      suggestions: [
        'Coordenar com equipe de compras',
        'Validar com fornecedores principais',
        'Testar processo de cotação',
        'Verificar aprovações necessárias',
        'Validar integração com e-procurement',
        'Monitorar prazos de entrega',
        'Atualizar procedimentos de compra'
      ]
    };
  }

  private analyzeReportingImpact(description: string): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      businessImpact: 'IMPACTO EM RELATÓRIOS: Mudanças podem afetar tomada de decisão gerencial e compliance. Validar com usuários finais e gestores.',
      complexity: 2,
      riskLevel: 2,
      suggestions: [
        'Validar com usuários finais',
        'Testar com dados históricos',
        'Verificar performance dos relatórios',
        'Validar fórmulas e cálculos',
        'Treinar usuários nas mudanças',
        'Criar documentação atualizada',
        'Monitorar uso dos relatórios'
      ]
    };
  }

  private analyzeGeneralBusinessImpact(description: string): {
    businessImpact: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      businessImpact: 'Avaliar impacto nos processos de negócio. Identificar usuários afetados e planejar treinamento adequado.',
      complexity: 3,
      riskLevel: 2,
      suggestions: [
        'Identificar usuários impactados',
        'Mapear processos afetados',
        'Planejar treinamento',
        'Criar documentação de usuário',
        'Definir critérios de aceitação',
        'Planejar rollout gradual'
      ]
    };
  }
}

// =====================================================
// AGENTE PRODUCT OWNER
// =====================================================

export class ProductOwnerAgent extends BaseAgent {
  constructor() {
    super(
      'po',
      'Product Owner',
      '🎯',
      'Priorização e valor',
      'É isso que devemos fazer agora?'
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Analisando prioridade e valor: ${context.description}`);

    try {
      const analysis = this.performPriorityAnalysis(context);
      
      const confidence = this.calculateConfidence({
        complexity: analysis.complexity,
        familiarity: 4, // Priorização é nossa especialidade
        riskLevel: analysis.riskLevel,
        dataQuality: 4,
      });

      return this.formatResponse(
        analysis.priorityRecommendation,
        confidence,
        analysis.suggestions
      );
    } catch (error) {
      this.logger.error('Erro na análise de prioridade:', error);
      return this.formatResponse(
        'Erro na análise de prioridade. Recomendo revisão manual do valor de negócio.',
        0.1
      );
    }
  }

  private performPriorityAnalysis(context: AgentContext): {
    priorityRecommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const { description, todo } = context;
    const type = todo?.type || 'feature';
    const priority = todo?.priority || 'medium';

    // Análise de valor vs esforço
    const businessValue = this.assessBusinessValue(description);
    const technicalEffort = this.assessTechnicalEffort(description);
    const urgency = this.assessUrgency(description, type);
    const risk = this.assessRisk(description, type);

    return this.generatePriorityRecommendation(businessValue, technicalEffort, urgency, risk, priority);
  }

  private assessBusinessValue(description: string): number {
    let value = 3; // Base value

    // Alto valor
    if (/crítico|urgente|cliente|receita|compliance/i.test(description)) value += 2;
    if (/automação|eficiência|produtividade/i.test(description)) value += 1;
    if (/relatório|dashboard|análise/i.test(description)) value += 1;

    // Baixo valor
    if (/cosmético|visual|nice to have/i.test(description)) value -= 1;
    if (/refatoração|limpeza|documentação/i.test(description)) value -= 1;

    return Math.max(1, Math.min(5, value));
  }

  private assessTechnicalEffort(description: string): number {
    let effort = 3; // Base effort

    // Alto esforço
    if (/integração|api|migração|arquitetura/i.test(description)) effort += 2;
    if (/complexo|múltiplos|dependências/i.test(description)) effort += 1;
    if (/performance|otimização/i.test(description)) effort += 1;

    // Baixo esforço
    if (/simples|rápido|pequeno|configuração/i.test(description)) effort -= 1;
    if (/correção|ajuste|bug/i.test(description)) effort -= 1;

    return Math.max(1, Math.min(5, effort));
  }

  private assessUrgency(description: string, type: string): number {
    let urgency = 3; // Base urgency

    if (type === 'bug') urgency += 2;
    if (/urgente|crítico|parado|bloqueado/i.test(description)) urgency += 2;
    if (/deadline|prazo|entrega/i.test(description)) urgency += 1;
    if (/futuro|planejado|eventual/i.test(description)) urgency -= 1;

    return Math.max(1, Math.min(5, urgency));
  }

  private assessRisk(description: string, type: string): number {
    let risk = 2; // Base risk

    if (/financeiro|fiscal|contábil/i.test(description)) risk += 2;
    if (/integração|api|terceiros/i.test(description)) risk += 1;
    if (/dados|migração|conversão/i.test(description)) risk += 1;
    if (/interface|cosmético|visual/i.test(description)) risk -= 1;

    return Math.max(1, Math.min(5, risk));
  }

  private generatePriorityRecommendation(
    businessValue: number,
    technicalEffort: number,
    urgency: number,
    risk: number,
    currentPriority: string
  ): {
    priorityRecommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    // Calcular score de prioridade
    const valueEffortRatio = businessValue / technicalEffort;
    const urgencyWeight = urgency * 0.3;
    const riskPenalty = risk * 0.2;
    
    const priorityScore = (valueEffortRatio + urgencyWeight - riskPenalty);

    let recommendedPriority: string;
    let reasoning: string;

    if (priorityScore >= 2.5) {
      recommendedPriority = 'high';
      reasoning = 'Alto valor de negócio com esforço justificável';
    } else if (priorityScore >= 1.5) {
      recommendedPriority = 'medium';
      reasoning = 'Valor moderado, pode ser planejado para próximas sprints';
    } else if (priorityScore >= 1.0) {
      recommendedPriority = 'low';
      reasoning = 'Baixo valor ou alto esforço, considerar para backlog futuro';
    } else {
      recommendedPriority = 'low';
      reasoning = 'Questionável valor de negócio, reavaliar necessidade';
    }

    const priorityRecommendation = `PRIORIDADE RECOMENDADA: ${recommendedPriority.toUpperCase()} (atual: ${currentPriority}). ${reasoning}. Score: ${priorityScore.toFixed(2)} (Valor: ${businessValue}/5, Esforço: ${technicalEffort}/5, Urgência: ${urgency}/5, Risco: ${risk}/5)`;

    const suggestions = this.generatePrioritySuggestions(businessValue, technicalEffort, urgency, risk, recommendedPriority);

    return {
      priorityRecommendation,
      complexity: technicalEffort,
      riskLevel: risk,
      suggestions
    };
  }

  private generatePrioritySuggestions(
    businessValue: number,
    technicalEffort: number,
    urgency: number,
    risk: number,
    priority: string
  ): string[] {
    const suggestions: string[] = [];

    if (priority === 'high') {
      suggestions.push('Alocar desenvolvedor sênior');
      suggestions.push('Definir timeline agressivo');
      suggestions.push('Monitorar progresso diariamente');
      if (risk >= 4) suggestions.push('Implementar em ambiente de teste primeiro');
    }

    if (priority === 'medium') {
      suggestions.push('Planejar para próxima sprint');
      suggestions.push('Quebrar em tarefas menores se possível');
      suggestions.push('Validar requisitos com stakeholders');
    }

    if (priority === 'low') {
      suggestions.push('Adicionar ao backlog para revisão futura');
      suggestions.push('Considerar alternativas mais simples');
      if (businessValue <= 2) suggestions.push('Questionar real necessidade');
    }

    if (technicalEffort >= 4) {
      suggestions.push('Considerar MVP ou implementação faseada');
      suggestions.push('Avaliar alternativas técnicas');
      suggestions.push('Estimar esforço com mais precisão');
    }

    if (risk >= 4) {
      suggestions.push('Criar plano de rollback');
      suggestions.push('Implementar em horário de baixo movimento');
      suggestions.push('Ter equipe de suporte disponível');
    }

    if (urgency >= 4) {
      suggestions.push('Considerar solução temporária');
      suggestions.push('Comunicar impacto aos stakeholders');
      suggestions.push('Priorizar sobre outras tarefas');
    }

    return suggestions;
  }
}

