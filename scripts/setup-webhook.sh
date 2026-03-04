#!/bin/bash

# Script para configurar webhooks do Stripe
# Uso: ./scripts/setup-webhook.sh

set -e

echo "🔧 Configuração de Webhooks do Stripe"
echo "======================================"
echo ""

# Verificar se Stripe CLI está instalado
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI não encontrado!"
    echo ""
    echo "Instale com:"
    echo "  macOS:   brew install stripe/stripe-cli/stripe"
    echo "  Linux:   wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz"
    echo "  Windows: scoop install stripe"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI encontrado"
echo ""

# Verificar se está logado
if ! stripe config --list &> /dev/null; then
    echo "🔐 Fazendo login no Stripe..."
    stripe login
    echo ""
fi

echo "✅ Autenticado no Stripe"
echo ""

# Perguntar qual porta usar
read -p "Em qual porta seu servidor está rodando? [3000]: " PORT
PORT=${PORT:-3000}

echo ""
echo "🚀 Iniciando túnel de webhooks..."
echo "   Endpoint: http://localhost:$PORT/api/webhooks/stripe"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Copie o 'webhook signing secret' que aparecerá abaixo"
echo "   2. Adicione ao arquivo .env.local:"
echo "      STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
echo "   3. Reinicie seu servidor (npm run dev)"
echo ""
echo "Pressione Ctrl+C para parar"
echo ""
echo "======================================"
echo ""

# Iniciar listener
stripe listen --forward-to "localhost:$PORT/api/webhooks/stripe"
