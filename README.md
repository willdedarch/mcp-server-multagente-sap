# 🚀 Sistema Multi-Agente SAP B1 TODO

Sistema inteligente que transforma qualquer necessidade SAP B1 em tarefas estruturadas através de análise multi-agente, preservando contexto completo e gerando código real de produção.

## 📋 Visão Geral

### O que é
- **Sistema Multi-Agente**: 6 agentes especializados analisam cada problema
- **Servidor MCP**: Integração nativa com Claude via Model Context Protocol
- **Contexto Preservado**: Nunca perde onde parou entre sessões
- **Código Real**: Gera código SAP B1 que funciona na prática
- **Análises Reutilizáveis**: Conhecimento acumulado e consultável

### Problema que Resolve
- ✅ Desenvolvimento SAP B1 desorganizado
- ✅ Perda de contexto entre tarefas
- ✅ Retrabalho por falta de documentação
- ✅ Código que não funciona na prática
- ✅ Análises repetidas do mesmo código

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Claude Project                   │
│  ├── 📄 multi_agent_sap_b1.xml          │
│  ├── 📄 projeto_id.txt → "PROJ-ABC-001" │
│  └── 📄 regras_negocio_cliente.md       │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│         MCP Server (Node.js)             │
│  ├── Comandos de análise                 │
│  ├── Gerenciamento de TODOs              │
│  └── Preservação de contexto             │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      Supabase (PostgreSQL)               │
│  ├── projects                            │
│  ├── todos & tasks                       │
│  ├── analyses                            │
│  └── context_stack                       │
└─────────────────────────────────────────┘
```

## 👥 Agentes do Sistema

### 1. **Arquiteto de Soluções** 🏗️
- **Foco**: Soluções simples e pragmáticas
- **Questão**: "Qual a solução mais simples?"
- **Especialidade**: Service Layer > DI API > B1if

### 2. **Desenvolvedor Sênior** 💻
- **Foco**: Código REAL que funciona
- **Questão**: "Como fazer funcionar HOJE?"
- **Especialidade**: C#/.NET, SAP SDK patterns

### 3. **DBA Especialista** 🗄️
- **Foco**: Performance e integridade
- **Questão**: "Qual o impacto na performance?"
- **Especialidade**: Queries, índices, locks

### 4. **QA Analyst** 🧪
- **Foco**: Edge cases e testes
- **Questão**: "Onde pode quebrar?"
- **Especialidade**: Cenários de erro, validação

### 5. **Analista de Negócios** 📊
- **Foco**: Processo SAP real
- **Questão**: "Isso resolve o problema real?"
- **Especialidade**: ROI, impacto no usuário

### 6. **Product Owner** 🎯
- **Foco**: Priorização e valor
- **Questão**: "É isso que devemos fazer agora?"
- **Especialidade**: Time to market, risk vs reward

## 📝 Comandos Disponíveis

### Comandos Principais

#### `/analise [descrição]`
Análise profunda sem criar tarefas.
```
/analise fluxo completo de faturamento
→ Mapeia todo processo
→ Documenta regras
→ Salva análise: ANALYSIS-123
```

#### `/criar [tipo] [descrição]`
Cria novo TODO com análise multi-agente.
```
/criar integração API Correios
→ 6 agentes analisam
→ Gera TODO com tasks sequenciais
→ Mostra plano completo
```

#### `/executar [número]`
Executa task específica com código real.
```
/executar 1
→ Implementa task 1
→ Gera código SAP B1 real
→ AGUARDA confirmação
```

#### `/confirmar`
Confirma que código funcionou.
```
/confirmar
→ Marca task como completa
→ Sugere próxima task
→ Atualiza progresso
```

#### `/erro [descrição]`
Reporta erro no código gerado.
```
/erro null reference linha 45
→ Analisa erro no contexto
→ Corrige código
→ Mantém na mesma task
```

#### `/continuar`
Retoma trabalho de onde parou.
```
/continuar
→ Carrega contexto completo
→ Mostra task atual
→ Próximas ações
```

#### `/status`
Visão geral do projeto.
```
/status
→ TODOs ativos e progresso
→ Bugs pendentes
→ Análises salvas
→ Métricas
```

## 🚀 Setup e Deploy

### 1. Configuração do Banco de Dados

1. Criar projeto no [Supabase](https://supabase.com)
2. Executar o schema SQL:
```sql
-- Copiar e executar: sap-b1-database-complete-schema.sql
```

### 2. Configuração das Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
DEFAULT_PROJECT_ID=PROJ-ABC-001
```

