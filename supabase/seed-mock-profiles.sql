-- Script para inserir perfis mockados no banco de dados
-- Execute este script no Supabase SQL Editor

-- Primeiro, você precisa criar usuários mockados (substitua os UUIDs pelos IDs reais dos seus usuários de teste)
-- Ou crie usuários de teste através do Supabase Auth Dashboard

-- Exemplo de inserção de perfis mockados
-- IMPORTANTE: Substitua 'USER_ID_AQUI' pelos UUIDs reais dos usuários que você criar

-- Perfil 1: Maria Silva - Fotografia
INSERT INTO profiles (
  user_id,
  display_name,
  slug,
  short_description,
  full_description,
  category,
  city,
  region,
  country,
  phone,
  email,
  website,
  status,
  is_published
) VALUES (
  'USER_ID_1_AQUI'::uuid,
  'Maria Silva',
  'maria-silva-fotografia',
  'Fotógrafa profissional especializada em eventos corporativos e casamentos. Mais de 10 anos de experiência capturando momentos únicos.',
  'Fotógrafa profissional com mais de 10 anos de experiência no mercado. Especializada em eventos corporativos, casamentos e ensaios fotográficos. Trabalho com equipamentos de última geração e ofereço um serviço completo, desde o planejamento até a entrega das fotos editadas. Meu objetivo é capturar momentos únicos e transformá-los em memórias eternas.',
  'Fotografia',
  'São Paulo',
  'SP',
  'Brasil',
  '+55 11 98765-4321',
  'maria.silva@example.com',
  'https://mariasilva.com.br',
  'active',
  true
);

-- Perfil 2: João Santos - Design
INSERT INTO profiles (
  user_id,
  display_name,
  slug,
  short_description,
  full_description,
  category,
  city,
  region,
  country,
  phone,
  email,
  website,
  status,
  is_published
) VALUES (
  'USER_ID_2_AQUI'::uuid,
  'João Santos',
  'joao-santos-design',
  'Designer gráfico e UI/UX com foco em identidade visual e experiência do usuário. Projetos para startups e empresas consolidadas.',
  'Designer gráfico e UI/UX com 8 anos de experiência criando identidades visuais marcantes e interfaces intuitivas. Trabalho com startups e empresas consolidadas, desenvolvendo desde logos até sistemas completos de design. Meu processo é colaborativo e focado em entender profundamente as necessidades do cliente e do usuário final.',
  'Design',
  'Rio de Janeiro',
  'RJ',
  'Brasil',
  '+55 21 98765-4321',
  'joao.santos@example.com',
  'https://joaosantos.design',
  'active',
  true
);

-- Perfil 3: Ana Costa - Marketing
INSERT INTO profiles (
  user_id,
  display_name,
  slug,
  short_description,
  full_description,
  category,
  city,
  region,
  country,
  phone,
  email,
  website,
  status,
  is_published
) VALUES (
  'USER_ID_3_AQUI'::uuid,
  'Ana Costa',
  'ana-costa-consultoria',
  'Consultora de marketing digital com especialização em estratégias de crescimento e gestão de redes sociais para pequenas e médias empresas.',
  'Consultora de marketing digital com 12 anos de experiência ajudando pequenas e médias empresas a crescerem online. Especializada em estratégias de crescimento, gestão de redes sociais, SEO e campanhas de anúncios. Meu trabalho é baseado em dados e focado em resultados mensuráveis que impactam diretamente o faturamento dos meus clientes.',
  'Marketing',
  'Belo Horizonte',
  'MG',
  'Brasil',
  '+55 31 98765-4321',
  'ana.costa@example.com',
  'https://anacosta.com.br',
  'active',
  true
);

-- Perfil 4: Carlos Oliveira - Tecnologia
INSERT INTO profiles (
  user_id,
  display_name,
  slug,
  short_description,
  full_description,
  category,
  city,
  region,
  country,
  phone,
  email,
  website,
  status,
  is_published
) VALUES (
  'USER_ID_4_AQUI'::uuid,
  'Carlos Oliveira',
  'carlos-oliveira-dev',
  'Desenvolvedor full-stack especializado em React, Node.js e cloud computing. Criação de aplicações web escaláveis e performáticas.',
  'Desenvolvedor full-stack com 15 anos de experiência construindo aplicações web escaláveis e performáticas. Especializado em React, Node.js, TypeScript e cloud computing (AWS, Google Cloud). Trabalho com metodologias ágeis e tenho experiência tanto em startups quanto em grandes corporações. Meu foco é entregar código limpo, testado e documentado.',
  'Tecnologia',
  'Curitiba',
  'PR',
  'Brasil',
  '+55 41 98765-4321',
  'carlos.oliveira@example.com',
  'https://carlosoliveira.dev',
  'active',
  true
);

-- Perfil 5: Patrícia Lima - Arquitetura
INSERT INTO profiles (
  user_id,
  display_name,
  slug,
  short_description,
  full_description,
  category,
  city,
  region,
  country,
  phone,
  email,
  website,
  status,
  is_published
) VALUES (
  'USER_ID_5_AQUI'::uuid,
  'Patrícia Lima',
  'patricia-lima-arquitetura',
  'Arquiteta com expertise em projetos residenciais e comerciais. Foco em sustentabilidade e design contemporâneo que valoriza cada espaço.',
  'Arquiteta com 10 anos de experiência em projetos residenciais e comerciais. Meu trabalho é pautado pela sustentabilidade e pelo design contemporâneo, sempre buscando criar espaços que valorizem a funcionalidade e o bem-estar dos usuários. Ofereço um serviço completo, desde o projeto arquitetônico até o acompanhamento da obra.',
  'Arquitetura',
  'Porto Alegre',
  'RS',
  'Brasil',
  '+55 51 98765-4321',
  'patricia.lima@example.com',
  'https://patricialima.arq.br',
  'active',
  true
);

-- Nota: Para adicionar fotos aos perfis, você precisará:
-- 1. Fazer upload das imagens para o storage bucket 'profile-media'
-- 2. Inserir os registros na tabela 'media' com os profile_ids correspondentes
-- 3. As URLs das imagens do Unsplash usadas no mock são:
--    - Maria Silva: https://images.unsplash.com/photo-1554048612-b6a482bc67e5
--    - João Santos: https://images.unsplash.com/photo-1561070791-2526d30994b5
--    - Ana Costa: https://images.unsplash.com/photo-1573496359142-b8d87734a5a2
--    - Carlos Oliveira: https://images.unsplash.com/photo-1519085360753-af0119f7cbe7
--    - Patrícia Lima: https://images.unsplash.com/photo-1580489944761-15a19d654956
