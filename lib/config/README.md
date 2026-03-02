# Configuração de Características e Serviços

Este diretório contém o arquivo de configuração para as características e serviços exibidos no perfil.

## Arquivo: features-services.json

### Estrutura

```json
{
  "categories": [
    {
      "id": "identificador-unico",
      "name": "Nome da Categoria",
      "description": "Descrição da categoria",
      "multiSelect": true,
      "options": [
        "Opção 1",
        "Opção 2",
        "Opção 3"
      ]
    }
  ]
}
```

### Campos

- **id**: Identificador único da categoria (usado internamente, não é exibido)
- **name**: Nome da categoria exibido na interface
- **description**: Descrição da categoria (opcional, para documentação)
- **multiSelect**: `true` para permitir múltiplas seleções (checkbox), `false` para seleção única (radio button)
- **options**: Array com as opções disponíveis para seleção

### Como Editar

1. Abra o arquivo `features-services.json`
2. Edite os valores dentro de `options` de cada categoria
3. Adicione ou remova opções conforme necessário
4. Salve o arquivo
5. Reinicie o servidor de desenvolvimento (`npm run dev`)

### Adicionar Nova Categoria

Para adicionar uma nova categoria, adicione um novo objeto no array `categories`:

```json
{
  "id": "nova-categoria",
  "name": "Nova Categoria",
  "description": "Descrição da nova categoria",
  "multiSelect": true,
  "options": [
    "Opção A",
    "Opção B",
    "Opção C"
  ]
}
```

### Seleção Única vs Múltipla

- **multiSelect: true** - Exibe checkboxes, permite selecionar várias opções
  - Exemplo: Idiomas, Serviços Oferecidos, Diferenciais
  
- **multiSelect: false** - Exibe radio buttons, permite selecionar apenas uma opção
  - Exemplo: Estilo de Atendimento (só pode ter um estilo principal)

### Remover Categoria

Para remover uma categoria, simplesmente delete o objeto correspondente do array `categories`.

### Dicas

- Use nomes descritivos e claros para as opções
- Mantenha a consistência no formato (ex: "Atributo: Valor")
- Organize as opções em ordem lógica ou alfabética
- Teste após cada alteração para garantir que tudo funciona

### Exemplo de Uso

Os usuários poderão selecionar múltiplas opções de cada categoria ao editar seus perfis. As opções selecionadas serão exibidas no perfil público.
