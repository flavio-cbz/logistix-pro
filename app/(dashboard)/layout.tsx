import type React from "react"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { AppHeader } from "@/components/layout/app-header"
import { NotificationList } from "@/components/features/notifications/notification-list"
import { AuthButton } from "@/components/auth/auth-button"
import { getSessionUser } from "@/lib/services/auth"
import { redirect } from "next/navigation"

// Améliorons la gestion de l'authentification dans le layout du dashboard
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  console.log("DashboardLayout - Utilisateur:", user ? user.username : "non authentifié")

  if (!user) {
    console.log("DashboardLayout - Redirection vers /login")
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <AuthButton user={user} />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <AppHeader />
        {children}
      </main>
      <NotificationList />
    </div>
  )
}
