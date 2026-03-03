# Bugfix Requirements Document

## Introduction

Este documento descreve o bug relacionado ao erro "Could not find the 'cep' column of 'profiles' in the schema cache" que ocorre ao tentar salvar o perfil antes de fazer upload de fotos. O problema é causado pela presença dos campos `cep` e `street_number` no estado do formulário do frontend, que não existem na tabela `profiles` do banco de dados. Embora esses campos sejam removidos do payload antes do envio para a API, o Supabase está tentando validá-los contra o schema em algum momento do processo, causando o erro.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o usuário preenche o formulário de perfil com os campos `cep` e `street_number` presentes no estado do formulário THEN o sistema retorna o erro "Could not find the 'cep' column of 'profiles' in the schema cache" ao tentar salvar o perfil

1.2 WHEN o usuário tenta fazer upload de fotos após preencher o perfil THEN o sistema falha devido ao erro de schema cache relacionado aos campos inexistentes

1.3 WHEN o formulário é inicializado com os campos `cep` e `street_number` no estado THEN esses campos são mantidos no estado do componente mesmo não existindo no schema do banco de dados

### Expected Behavior (Correct)

2.1 WHEN o usuário preenche o formulário de perfil sem os campos `cep` e `street_number` no estado THEN o sistema SHALL salvar o perfil com sucesso sem erros de schema cache

2.2 WHEN o usuário tenta fazer upload de fotos após preencher o perfil THEN o sistema SHALL processar o upload com sucesso sem erros relacionados a campos inexistentes

2.3 WHEN o formulário é inicializado THEN o estado SHALL conter apenas os campos que existem no schema da tabela `profiles` do banco de dados

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o usuário preenche os campos obrigatórios do perfil (display_name, slug, category, short_description, long_description, city, region) THEN o sistema SHALL CONTINUE TO validar e salvar esses campos corretamente

3.2 WHEN o usuário preenche campos opcionais válidos (latitude, longitude, age_attribute, external_links, pricing_packages) THEN o sistema SHALL CONTINUE TO processar e salvar esses campos corretamente

3.3 WHEN o usuário navega entre as abas do formulário (basic, location, availability, pricing, links, photos) THEN o sistema SHALL CONTINUE TO manter o estado do formulário e permitir navegação sem perda de dados

3.4 WHEN o usuário busca um endereço através de uma API externa (ViaCEP) THEN o sistema SHALL CONTINUE TO preencher automaticamente os campos city e region com base nos dados retornados

3.5 WHEN o usuário salva o perfil com coordenadas de latitude e longitude THEN o sistema SHALL CONTINUE TO calcular e armazenar o geohash corretamente
