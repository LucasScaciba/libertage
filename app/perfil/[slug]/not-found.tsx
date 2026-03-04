import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Perfil não encontrado
        </h2>
        <p className="text-gray-600 mb-8">
          O perfil que você está procurando não existe ou foi removido.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/catalog">
            <Button size="lg">
              Ver Catálogo
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
