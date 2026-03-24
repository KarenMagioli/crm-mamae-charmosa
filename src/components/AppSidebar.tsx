import { LayoutDashboard, Users, ShoppingBag, Package, DollarSign, ClipboardList, XCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Funil de Vendas", url: "/leads", icon: Users },
  { title: "Vendas", url: "/vendas", icon: ShoppingBag },
  { title: "Vendas Perdidas", url: "/vendas-perdidas", icon: XCircle },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Produção", url: "/producao", icon: ClipboardList },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-sidebar-border">
            <h1 className="text-lg font-bold text-primary">💖 Mamãe Charmosa</h1>
            <p className="text-xs text-muted-foreground">CRM</p>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center pb-3 mb-2 border-b border-sidebar-border">
            <span className="text-xl">💖</span>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/60 transition-colors"
                      activeClassName="bg-accent text-accent-foreground font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
