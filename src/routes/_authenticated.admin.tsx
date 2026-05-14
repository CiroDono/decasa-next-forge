import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession, useIsAdmin } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import { LayoutDashboard, Package, ShoppingBag, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, loading } = useSession();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !roleLoading && user && !isAdmin) navigate({ to: "/" });
  }, [loading, roleLoading, user, isAdmin, navigate]);

  if (loading || roleLoading || !isAdmin) {
    return <Layout><div className="container-x py-20 text-center text-muted-foreground">Verificando permisos...</div></Layout>;
  }

  const tabs = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/productos", label: "Productos", icon: Package, exact: false },
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
    { to: "/admin/usuarios", label: "Usuarios", icon: Users, exact: false },
  ];

  return (
    <Layout>
      <div className="container-x py-8">
        <h1 className="font-display text-3xl mb-1">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mb-6">Gestión de productos, pedidos y usuarios</p>

        <div className="flex border-b border-border mb-8 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 whitespace-nowrap border-b-2 -mb-px ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="size-4" /> {t.label}
              </Link>
            );
          })}
        </div>

        <Outlet />
      </div>
    </Layout>
  );
}
