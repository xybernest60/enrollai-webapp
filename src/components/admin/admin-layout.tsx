
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Users,
  CalendarCheck,
  LayoutGrid,
  Settings,
  UserPlus,
  Home,
  LogIn,
  Clock,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/enroll", label: "Enroll", icon: UserPlus },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/sessions", label: "Sessions", icon: Clock },
  { href: "/check-in", label: "Check-in Kiosk", icon: LogIn },
  { href: "/", label: "Home", icon: Home },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader />
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <ThemeToggle />
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings" asChild isActive={pathname === "/admin/settings"}>
                        <Link href="/admin/settings">
                            <Settings />
                            <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
            <div className="flex items-center gap-2">
                <SidebarTrigger/>
                <h1 className="text-lg font-semibold font-headline">Admin</h1>
            </div>
            <ThemeToggle />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
