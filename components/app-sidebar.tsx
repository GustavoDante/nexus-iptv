"use client"

import {
    Clapperboard,
    Command,
    Film,
    Heart,
    Home,
    LogOut,
    Tv,
    User
} from "lucide-react"
import * as React from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.username);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Memoizar a configuração de navegação para evitar recriação a cada render
  const navMain = React.useMemo(() => [
    {
      title: "Navegação",
      items: [
        {
          title: "Início",
          url: "/dashboard",
          icon: Home,
          isActive: pathname === "/dashboard",
        },
        {
          title: "Ao Vivo",
          url: "/dashboard/live",
          icon: Tv,
          isActive: pathname.startsWith("/dashboard/live"),
        },
        {
          title: "Filmes",
          url: "/dashboard/movies",
          icon: Film,
          isActive: pathname.startsWith("/dashboard/movies"),
        },
        {
          title: "Séries",
          url: "/dashboard/series",
          icon: Clapperboard,
          isActive: pathname.startsWith("/dashboard/series"),
        },
        {
          title: "Favoritos",
          url: "/dashboard/favorites",
          icon: Heart,
          isActive: pathname === "/dashboard/favorites",
        },
      ],
    },
  ], [pathname]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-zinc-800 bg-black text-zinc-400">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:size-8!">
              <Link href="/dashboard" className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-white">Nexus IPTV</span>
                  <span className="truncate text-xs">Premium Player</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                <User className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-white">{user || 'Usuário'}</span>
                <span className="truncate text-xs">Conectado</span>
              </div>
              <LogOut className="ml-auto size-4 group-data-[collapsible=icon]:hidden cursor-pointer hover:text-white transition-colors" onClick={handleLogout}/>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
