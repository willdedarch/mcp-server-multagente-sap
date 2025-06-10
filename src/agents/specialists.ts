import { BaseAgent, type AgentContext } from './base.js';
import type { AgentResponse } from '../types/index.js';

// =====================================================
// AGENTE DESENVOLVEDOR SÊNIOR
// =====================================================

export class DeveloperAgent extends BaseAgent {
  constructor() {
    super(
      'developer',
      'Desenvolvedor Sênior',
      '💻',
      'Código REAL que funciona',
      'Como fazer funcionar HOJE?'
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Analisando implementação: ${context.description}`);

    try {
      const analysis = this.performCodeAnalysis(context);
      
      const confidence = this.calculateConfidence({
        complexity: analysis.complexity,
        familiarity: 5, // Desenvolvimento é nossa especialidade
        riskLevel: analysis.riskLevel,
        dataQuality: context.codeContext ? 5 : 3,
      });

      return this.formatResponse(
        analysis.implementation,
        confidence,
        analysis.suggestions
      );
    } catch (error) {
      this.logger.error('Erro na análise de desenvolvimento:', error);
      return this.formatResponse(
        'Erro na análise de código. Recomendo revisão manual do contexto.',
        0.1
      );
    }
  }

  private performCodeAnalysis(context: AgentContext): {
    implementation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const { description, todo } = context;
    const type = todo?.type || 'feature';

    if (type === 'bug') {
      return this.generateBugFixCode(description);
    } else if (type === 'feature') {
      return this.generateFeatureCode(description);
    } else if (type === 'integration') {
      return this.generateIntegrationCode(description);
    } else {
      return this.generateGenericCode(description);
    }
  }

  private generateBugFixCode(description: string): {
    implementation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isNullReference = /null|nulo|reference/i.test(description);
    const isIndexError = /index|array|lista/i.test(description);
    const isValidationError = /validação|validation|campo/i.test(description);

    if (isNullReference) {
      return {
        implementation: `
// Implementar verificações de null safety
try 
{
    if (oCompany?.GetByKey(docEntry) == true)
    {
        // Verificar se objeto não é null antes de usar
        if (oDocument != null && !string.IsNullOrEmpty(oDocument.CardCode))
        {
            // Processar documento
        }
        else
        {
            throw new ArgumentNullException("Documento ou CardCode inválido");
        }
    }
}
catch (Exception ex)
{
    Logger.Error($"Erro ao processar documento {docEntry}: {ex.Message}");
    throw;
}`,
        complexity: 2,
        riskLevel: 1,
        suggestions: [
          'Implementar null checks em todos os pontos críticos',
          'Usar operador ?. quando disponível',
          'Adicionar logs detalhados para debug',
          'Criar testes unitários para cenários null'
        ]
      };
    }

    if (isIndexError) {
      return {
        implementation: `
// Implementar verificações de bounds
try
{
    var items = oDocument.Lines;
    for (int i = 0; i < items.Count; i++)
    {
        items.SetCurrentLine(i);
        
        // Verificar se índice é válido
        if (i >= 0 && i < items.Count)
        {
            var itemCode = items.ItemCode;
            // Processar item
        }
    }
}
catch (IndexOutOfRangeException ex)
{
    Logger.Error($"Erro de índice: {ex.Message}");
    throw new InvalidOperationException("Índice inválido na coleção");
}`,
        complexity: 2,
        riskLevel: 2,
        suggestions: [
          'Sempre verificar Count antes de acessar índices',
          'Usar foreach quando possível',
          'Implementar validação de ranges',
          'Adicionar logs para debug de índices'
        ]
      };
    }

    return {
      implementation: 'Implementar correção específica baseada na análise detalhada do erro.',
      complexity: 3,
      riskLevel: 3,
      suggestions: [
        'Reproduzir erro em ambiente controlado',
        'Adicionar logging detalhado',
        'Implementar tratamento de exceções',
        'Criar testes de regressão'
      ]
    };
  }

  private generateFeatureCode(description: string): {
    implementation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isCrud = /criar|editar|excluir|listar/i.test(description);
    const isCalculation = /calcular|cálculo|fórmula/i.test(description);
    const isValidation = /validar|validação|regra/i.test(description);

    if (isCrud) {
      return {
        implementation: `
// Implementar operações CRUD com Service Layer
public class DocumentService
{
    private readonly ILogger _logger;
    private readonly SAPConnection _connection;

    public async Task<DocumentResponse> CreateDocumentAsync(DocumentRequest request)
    {
        try
        {
            // Validar entrada
            ValidateRequest(request);
            
            // Conectar ao SAP
            var company = await _connection.GetCompanyAsync();
            
            // Criar documento
            var oDocument = (Documents)company.GetBusinessObject(BoObjectTypes.oOrders);
            
            // Preencher campos
            oDocument.CardCode = request.CustomerCode;
            oDocument.DocDate = DateTime.Now;
            
            // Adicionar linhas
            foreach (var line in request.Lines)
            {
                oDocument.Lines.ItemCode = line.ItemCode;
                oDocument.Lines.Quantity = line.Quantity;
                oDocument.Lines.Add();
            }
            
            // Salvar
            var result = oDocument.Add();
            if (result != 0)
            {
                var error = company.GetLastErrorDescription();
                throw new SAPException($"Erro ao criar documento: {error}");
            }
            
            var docEntry = company.GetNewObjectKey();
            _logger.LogInformation($"Documento criado: {docEntry}");
            
            return new DocumentResponse { DocEntry = int.Parse(docEntry) };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar documento");
            throw;
        }
    }
}`,
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Implementar padrão Repository',
          'Usar injeção de dependência',
          'Adicionar validações robustas',
          'Implementar transações quando necessário'
        ]
      };
    }

    if (isCalculation) {
      return {
        implementation: `
// Implementar cálculos com precisão decimal
public class CalculationService
{
    public decimal CalculateTotal(List<LineItem> items, decimal taxRate = 0)
    {
        try
        {
            decimal subtotal = 0;
            
            foreach (var item in items)
            {
                // Usar decimal para precisão
                var lineTotal = item.Quantity * item.UnitPrice;
                var discount = lineTotal * (item.DiscountPercent / 100);
                subtotal += lineTotal - discount;
            }
            
            // Aplicar impostos
            var tax = subtotal * (taxRate / 100);
            var total = subtotal + tax;
            
            // Arredondar para 2 casas decimais
            return Math.Round(total, 2, MidpointRounding.AwayFromZero);
        }
        catch (Exception ex)
        {
            Logger.Error($"Erro no cálculo: {ex.Message}");
            throw new CalculationException("Erro ao calcular total", ex);
        }
    }
}`,
        complexity: 2,
        riskLevel: 2,
        suggestions: [
          'Sempre usar decimal para valores monetários',
          'Implementar arredondamento consistente',
          'Validar entradas antes de calcular',
          'Criar testes com casos extremos'
        ]
      };
    }

    return {
      implementation: 'Implementar feature seguindo padrões SAP B1 e boas práticas de desenvolvimento.',
      complexity: 3,
      riskLevel: 2,
      suggestions: [
        'Seguir padrões de nomenclatura SAP',
        'Implementar logging adequado',
        'Usar async/await para operações I/O',
        'Criar documentação inline'
      ]
    };
  }

  private generateIntegrationCode(description: string): {
    implementation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isApi = /api|rest|webservice/i.test(description);
    const isFile = /arquivo|file|csv|xml/i.test(description);

    if (isApi) {
      return {
        implementation: `
// Implementar integração API com retry e circuit breaker
public class ApiIntegrationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger _logger;
    private readonly RetryPolicy _retryPolicy;

    public async Task<ApiResponse<T>> CallApiAsync<T>(ApiRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            // Implementar retry com backoff exponencial
            var response = await _retryPolicy.ExecuteAsync(async () =>
            {
                var httpResponse = await _httpClient.PostAsync(request.Endpoint, content);
                
                if (!httpResponse.IsSuccessStatusCode)
                {
                    var error = await httpResponse.Content.ReadAsStringAsync();
                    throw new ApiException($"API Error: {httpResponse.StatusCode} - {error}");
                }
                
                return httpResponse;
            });
            
            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ApiResponse<T>>(responseJson);
            
            _logger.LogInformation($"API call successful: {request.Endpoint}");
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"API call failed: {request.Endpoint}");
            throw;
        }
    }
}`,
        complexity: 4,
        riskLevel: 3,
        suggestions: [
          'Implementar circuit breaker pattern',
          'Usar HttpClientFactory',
          'Implementar cache quando apropriado',
          'Adicionar métricas de performance'
        ]
      };
    }

    if (isFile) {
      return {
        implementation: `
