# Guia de Uso - Sistema de Verificação de Perfil

## Para Profissionais

### Como Verificar Seu Perfil

1. **Acesse a página de verificação**
   - Faça login no portal
   - Acesse `/portal/verification`

2. **Prepare sua documentação**
   - Documento oficial com foto (RG ou CNH)
   - Boa iluminação
   - Câmera ou smartphone

3. **Tire a selfie**
   - Segure o documento aberto ao lado do rosto
   - Certifique-se de que ambos estejam visíveis
   - A foto deve estar nítida

4. **Envie a solicitação**
   - Selecione o tipo de documento (RG ou CNH)
   - Faça upload da selfie
   - Clique em "Enviar Solicitação"

5. **Aguarde a revisão**
   - Status mudará para "Em Análise"
   - Revisão geralmente leva até 48 horas
   - Você será notificado do resultado

### Status da Verificação

- **Não Verificado**: Você ainda não enviou uma solicitação
- **Em Análise**: Sua solicitação está sendo revisada
- **Verificado**: Seu perfil foi aprovado! O selo aparecerá no catálogo
- **Rejeitado**: Sua solicitação foi rejeitada. Veja o motivo e tente novamente
- **Expirado**: Sua verificação expirou após 90 dias. Envie uma nova solicitação

### Dicas para Aprovação

✅ **Faça:**
- Use boa iluminação
- Mantenha o documento aberto na página com foto
- Certifique-se de que seu rosto e o documento estejam visíveis
- Use uma foto nítida e de alta qualidade

❌ **Evite:**
- Fotos desfocadas ou escuras
- Documento fechado ou parcialmente visível
- Rosto coberto ou não visível
- Fotos editadas ou com filtros

### Validade

- Verificações são válidas por **90 dias**
- Você receberá um lembrete 7 dias antes da expiração
- Após expirar, você pode enviar uma nova solicitação

### Limites

- Máximo de **3 submissões por dia**
- Se rejeitado, você pode reenviar imediatamente (não conta no limite)

## Para Administradores

### Como Revisar Verificações

1. **Acesse o painel admin**
   - Faça login como administrador
   - Acesse `/admin/verification`

2. **Revise as solicitações pendentes**
   - Visualize a selfie com documento
   - Verifique se o rosto e documento estão visíveis
   - Confirme que o documento é legítimo

3. **Tome uma decisão**
   - **Aprovar**: Se tudo estiver correto
   - **Rejeitar**: Se houver problemas (obrigatório informar motivo)

### Critérios de Aprovação

✅ **Aprovar se:**
- Rosto da pessoa está claramente visível
- Documento oficial está aberto e legível
- Foto do documento corresponde à pessoa na selfie
- Imagem está nítida e sem edições

❌ **Rejeitar se:**
- Documento não está visível ou está fechado
- Rosto não está visível ou está coberto
- Foto está muito escura ou desfocada
- Documento parece falsificado
- Foto do documento não corresponde à pessoa

### Motivos Comuns de Rejeição

- "Documento não está visível na foto"
- "Foto está muito escura ou desfocada"
- "Rosto não está claramente visível"
- "Documento está fechado ou parcialmente coberto"
- "Foto do documento não corresponde à pessoa na selfie"

### Após Aprovação

- Status muda para "Verificado"
- Selo aparece automaticamente no catálogo e perfil público
- Verificação expira em 90 dias
- Sistema registra sua ação no log de auditoria

### Após Rejeição

- Profissional pode ver o motivo da rejeição
- Profissional pode enviar nova solicitação imediatamente
- Sistema registra sua ação no log de auditoria

## Perguntas Frequentes

### Para Profissionais

**P: Quanto tempo leva a revisão?**
R: Geralmente até 48 horas úteis.

**P: Posso usar CNH digital?**
R: Sim, desde que a foto esteja nítida e legível.

**P: O que acontece se minha verificação for rejeitada?**
R: Você verá o motivo da rejeição e poderá enviar uma nova solicitação imediatamente.

**P: Preciso verificar novamente após 90 dias?**
R: Sim, para manter a confiança dos usuários, verificações expiram após 90 dias.

**P: Minhas fotos ficam armazenadas?**
R: Sim, mas em um bucket privado e seguro. Após 30 dias da aprovação/rejeição, as imagens são deletadas.

### Para Administradores

**P: Posso aprovar verificações em lote?**
R: Não, cada verificação deve ser revisada individualmente para garantir qualidade.

**P: O que fazer se suspeitar de fraude?**
R: Rejeite a solicitação com motivo detalhado. Se necessário, entre em contato com a equipe de segurança.

**P: Posso reverter uma decisão?**
R: Não diretamente. O profissional precisará enviar uma nova solicitação.

## Suporte

Para problemas técnicos ou dúvidas, entre em contato com o suporte técnico.
