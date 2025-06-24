'use client'

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Shield } from "lucide-react"

export function RoleSwitcher() {
  const { user, switchRole } = useAuth()

  if (!user) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <Badge variant={user.role === "student" ? "default" : "secondary"} className="flex items-center gap-1">
          {user.role === "student" ? <UserCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
          {user.role === "student" ? "Student" : "Administrator"}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => switchRole(user.role === "student" ? "administrator" : "student")}
        >
          Switch to {user.role === "student" ? "Admin" : "Student"}
        </Button>
      </div>
    </div>
  )
}