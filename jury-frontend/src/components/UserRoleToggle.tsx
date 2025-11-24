import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Shield, User, LogOut } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useNavigate } from "react-router-dom"

export function UserRoleToggle() {
  const { user, setUser, isJury } = useUser()
  const navigate = useNavigate()

  const handleLogout = () => {
    setUser(null)
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isJury ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
          {user?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}