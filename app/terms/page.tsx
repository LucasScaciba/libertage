import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/login">
            <Button variant="ghost">← Voltar</Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e usar a plataforma Libertage, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Uso da Plataforma</h2>
            <p className="text-muted-foreground">
              A Libertage é uma plataforma de marketplace para profissionais prestadores de serviços premium. Você concorda em usar a plataforma apenas para fins legais e de acordo com estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Conta de Usuário</h2>
            <p className="text-muted-foreground">
              Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em aceitar a responsabilidade por todas as atividades que ocorram em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Conteúdo do Usuário</h2>
            <p className="text-muted-foreground">
              Você mantém todos os direitos sobre o conteúdo que publica na plataforma. No entanto, ao publicar conteúdo, você concede à Libertage uma licença para usar, modificar e exibir esse conteúdo na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Pagamentos e Assinaturas</h2>
            <p className="text-muted-foreground">
              Os planos pagos são cobrados mensalmente. Você pode cancelar sua assinatura a qualquer momento através do portal de gerenciamento de assinatura.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Continuando a usar a plataforma após as modificações, você concorda com os novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre estes termos, entre em contato através do email: contato@libertage.com
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
