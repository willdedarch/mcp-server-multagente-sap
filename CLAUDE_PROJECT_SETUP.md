# Instruções para Claude Project - Sistema SAP B1 Multi-Agent

## Configuração do Claude Project

### 1. Arquivos para adicionar ao Knowledge:

#### projeto_id.txt
```
PROJ-ABC-001
```

#### multi_agent_sap_b1.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sap_b1_multiagent_system>
  <description>
    Sistema Multi-Agente SAP B1 TODO que transforma necessidades em tarefas estruturadas
    através de análise multi-agente, preservando contexto e gerando código real.
  </description>
  
  <agents>
    <agent name="architect" emoji="🏗️" focus="Soluções simples e pragmáticas" />
    <agent name="developer" emoji="💻" focus="Código REAL que funciona" />
    <agent name="dba" emoji="🗄️" focus="Performance e integridade" />
    <agent name="qa" emoji="🧪" focus="Edge cases e testes" />
    <agent name="business" emoji="📊" focus="Processo SAP real" />
    <agent name="po" emoji="🎯" focus="Priorização e valor" />
  </agents>
  
  <commands>
    <command name="analise" description="Análise profunda sem criar tarefas" />
    <command name="criar" description="Cria TODO com análise multi-agente" />
    <command name="executar" description="Executa task específica com código real" />
    <command name="confirmar" description="Confirma que código funcionou" />
    <command name="erro" description="Reporta erro no código gerado" />
    <command name="continuar" description="Retoma trabalho de onde parou" />
    <command name="status" description="Visão geral do projeto" />
  </commands>
  
  <workflow>
    <step>1. Usuário descreve necessidade</step>
    <step>2. Sistema analisa com 6 agentes</step>
    <step>3. Gera TODO com tasks sequenciais</step>
    <step>4. Executa tasks uma por vez</step>
    <step>5. Aguarda confirmação do usuário</step>
    <step>6. Preserva contexto entre sessões</step>
  </workflow>
  
  <principles>
    <principle>Código sempre real e funcional</principle>
    <principle>Contexto nunca perdido</principle>
    <principle>Análises reutilizáveis</principle>
    <principle>Confirmação explícita obrigatória</principle>
    <principle>Pragmatismo sobre perfeição</principle>
  </principles>
</sap_b1_multiagent_system>
```

#### regras_negocio.md (exemplo)
```markdown
# Regras de Negócio - Cliente ABC

## Configurações SAP B1
- Versão: 10.0 FP 2208
- Database: ABC_PROD
- Server: SAP-SRV-01

## Regras Fiscais
- ICMS: Sempre calcular por dentro
- IPI: Aplicar apenas para produtos industrializados
- PIS/COFINS: Regime cumulativo

## Processos Específicos
- Aprovação de pedidos acima de R$ 10.000
- Comissão de vendas: 3% sobre valor líquido
- Estoque mínimo: 30 dias de giro

## Integrações Ativas
- API Correios para frete
- NFe com Sefaz
- Boletos com banco Itaú
```

### 2. URL do Servidor MCP
Após deploy na Vercel, adicionar a URL:
```
https://your-project.vercel.app
```

### 3. Variáveis de Ambiente na Vercel
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DEFAULT_PROJECT_ID=PROJ-ABC-001
NODE_ENV=production
LOG_LEVEL=INFO
```

## Como Usar

### Primeira Conversa
```
/status
→ Mostra estado inicial

/analise visão geral do sistema
→ Entende o que existe

/criar primeira integração
→ Começa desenvolvimento
```

### Comandos Essenciais
- `/criar [tipo] [descrição]` - Novo TODO
- `/executar [número]` - Executa task
- `/confirmar` - Confirma sucesso
- `/erro [descrição]` - Reporta problema
- `/continuar` - Retoma trabalho
- `/status` - Visão geral

### Fluxo Típico
1. Descrever necessidade
2. Sistema cria TODO com análise multi-agente
3. Executar tasks sequencialmente
4. Confirmar cada etapa
5. Sistema preserva contexto automaticamente

## Características Importantes

### Multi-Projeto
- Cada cliente = 1 Claude Project
- Contexto 100% isolado
- Troca de projeto = troca de Claude Project

### Preservação de Contexto
- NUNCA perde onde parou
- Stack infinito de contextos
- Recuperação perfeita pós-erro

### Código Real
- SEMPRE código que compila
- SEMPRE com error handling
- SEMPRE seguindo padrões SAP
- NUNCA pseudo-código

### Análises Persistentes
- Conhecimento acumulado
- Não re-analisa mesmo código
- Evolução documentada
- Busca em análises anteriores

## Regras Fundamentais

1. **Git sempre primeiro** - Verifica branch e busca código existente
2. **Contexto sempre preservado** - Nunca perde trabalho
3. **Código sempre real** - Compila e funciona
4. **Análise sempre salva** - Conhecimento acumulado
5. **Confirmação sempre explícita** - Usuário valida sucesso

## Filosofia do Sistema

- **Pragmatismo > Perfeição**
- **Simplicidade > Complexidade**
- **Código real > Teoria**
- **Incremental > Big Bang**
- **Contexto > Memória**

