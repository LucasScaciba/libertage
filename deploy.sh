#!/bin/bash

echo "🚀 Preparando deploy para produção..."
echo ""

# Verificar se há mudanças
if [[ -z $(git status -s) ]]; then
    echo "✅ Nenhuma mudança para commitar"
    exit 0
fi

echo "📦 Arquivos que serão commitados:"
git status -s
echo ""

# Adicionar todos os arquivos
echo "➕ Adicionando arquivos..."
git add .

# Commit
echo "💾 Criando commit..."
git commit -m "feat: stories system, profile verification, external links, and profile restructure

Features:
- Stories system with 24h expiration
- Profile verification with document upload
- External links (Linktree-style)
- Profile page restructure with custom slugs
- Phone validation with OTP
- Stories carousel on catalog page
- Auto-play story viewer with navigation
- Cover photo in story avatars

Migrations:
- 009_stories_system.sql
- 010_profile_verification_system.sql
- 011_stories_rls_policies.sql
- 012_external_links_system.sql
- 013_profile_page_restructure_EXECUTE_THIS.sql

Storage:
- Created 'stories' bucket for video uploads

Cron Jobs:
- /api/cron/expire-stories (hourly)
- /api/cron/expire-verifications (daily)"

echo ""
echo "✅ Commit criado com sucesso!"
echo ""
echo "🔄 Fazendo push para origin/main..."
git push origin main

echo ""
echo "✅ Deploy iniciado!"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse o Vercel Dashboard para acompanhar o deploy"
echo "2. Execute as migrations no Supabase de produção (ver DEPLOYMENT_GUIDE.md)"
echo "3. Crie o bucket 'stories' no Supabase Storage"
echo "4. Configure os cron jobs no Vercel"
echo "5. Teste as funcionalidades após o deploy"
echo ""
echo "📖 Consulte DEPLOYMENT_GUIDE.md para instruções detalhadas"
