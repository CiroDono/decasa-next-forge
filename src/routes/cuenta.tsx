import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/cuenta")({ component: Cuenta });

function Cuenta() {
  return (
    <Layout>
      <div className="container-x py-20 max-w-md text-center">
        <Construction className="size-12 mx-auto text-primary" strokeWidth={1.5} />
        <h1 className="font-display text-3xl mt-4">Mi cuenta</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Estamos preparando el sistema de registro y login con Supabase Auth.
          Próximamente vas a poder ver tu historial de compras, direcciones guardadas y seguimiento de pedidos.
        </p>
        <Link
          to="/productos"
          className="inline-block mt-6 bg-primary text-primary-foreground px-5 py-2.5 font-display tracking-wide hover:bg-primary/90"
        >
          Seguir comprando
        </Link>
      </div>
    </Layout>
  );
}
