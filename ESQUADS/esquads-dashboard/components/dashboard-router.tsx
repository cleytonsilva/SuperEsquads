'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { StudentDashboardLayout } from "@/components/student/student-dashboard-layout"
import { AdminDashboardLayout } from "@/components/admin/admin-dashboard-layout"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RoleSwitcher } from "@/components/role-switcher"
import { CyberpunkLanding } from "@/components/landing/cyberpunk-landing"
import { AuthForm } from "@/components/auth/auth-form"
import { ProfileSetup } from "@/components/profile/profile-setup"

export function DashboardRouter() {
  const { user, isLoading, needsProfileSetup, userRole, canAccessAdmin } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const router = useRouter()

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Show landing page if user is not logged in and auth form is not requested
  if (!user && !showAuth) {
    return <CyberpunkLanding onLogin={() => router.push('/auth')} />
  }

  // Show auth form if requested or if user is not logged in and auth was requested
  if (!user && showAuth) {
    return <AuthForm onAuthSuccess={() => setShowAuth(false)} />
  }

  // Handle profile setup if needed
  if (user && needsProfileSetup) {
    return <ProfileSetup />
  }

  // Route based on user permissions
  if (user) {
    return (
      <div className="min-h-screen">
        {/* Demo Role Switcher - Remove in production */}
        <RoleSwitcher />

        {canAccessAdmin() ? (
          <AdminDashboardLayout />
        ) : (
          <StudentDashboardLayout />
        )}
      </div>
    )
  }

  // Fallback
  return <LoadingSpinner />
}