### 3. Instalação e Build

```bash
# Instalar dependências
npm install

# Build do projeto
npm run build

# Desenvolvimento local
npm run dev
```

### 4. Deploy na Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente na Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add DEFAULT_PROJECT_ID
```

### 5. Configuração no Claude

1. Criar novo Claude Project
2. Adicionar ao Knowledge:
   - `projeto_id.txt` com ID do projeto
   - `multi_agent_sap_b1.xml` com instruções
   - `regras_negocio.md` (opcional)

## 📁 Estrutura do Projeto

```
sap-b1-multiagent/
├── src/
│   ├── agents/           # Sistema de agentes
│   │   ├── base.ts       # Classe base e Arquiteto
│   │   ├── specialists.ts # Dev, DBA, QA
│   │   ├── business.ts   # Analista e PO
│   │   └── orchestrator.ts # Coordenador
│   ├── commands/         # Processamento de comandos
│   │   └── processor.ts  # Lógica dos comandos
│   ├── database/         # Acesso ao banco
│   │   └── service.ts    # Cliente Supabase
│   ├── types/           # Tipos TypeScript
│   │   └── index.ts     # Definições de tipos
│   ├── utils/           # Utilitários
│   │   ├── context.ts   # Gerenciador de contexto
│   │   └── logger.ts    # Sistema de logging
│   └── server.ts        # Servidor MCP principal
├── dist/                # Build output
├── tests/               # Testes (opcional)
├── docs/                # Documentação
├── package.json         # Dependências
├── tsconfig.json        # Config TypeScript
├── vercel.json          # Config Vercel
└── README.md           # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- **Node.js** + **TypeScript** - Runtime e linguagem
- **MCP SDK** - Model Context Protocol para Claude
- **Supabase** - Banco de dados PostgreSQL
- **Zod** - Validação de schemas
- **Vercel** - Deploy serverless
- **ESLint** - Qualidade de código

## 🎯 Fluxo de Trabalho Típico

### 1. Nova Implementação
```
1. /criar integração X
2. Sistema analisa com 6 agentes
3. Gera TODO com tasks sequenciais
4. /executar 1
5. [código gerado]
6. Testa código
7. /confirmar ou /erro
8. Repete até concluir
```

### 2. Correção de Bug
```
1. /criar bug: descrição
2. QA classifica
3. Dev identifica causa
4. /executar 1 (reproduzir)
5. /executar 2 (corrigir)
6. /confirmar
```

### 3. Análise de Processo
```
1. /analise-fluxo processo Y
2. Sistema mapeia tudo
3. Salva ANALYSIS-789
4. Consultável sempre
5. Não gera TODOs
```

## 💾 Banco de Dados

### Tabelas Principais
- **projects** - Projetos SAP B1
- **todos** - TODOs com consenso multi-agente
- **tasks** - Tasks sequenciais de cada TODO
- **analyses** - Análises salvas e reutilizáveis
- **context_stack** - Contexto preservado
- **bugs** - Bugs reportados e correções

### Recursos Avançados
- **Full-text search** nas análises
- **Triggers** para estatísticas automáticas
- **Índices otimizados** para performance
- **Soft delete** para auditoria

## 🔒 Segurança

- ✅ Validação de entrada com Zod
- ✅ Sanitização de queries SQL
- ✅ Rate limiting (configurável)
- ✅ Logs de auditoria
- ✅ Variáveis de ambiente seguras

## 📊 Monitoramento

- **Logs estruturados** com níveis configuráveis
- **Métricas de performance** dos agentes
- **Estatísticas de uso** por projeto
- **Alertas de erro** automáticos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/sap-b1-multiagent/server/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/sap-b1-multiagent/server/wiki)
- **Email**: suporte@sap-b1-multiagent.com

---

**Desenvolvido com ❤️ para a comunidade SAP B1**