// Implementar processamento de arquivo com streaming
public class FileProcessingService
{
    public async Task<ProcessResult> ProcessFileAsync(string filePath)
    {
        var result = new ProcessResult();
        
        try
        {
            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
            
            var records = csv.GetRecordsAsync<ImportRecord>();
            var batch = new List<ImportRecord>();
            
            await foreach (var record in records)
            {
                // Validar registro
                if (ValidateRecord(record))
                {
                    batch.Add(record);
                    
                    // Processar em lotes de 100
                    if (batch.Count >= 100)
                    {
                        await ProcessBatchAsync(batch);
                        result.ProcessedCount += batch.Count;
                        batch.Clear();
                    }
                }
                else
                {
                    result.ErrorCount++;
                    _logger.LogWarning($"Registro inválido: {record}");
                }
            }
            
            // Processar último lote
            if (batch.Any())
            {
                await ProcessBatchAsync(batch);
                result.ProcessedCount += batch.Count;
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Erro ao processar arquivo: {filePath}");
            throw;
        }
    }
}`,
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Usar streaming para arquivos grandes',
          'Implementar validação robusta',
          'Processar em lotes para performance',
          'Implementar rollback em caso de erro'
        ]
      };
    }

    return {
      implementation: 'Implementar integração seguindo padrões de resiliência e performance.',
      complexity: 4,
      riskLevel: 3,
      suggestions: [
        'Implementar retry logic',
        'Usar async/await consistentemente',
        'Adicionar logging detalhado',
        'Implementar monitoramento'
      ]
    };
  }

  private generateGenericCode(description: string): {
    implementation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      implementation: `
// Template base para implementação SAP B1
public class SAPBusinessLogic
{
    private readonly ILogger _logger;
    private readonly ISAPConnection _connection;

