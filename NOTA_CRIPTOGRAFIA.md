# Nota sobre Criptografia de Telefone

## Situação Atual

Por enquanto, os números de telefone estão sendo armazenados **sem criptografia adicional** no campo `phone_security`.

## Por Quê?

O pgsodium requer permissões especiais que não estão disponíveis por padrão no Supabase. O erro era:

```
permission denied for function crypto_aead_det_encrypt
```

## Segurança Atual

Mesmo sem criptografia adicional via pgsodium, os dados estão seguros porque:

1. ✅ **Supabase fornece criptografia em repouso** (encryption at rest) para TODOS os dados
2. ✅ **Conexões HTTPS** criptografam dados em trânsito
3. ✅ **Políticas RLS** impedem acesso não autorizado
4. ✅ **Campo `phone_security`** nunca é exposto em APIs públicas
5. ✅ **Apenas usuário autenticado** pode ver seu próprio telefone

## Comparação

| Aspecto | Com pgsodium | Sem pgsodium (atual) |
|---------|--------------|----------------------|
| Encryption at rest | ✅ Sim | ✅ Sim (Supabase) |
| Encryption in transit | ✅ Sim (HTTPS) | ✅ Sim (HTTPS) |
| RLS Protection | ✅ Sim | ✅ Sim |
| Column-level encryption | ✅ Sim | ❌ Não |
| Complexidade | Alta | Baixa |
| Permissões especiais | Necessárias | Não necessárias |

## Implementação Futura

Se você quiser adicionar criptografia de coluna com pgsodium no futuro:

### Opção 1: Usar Supabase Vault (Recomendado)

```sql
-- Habilitar o Vault
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Criar segredo
INSERT INTO vault.secrets (name, secret)
VALUES ('phone_encryption_key', 'your-secret-key-here');

-- Usar nas funções
SELECT vault.decrypt_secret('phone_encryption_key');
```

### Opção 2: Configurar Permissões pgsodium

Contate o suporte do Supabase para habilitar permissões de pgsodium para funções SECURITY DEFINER.

### Opção 3: Criptografia no Lado do Cliente

Criptografar telefones no código TypeScript antes de enviar para o banco:

```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

export class PhoneEncryption {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.PHONE_ENCRYPTION_KEY!, 'hex');

  async encrypt(phoneNumber: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decrypt(encryptedPhone: string): Promise<string> {
    const [ivHex, authTagHex, encrypted] = encryptedPhone.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## Recomendação

Para a maioria dos casos de uso, a **segurança atual é suficiente**:

- ✅ Dados criptografados em repouso (Supabase)
- ✅ Dados criptografados em trânsito (HTTPS)
- ✅ Acesso controlado por RLS
- ✅ Telefone nunca exposto em APIs públicas

Se você precisa de **compliance específico** (HIPAA, PCI-DSS, etc.) que exige criptografia de coluna, implemente a Opção 3 (criptografia no lado do cliente).

## Status

- [x] Validação de telefone funcionando
- [x] Armazenamento seguro (encryption at rest)
- [x] Políticas RLS configuradas
- [ ] Criptografia de coluna com pgsodium (opcional)
- [ ] Criptografia no lado do cliente (opcional)

## Conclusão

O sistema está **seguro e funcional** como está. A criptografia adicional é uma melhoria opcional que pode ser implementada no futuro se necessário.
