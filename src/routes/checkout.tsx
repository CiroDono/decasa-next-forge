import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  return (
    <Layout>
      <div className="container-x py-20 max-w-md text-center">
        <Construction className="size-12 mx-auto text-primary" strokeWidth={1.5} />
        <h1 className="font-display text-3xl mt-4">Checkout</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Próximamente: integración con Mercado Pago, retiro en local y envíos.
          Mientras tanto podés finalizar tu pedido contactándonos por WhatsApp.
        </p>
        <Link
          to="/carrito"
          className="inline-block mt-6 bg-primary text-primary-foreground px-5 py-2.5 font-display tracking-wide hover:bg-primary/90"
        >
          Volver al carrito
        </Link>
      </div>
    </Layout>
  );
}