    public async Task<Result> ExecuteBusinessLogicAsync(BusinessRequest request)
    {
        try
        {
            // 1. Validar entrada
            ValidateInput(request);
            
            // 2. Conectar ao SAP
            var company = await _connection.GetCompanyAsync();
            
            // 3. Executar lógica de negócio
            var result = await ProcessBusinessLogic(company, request);
            
            // 4. Log e retorno
            _logger.LogInformation("Operação executada com sucesso");
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro na execução da lógica de negócio");
            throw;
        }
    }
    
    private void ValidateInput(BusinessRequest request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
            
        // Adicionar validações específicas
    }
}`,
      complexity: 3,
      riskLevel: 2,
      suggestions: [
        'Definir estrutura clara do código',
        'Implementar validações adequadas',
        'Usar padrões de design apropriados',
        'Adicionar testes unitários'
      ]
    };
  }
}

// =====================================================
// AGENTE DBA ESPECIALISTA
// =====================================================

export class DBAAgent extends BaseAgent {
  constructor() {
    super(
      'dba',
      'DBA Especialista',
      '🗄️',
      'Performance e integridade',
      'Qual o impacto na performance?'
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Analisando impacto no banco: ${context.description}`);

    try {
      const analysis = this.performDatabaseAnalysis(context);
      
      const confidence = this.calculateConfidence({
        complexity: analysis.complexity,
        familiarity: 4, // Banco SAP B1 é conhecido
        riskLevel: analysis.riskLevel,
        dataQuality: 4,
      });

      return this.formatResponse(
        analysis.recommendation,
        confidence,
        analysis.suggestions
      );
    } catch (error) {
      this.logger.error('Erro na análise de banco:', error);
      return this.formatResponse(
        'Erro na análise de performance. Recomendo análise manual do impacto.',
        0.1
      );
    }
  }

  private performDatabaseAnalysis(context: AgentContext): {
    recommendation: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const { description } = context;
    
    const hasQuery = /query|select|update|insert|delete/i.test(description);
    const hasLargeData = /milhares|milhões|grande volume|lote/i.test(description);
    const hasJoins = /join|relacionamento|tabelas/i.test(description);
    const hasAggregation = /sum|count|group|agregação/i.test(description);

    if (hasLargeData) {
      return {
        recommendation: 'ATENÇÃO: Grande volume de dados detectado. Implemente paginação, use índices apropriados e considere processamento em lotes. Monitore locks e deadlocks.',
        complexity: 4,
        riskLevel: 4,
        suggestions: [
          'Implementar paginação com OFFSET/FETCH',
          'Criar índices nas colunas de filtro',
          'Usar NOLOCK apenas quando apropriado',
          'Monitorar tempo de execução das queries',
          'Considerar particionamento de tabelas',
          'Implementar timeout adequado'
        ]
      };
    }

    if (hasJoins && hasAggregation) {
      return {
        recommendation: 'Queries complexas com JOINs e agregações podem impactar performance. Use índices compostos, considere views materializadas e otimize WHERE clauses.',
        complexity: 4,
        riskLevel: 3,
        suggestions: [
          'Criar índices compostos para JOINs',
          'Usar EXISTS ao invés de IN quando possível',
          'Filtrar dados o mais cedo possível',
          'Considerar views para queries recorrentes',
          'Analisar execution plan',
          'Implementar cache para resultados estáveis'
        ]
      };
    }

    if (hasQuery) {
      return {
        recommendation: 'Para operações de banco, sempre use parâmetros para evitar SQL injection. Implemente transações para operações múltiplas e monitore performance.',
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Usar parâmetros em todas as queries',
          'Implementar transações quando necessário',
          'Adicionar índices nas colunas de busca',
          'Monitorar tempo de execução',
          'Implementar retry para deadlocks',
          'Usar connection pooling'
        ]
      };
    }

    return {
      recommendation: 'Considere o impacto no banco de dados. Valide se operações são necessárias e otimize acesso aos dados.',
      complexity: 2,
      riskLevel: 2,
      suggestions: [
        'Minimizar acessos ao banco',
        'Usar cache quando apropriado',
        'Implementar lazy loading',
        'Monitorar uso de recursos'
      ]
    };
  }
}

