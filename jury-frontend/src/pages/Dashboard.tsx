
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usersApi, penaltiesApi, logsApi, authApi } from "@/api"
import type { User, CreatePenaltyPayload } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Utensils, 
  Cake, 
  Cookie, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  DollarSign,
  Activity,
  Plus,
  Coffee,
  CheckCircle,
  Info,
  Eye,
  UserPlus
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

const mischief_items = [
  {
    id: "lunch",
    name: "Lunch",
    price: 100,
    icon: Utensils,
    description: "Penalty for lunch-related violations",
    color: "bg-red-500",
    count: 45,
    size: "large"
  },
  {
    id: "cake",
    name: "Cake",
    price: 50,
    icon: Cake,
    description: "Penalty for cake-related violations",
    color: "bg-pink-500",
    count: 23,
    size: "medium"
  },
  {
    id: "samosa",
    name: "Samosa",
    price: 30,
    icon: Cookie,
    description: "Penalty for samosa-related violations",
    color: "bg-orange-500",
    count: 67,
    size: "large"
  },
  {
    id: "tea",
    name: "Tea",
    price: 20,
    icon: Coffee,
    description: "Penalty for tea-related violations",
    color: "bg-green-500",
    count: 89,
    size: "large"
  },
  {
    id: "snacks",
    name: "Snacks",
    price: 25,
    icon: Cookie,
    description: "Penalty for snack-related violations",
    color: "bg-yellow-500",
    count: 34,
    size: "medium"
  }
]

const stats = [
  {
    title: "Total Penalties",
    value: "135",
    icon: AlertTriangle,
    trend: "+12%"
  },
  {
    title: "Total Collection",
    value: "PKR 8,450",
    icon: DollarSign,
    trend: "+23%"
  },
  {
    title: "Active Members",
    value: "24",
    icon: Users,
    trend: "+5%"
  },
  {
    title: "Activities",
    value: "8",
    icon: Activity,
    trend: "+2"
  }
]

