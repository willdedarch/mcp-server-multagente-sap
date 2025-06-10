#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY RÁPIDO - SAP B1 MULTI-AGENT
# =====================================================

echo "🚀 Iniciando deploy do Sistema SAP B1 Multi-Agent..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando exemplo..."
    cp .env.example .env
    echo "📝 Configure o arquivo .env com suas credenciais antes de continuar"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo "   - DEFAULT_PROJECT_ID"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build. Verifique os erros acima."
    exit 1
fi

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📥 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Deploy na Vercel
echo "🌐 Fazendo deploy na Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure as variáveis de ambiente na Vercel:"
    echo "   vercel env add SUPABASE_URL"
    echo "   vercel env add SUPABASE_ANON_KEY"
    echo "   vercel env add DEFAULT_PROJECT_ID"
    echo ""
    echo "2. Configure o banco de dados Supabase:"
    echo "   - Execute o schema SQL fornecido"
    echo "   - Verifique as permissões RLS"
    echo ""
    echo "3. Configure o Claude Project:"
    echo "   - Adicione os arquivos do CLAUDE_PROJECT_SETUP.md"
    echo "   - Configure a URL do servidor MCP"
    echo ""
    echo "4. Teste o sistema:"
    echo "   - Execute /status no Claude"
    echo "   - Crie seu primeiro TODO com /criar"
    echo ""
    echo "🎉 Sistema pronto para uso!"
else
    echo "❌ Erro no deploy. Verifique sua configuração da Vercel."
    exit 1
fi