// =====================================================
// AGENTE QA ANALYST
// =====================================================

export class QAAgent extends BaseAgent {
  constructor() {
    super(
      'qa',
      'QA Analyst',
      '🧪',
      'Edge cases e testes',
      'Onde pode quebrar?'
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    this.logger.info(`Analisando cenários de teste: ${context.description}`);

    try {
      const analysis = this.performQAAnalysis(context);
      
      const confidence = this.calculateConfidence({
        complexity: analysis.complexity,
        familiarity: 4, // QA é nossa especialidade
        riskLevel: analysis.riskLevel,
        dataQuality: 4,
      });

      return this.formatResponse(
        analysis.testStrategy,
        confidence,
        analysis.suggestions
      );
    } catch (error) {
      this.logger.error('Erro na análise de QA:', error);
      return this.formatResponse(
        'Erro na análise de qualidade. Recomendo revisão manual dos cenários.',
        0.1
      );
    }
  }

  private performQAAnalysis(context: AgentContext): {
    testStrategy: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const { description, todo } = context;
    const type = todo?.type || 'feature';

    if (type === 'bug') {
      return this.analyzeBugTesting(description);
    } else if (type === 'integration') {
      return this.analyzeIntegrationTesting(description);
    } else {
      return this.analyzeFeatureTesting(description);
    }
  }

  private analyzeBugTesting(description: string): {
    testStrategy: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      testStrategy: 'Para correção de bugs: 1) Reproduzir erro consistentemente, 2) Criar teste que falha, 3) Implementar correção, 4) Validar que teste passa, 5) Executar testes de regressão.',
      complexity: 3,
      riskLevel: 3,
      suggestions: [
        'Criar caso de teste específico para o bug',
        'Testar cenários similares (regressão)',
        'Validar em diferentes ambientes',
        'Testar com dados reais e sintéticos',
        'Verificar logs de erro detalhados',
        'Testar performance após correção'
      ]
    };
  }

