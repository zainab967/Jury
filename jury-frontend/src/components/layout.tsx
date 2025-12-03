import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserRoleToggle } from "@/components/UserRoleToggle"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col w-full">
          <header className="h-16 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm flex items-center">
            <div className="flex h-16 items-center px-6 w-full">
              <SidebarTrigger className="mr-4" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Jury Management System</h2>
              </div>
              <div className="flex items-center gap-4">
                <UserRoleToggle />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="flex-1 flex flex-col items-center w-full">
            <div className="w-full max-w-full px-4 md:px-8 py-8 md:py-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}