export default function Dashboard() {
  const { isJury, user, setUser } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // Safety check - if user is not set, show loading or redirect
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]) // Now stores user IDs
  const [selectAll, setSelectAll] = useState(false)
  const [isRecordsDialogOpen, setIsRecordsDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  
  // New Jury appointment state
  const [isNewJuryDialogOpen, setIsNewJuryDialogOpen] = useState(false)
  const [selectedJuryMembers, setSelectedJuryMembers] = useState<string[]>([])
  const [isAppointingJury, setIsAppointingJury] = useState(false)

  // Fetch users from API - with error handling to prevent blank screen
  const usersQuery = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        return await usersApi.getAll()
      } catch (error: any) {
        console.error("Failed to fetch users:", error)
        // Return empty array instead of throwing to prevent component crash
        return []
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const users = (usersQuery.data && Array.isArray(usersQuery.data)) ? usersQuery.data : []
  
  // Log errors for debugging
  useEffect(() => {
    if (usersQuery.isError) {
      console.error("Users query error:", usersQuery.error)
      // Show a non-blocking error message
      if (usersQuery.error) {
        console.warn("Users API call failed - dashboard will render with limited functionality")
      }
    }
  }, [usersQuery.isError, usersQuery.error])

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([])
      setSelectAll(false)
    } else {
      setSelectedMembers(users.map(u => u.id))
      setSelectAll(true)
    }
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setIsDialogOpen(true)
  }

  const handleRecordClick = (item: any) => {
    setSelectedRecord(item)
    setIsRecordsDialogOpen(true)
  }

  const handleAddPenalty = async () => {
    if (!selectedCategory || selectedMembers.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select both category and members",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Map category to amount based on tier pricing (default amounts)
      const categoryAmounts: Record<string, number> = {
        lunch: 5500, // Default lunch amount
        cake: 1000,  // Default cake amount
        samosa: 80,  // Default samosa amount
      }

      const amount = categoryAmounts[selectedCategory] || 0
      const categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
      const penaltyReason = reason.trim() || "Penalty from dashboard"

      // Create penalty and log for each selected user
      await Promise.all(
        selectedMembers.map(async (userId) => {
          // Create penalty
          const penalty = await penaltiesApi.create({
            userId,
            category: categoryName,
            reason: penaltyReason,
            description: description.trim() || undefined,
            amount,
            status: "pending",
            date: new Date().toISOString(),
          })

          // Create log entry for the penalty (log is associated with the user who received the penalty)
          try {
            await logsApi.create({
              userId, // The user who received the penalty
              action: "added",
              result: `${categoryName} penalty: ${penaltyReason}${description.trim() ? ` - ${description.trim()}` : ''} (Amount: PKR ${amount})`,
            })
          } catch (logError) {
            // Log creation failure shouldn't block penalty creation
            console.error("Failed to create log entry:", logError)
          }

          return penalty
        })
      )

      setIsSubmitting(false)
      setIsDialogOpen(false)
      setSelectedCategory("")
      setSelectedMembers([])
      setSelectAll(false)
      setReason("")
      setDescription("")
      
      // Invalidate queries to refresh data (logs are auto-created by backend when penalty is created)
      queryClient.invalidateQueries({ queryKey: ["penalties"] })
      queryClient.invalidateQueries({ queryKey: ["logs"] })
      
      toast({
        title: "Success!",
        description: `Penalty added for ${selectedMembers.length} member(s). Logs have been automatically updated.`,
      })
    } catch (error: any) {
      console.error("Failed to add penalty:", error)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to add penalty. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 p-4 rounded-md bg-muted text-muted-foreground text-sm flex items-start justify-between gap-3">
        <span>Overview of team activities, collections, and penalties. <a href="https://example.com/why-dashboard" className="underline underline-offset-2 text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Why this dashboard?</a></span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        {isJury && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNewJuryDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Jury
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl sm:mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Penalty</DialogTitle>
                <DialogDescription>
                  Add a new penalty for selected members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Members</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                      <input
                        type="checkbox"
                        id="dashboard-select-all"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                      <Label htmlFor="dashboard-select-all" className="font-medium">Select All Members</Label>
                    </div>
                    <div className="space-y-2">
                      {usersQuery.isLoading ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No users available</p>
                      ) : (
                        users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`dashboard-member-${user.id}`}
                              checked={selectedMembers.includes(user.id)}
                              onChange={() => handleMemberToggle(user.id)}
                              className="rounded"
                              disabled={isSubmitting}
                            />
                            <Label htmlFor={`dashboard-member-${user.id}`}>{user.name}</Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {selectedMembers.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedMembers.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dashboard-category">Category</Label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="cake">Cake</SelectItem>
                      <SelectItem value="samosa">Samosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dashboard-reason">Reason</Label>
                  <Input 
                    id="dashboard-reason" 
                    placeholder="Reason for penalty" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dashboard-description">Description</Label>
                  <Textarea 
                    id="dashboard-description" 
                    placeholder="Additional details..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Count is not manually entered anymore; field removed */}
                
                <Button 
                  className="w-full" 
                  onClick={handleAddPenalty}
                  disabled={isSubmitting || !selectedCategory || selectedMembers.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Adding Penalty...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Penalty ({selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''})
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* New Jury Appointment Dialog */}
      {isJury && (
        <Dialog open={isNewJuryDialogOpen} onOpenChange={setIsNewJuryDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Appoint New Jury</DialogTitle>
              <DialogDescription>
                Select 2-3 users to appoint as new jury members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Once you save the new jury, you will lose jury access and return to employee view (personal details only).
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Select Jury Members (2-3 required)</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {usersQuery.isLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        ))}
                      </div>
                    ) : users.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No users available</p>
                    ) : (
                      users
                        .filter(u => u.id !== user?.id) // Exclude current user
                        .map((userItem) => (
                          <div key={userItem.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`jury-member-${userItem.id}`}
                              checked={selectedJuryMembers.includes(userItem.id)}
                              onChange={() => {
                                if (selectedJuryMembers.includes(userItem.id)) {
                                  setSelectedJuryMembers(prev => prev.filter(id => id !== userItem.id))
                                } else {
                                  if (selectedJuryMembers.length < 3) {
                                    setSelectedJuryMembers(prev => [...prev, userItem.id])
                                  } else {
                                    toast({
                                      title: "Selection Limit",
                                      description: "You can select a maximum of 3 users.",
                                      variant: "destructive"
                                    })
                                  }
                                }
                              }}
                              className="rounded"
                              disabled={isAppointingJury}
                            />
                            <Label htmlFor={`jury-member-${userItem.id}`} className="cursor-pointer">
                              {userItem.name} {userItem.role === "JURY" && <Badge variant="secondary" className="ml-2">Current Jury</Badge>}
                            </Label>
                          </div>
                        ))
                    )}
                  </div>
                </div>
                {selectedJuryMembers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selected ({selectedJuryMembers.length}/3): {selectedJuryMembers.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(", ")}
                  </p>
                )}
                {selectedJuryMembers.length > 0 && selectedJuryMembers.length < 2 && (
                  <p className="text-sm text-destructive">
                    Please select at least 2 users (currently {selectedJuryMembers.length})
                  </p>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={async () => {
                  if (selectedJuryMembers.length < 2 || selectedJuryMembers.length > 3) {
                    toast({
                      title: "Invalid Selection",
                      description: "Please select between 2 and 3 users.",
                      variant: "destructive"
                    })
                    return
                  }

                  setIsAppointingJury(true)
                  try {
                    await usersApi.appointJury(selectedJuryMembers)
                    
                    // Refresh current user to get updated role
                    const updatedUser = await authApi.getCurrentUser()
                    
                    // Map role similar to login
                    const roleValue = updatedUser.role
                    const roleStr = String(roleValue).toUpperCase()
                    let frontendRole: "jury" | "employee" = "employee"
                    
                    if (
                      roleStr === "JURY" || 
                      roleValue === 1 || 
                      roleStr === "1" ||
                      roleValue === "JURY" ||
                      roleValue === "jury" ||
                      roleValue === "Jury"
                    ) {
                      frontendRole = "jury"
                    } else if (
                      roleStr === "EMPLOYEE" || 
                      roleValue === 0 || 
                      roleStr === "0" ||
                      roleValue === "EMPLOYEE" ||
                      roleValue === "employee" ||
                      roleValue === "Employee"
                    ) {
                      frontendRole = "employee"
                    }
                    
                    setUser({
                      id: updatedUser.id,
                      name: updatedUser.name,
                      role: frontendRole,
                    })

                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ["users"] })
                    
                    setIsNewJuryDialogOpen(false)
                    setSelectedJuryMembers([])
                    
                    toast({
                      title: "Success!",
                      description: "New jury members have been appointed. You now have employee access.",
                    })
                    
                    // The ProtectedRoute will automatically redirect if needed
                  } catch (error: any) {
                    console.error("Failed to appoint jury:", error)
                    toast({
                      title: "Error",
                      description: error?.response?.data?.message || error?.message || "Failed to appoint jury. Please try again.",
                      variant: "destructive"
                    })
                  } finally {
                    setIsAppointingJury(false)
                  }
                }}
                disabled={isAppointingJury || selectedJuryMembers.length < 2 || selectedJuryMembers.length > 3}
              >
                {isAppointingJury ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Appointing Jury...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Save New Jury ({selectedJuryMembers.length} member{selectedJuryMembers.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Stats Grid */}
      {isJury && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-jury-success" />
                  {stat.trend} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee View - Pending Penalties */}
      {!isJury && user && (
        <Card>
          <CardHeader>
            <CardTitle>My Pending Penalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: "Lunch", count: 2, price: 100, reason: "Late to office", date: "2024-01-15" },
                { category: "Snacks", count: 1, price: 25, reason: "Policy violation", date: "2024-01-11" },
              ].map((penalty, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{penalty.category}</p>
                      <p className="text-sm text-muted-foreground">{penalty.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{penalty.count} × PKR {penalty.price}</p>
                    <p className="text-sm text-muted-foreground">{penalty.date}</p>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Pending:</span>
                  <span className="text-xl font-bold">PKR 225</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mischief Records */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Penalty Categories</h2>
          </div>
          {/* removed hover-for-details note per request */}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mischief_items
            .filter(item => ["lunch", "cake", "samosa"].includes(item.id))
            .map((item) => (
              <Card 
                key={item.id}
                className="hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-between p-6"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </div>
                {isJury && (
                  <div className="w-full mt-4">
                    <Button
                      className="w-full"
                      onClick={() => handleCategorySelect(item.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                )}
              </Card>
            ))}
        </div>
        {/* singular Add button removed per request */}
      </div>

      {/* Mischief Records Dialog */}
      <Dialog open={isRecordsDialogOpen} onOpenChange={setIsRecordsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedRecord && (
                <>
                  <div className={`p-2 rounded-lg ${selectedRecord.color} text-white`}>
                    <selectedRecord.icon className="h-5 w-5" />
                  </div>
                  {selectedRecord.name} Penalty Records
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">PKR {selectedRecord.price}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{selectedRecord.count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">PKR {selectedRecord.price * selectedRecord.count}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Records */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent {selectedRecord.name} Penalties</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[
                    { member: "John Doe", count: 2, date: "2024-01-15", reason: "Late lunch return" },
                    { member: "Jane Smith", count: 1, date: "2024-01-14", reason: "Extended break" },
                    { member: "Mike Johnson", count: 3, date: "2024-01-13", reason: "Multiple violations" },
                    { member: "Sarah Wilson", count: 1, date: "2024-01-12", reason: "Lunch policy violation" },
                    { member: "David Brown", count: 2, date: "2024-01-11", reason: "Time violation" },
                  ].map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{record.member}</p>
                          <p className="text-sm text-muted-foreground">{record.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{record.count} × PKR {selectedRecord.price}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {isJury && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setIsRecordsDialogOpen(false)
                      handleCategorySelect(selectedRecord.id)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {selectedRecord.name} Penalty
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsRecordsDialogOpen(false)
                      handleCategorySelect(selectedRecord.id)
                    }}
                  >
                    Remove {selectedRecord.name} Penalty
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "John Doe", action: "Added", category: "Lunch", count: 2, time: "2 hours ago" },
              { name: "Jane Smith", action: "Removed", category: "Cake", count: 1, time: "4 hours ago" },
              { name: "Mike Johnson", action: "Added", category: "Samosa", count: 3, time: "6 hours ago" },
            ].filter(activity => !user || user.role === 'jury' || activity.name === user.name).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action} {activity.count} {activity.category} penalty
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}