  private analyzeIntegrationTesting(description: string): {
    testStrategy: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    return {
      testStrategy: 'Para integrações: Teste cenários de sucesso, falha de rede, timeout, dados inválidos, volumes grandes e recuperação de erro. Use mocks para testes unitários.',
      complexity: 4,
      riskLevel: 4,
      suggestions: [
        'Testar com API indisponível',
        'Simular timeout de rede',
        'Testar com dados malformados',
        'Validar retry logic',
        'Testar com volumes grandes',
        'Verificar logs de auditoria',
        'Testar rollback em caso de erro',
        'Validar idempotência'
      ]
    };
  }

  private analyzeFeatureTesting(description: string): {
    testStrategy: string;
    complexity: number;
    riskLevel: number;
    suggestions: string[];
  } {
    const isCrud = /criar|editar|excluir|listar/i.test(description);
    const isCalculation = /calcular|cálculo/i.test(description);
    const isUI = /tela|interface|formulário/i.test(description);

    if (isCrud) {
      return {
        testStrategy: 'Para CRUD: Teste criação com dados válidos/inválidos, edição de registros existentes/inexistentes, exclusão com/sem dependências, listagem com filtros e paginação.',
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Testar validações de entrada',
          'Testar com dados nos limites',
          'Verificar permissões de usuário',
          'Testar concorrência (dois usuários)',
          'Validar integridade referencial',
          'Testar com caracteres especiais'
        ]
      };
    }

    if (isCalculation) {
      return {
        testStrategy: 'Para cálculos: Teste com valores zero, negativos, decimais, muito grandes, muito pequenos. Valide precisão, arredondamento e casos extremos.',
        complexity: 3,
        riskLevel: 3,
        suggestions: [
          'Testar com valores zero e negativos',
          'Validar precisão decimal',
          'Testar overflow/underflow',
          'Verificar arredondamento',
          'Testar com dados históricos',
          'Validar fórmulas complexas'
        ]
      };
    }

    if (isUI) {
      return {
        testStrategy: 'Para UI: Teste em diferentes browsers, resoluções, com/sem JavaScript, acessibilidade, usabilidade e responsividade.',
        complexity: 3,
        riskLevel: 2,
        suggestions: [
          'Testar em Chrome, Firefox, Edge',
          'Validar responsividade mobile',
          'Testar acessibilidade (WCAG)',
          'Verificar performance de carregamento',
          'Testar com dados reais',
          'Validar navegação por teclado'
        ]
      };
    }

    return {
      testStrategy: 'Implementar testes abrangentes cobrindo cenários positivos, negativos e extremos. Usar pirâmide de testes: unitários, integração, E2E.',
      complexity: 3,
      riskLevel: 2,
      suggestions: [
        'Criar testes unitários primeiro',
        'Implementar testes de integração',
        'Adicionar testes E2E críticos',
        'Usar dados de teste realistas',
        'Implementar testes de performance',
        'Criar documentação de testes'
      ]
    };
  }
}

