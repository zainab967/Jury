import { 
  LayoutDashboard, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  FileText,
  Scale,
  Shield,
  Layers
} from "lucide-react"
import { NavLink } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser } from "@/contexts/UserContext"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Activities", url: "/activities", icon: Calendar },
  { title: "Expenses", url: "/expenses", icon: DollarSign },
  { title: "Penalties", url: "/penalties", icon: AlertTriangle },
  { title: "Logs", url: "/logs", icon: FileText },
  { title: "Tiers", url: "/tiers", icon: Layers },
]

export function AppSidebar() {
  const { user, isJury } = useUser()
  
  // Filter items based on user role
  const visibleItems = isJury ? items : items.filter(item => item.url === "/")
  
  return (
    <Sidebar variant="sidebar" className="border-r bg-[linear-gradient(135deg,_hsl(221,83%,23%)_0%,_hsl(172,49%,39%)_100%)] text-white min-w-[64px] max-w-[16rem] ">
      <SidebarContent>
        {/* App Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Jury Tracker</h1>
              <p className="text-xs text-white/70">Management System</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 text-white/60 tracking-wide font-semibold">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 text-white text-base h-[44px] ${
                          isActive 
                            ? "bg-[#0f766e] text-white shadow-sm" // sea green
                            : "hover:bg-[#128076]/90 hover:text-white focus-visible:bg-[#128076] text-white/80"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="flex-grow" /> {/* Grow space before user info */}
        {/* User Info */}
        <div className="mb-4 mt-8 p-4 border-t border-white/20 rounded-xl bg-white/5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="h-4 w-4 text-white/80" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{user?.name}</p>
              <p className="text-xs text-white/70">{isJury ? 'Jury Access' : 'Employee Access'}</p>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}