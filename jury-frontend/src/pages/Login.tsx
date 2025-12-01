import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Shield, User } from "lucide-react"
import { authApi } from "@/api"
import type { LoginPayload } from "@/api"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"jury" | "employee">("jury")
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useUser()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload: LoginPayload = { email, password }
      const response = await authApi.login(payload)
      
      // Debug: Log the full response to see what role is being returned
      console.log("=== LOGIN DEBUG ===")
      console.log("Full login response:", JSON.stringify(response, null, 2))
      console.log("User object:", response.user)
      console.log("User role value:", response.user.role)
      console.log("User role type:", typeof response.user.role)
      console.log("User role stringified:", JSON.stringify(response.user.role))
      
      // Map backend role to frontend role
      // Backend enum: EMPLOYEE = 0, JURY = 1
      // With JsonStringEnumConverter, it should return "EMPLOYEE" or "JURY" as strings
      // But it might also return 0 or 1 as numbers
      let frontendRole: "jury" | "employee" = "employee"
      
      const roleValue = response.user.role
      const roleStr = String(roleValue).trim().toUpperCase()
      
      console.log("Role string after conversion:", roleStr)
      
      // Check for JURY role (multiple formats)
      // Backend may return: "JURY", "jury", 1, or "1" (depending on serialization)
      if (
        roleStr === "JURY" || 
        roleStr === "JURY" ||
        roleValue === 1 || 
        roleStr === "1" ||
        roleValue === "JURY" ||
        roleValue === "jury" ||
        roleValue === "Jury"
      ) {
        frontendRole = "jury"
        console.log("✅ Mapped to JURY role")
      } 
      // Check for EMPLOYEE role
      // Backend may return: "EMPLOYEE", "employee", 0, or "0"
      else if (
        roleStr === "EMPLOYEE" || 
        roleStr === "EMPLOYEE" ||
        roleValue === 0 || 
        roleStr === "0" ||
        roleValue === "EMPLOYEE" ||
        roleValue === "employee" ||
        roleValue === "Employee"
      ) {
        frontendRole = "employee"
        console.log("✅ Mapped to EMPLOYEE role")
      } 
      // Default fallback
      else {
        console.warn("⚠️ Unknown role value, defaulting to employee. Role was:", roleValue, "Type:", typeof roleValue)
        frontendRole = "employee"
      }
      
      console.log("Final mapped frontend role:", frontendRole)
      console.log("=== END LOGIN DEBUG ===")
      
      setUser({
        id: response.user.id,
        name: response.user.name,
        role: frontendRole,
      })
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.name}!`
      })
      navigate("/")
    } catch (error: any) {
      console.error("Login error:", error)
      console.error("Error response:", error?.response?.data)
      console.error("Error status:", error?.response?.status)
      console.error("Error code:", error?.code)
      console.error("Error message:", error?.message)
      
      // Handle network errors (no response from server)
      if (!error?.response) {
        const isNetworkError = error?.code === "ERR_NETWORK" || 
                              error?.code === "ECONNREFUSED" ||
                              error?.message?.includes("Network Error") ||
                              error?.message?.includes("Failed to fetch")
        
        if (isNetworkError) {
          toast({
            title: "Connection Error",
            description: "Cannot connect to the server. Please make sure the backend is running on http://localhost:5163",
            variant: "destructive"
          })
          return
        }
      }
      
      // Handle validation errors (400 Bad Request from ValidationProblem)
      let errorMessage = "Invalid email or password"
      
      if (error?.response?.status === 400) {
        const responseData = error?.response?.data
        
        // Check for ValidationProblem format (ASP.NET Core)
        if (responseData?.errors) {
          // Extract first validation error
          const firstError = Object.values(responseData.errors)[0] as string[]
          if (firstError && firstError.length > 0) {
            errorMessage = firstError[0]
          } else {
            errorMessage = responseData?.title || "Validation failed. Please check your input."
          }
        } else if (responseData?.message) {
          errorMessage = responseData.message
        } else if (responseData?.error?.message) {
          errorMessage = responseData.error.message
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Invalid email or password"
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fillTestCredentials = () => {
    // Test credentials from database
    if (role === "jury") {
      setEmail("admin@juryharmony.com")
      setPassword("admin123") // You'll need to know the actual password
    } else {
      setEmail("employee@juryharmony.com")
      setPassword("employee123") // You'll need to know the actual password
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={role} onValueChange={(value: "jury" | "employee") => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jury">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Jury/Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={fillTestCredentials}
            >
              Fill Test Credentials ({role})
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">Test Credentials:</p>
            <div className="text-xs space-y-1">
              <p><strong>Note:</strong> Use valid credentials from your backend</p>
              <p className="text-muted-foreground mt-2">
                The login now connects to your backend API at localhost:5163
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
