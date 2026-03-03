import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost">← Voltar</Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground">
              Coletamos informações que você nos fornece diretamente, como nome, email, e informações de perfil quando você se cadastra na plataforma Libertage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Como Usamos suas Informações</h2>
            <p className="text-muted-foreground">
              Usamos as informações coletadas para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Responder a seus comentários e perguntas</li>
              <li>Enviar informações técnicas e atualizações</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
            <p className="text-muted-foreground">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Com seu consentimento</li>
              <li>Para cumprir com obrigações legais</li>
              <li>Com provedores de serviços que nos ajudam a operar a plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Segurança dos Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
            <p className="text-muted-foreground">
              Usamos cookies e tecnologias similares para melhorar sua experiência na plataforma, analisar tendências e administrar o site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos</h2>
            <p className="text-muted-foreground">
              Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Entre em contato conosco para exercer esses direitos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta política de privacidade periodicamente. Notificaremos você sobre quaisquer mudanças publicando a nova política nesta página.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre esta política de privacidade, entre em contato através do email: privacidade@libertage.com
            </p>
          </section>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </div>
    </div>
  );
}
