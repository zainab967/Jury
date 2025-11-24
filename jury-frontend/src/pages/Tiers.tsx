import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Users, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { tiersApi, usersApi } from "@/api"
import type { Tier, TierEmployee } from "@/api"
import type { User } from "@/types"

// Define tier costs (static configuration)
// T1 Juniors, T1 Seniors, T2, T3
const tierCosts: Record<string, { samosaCost: number; cakeCost: number; lunchCost: number }> = {
  "T1 Juniors": { samosaCost: 80, cakeCost: 1000, lunchCost: 5500 },
  "T1 Seniors": { samosaCost: 80, cakeCost: 1500, lunchCost: 8000 },
  "T2": { samosaCost: 80, cakeCost: 3000, lunchCost: 13000 },
  "T3": { samosaCost: 80, cakeCost: 3500, lunchCost: 17000 }
}

// Tier pricing order - first tier gets T1 Juniors, second gets T1 Seniors, etc.
const tierPricingOrder = ["T1 Juniors", "T1 Seniors", "T2", "T3"]


const TierAccordionItem = ({ 
  tier,
  costs,
  onDeleteEmployee
}: { 
  tier: Tier
  costs: { samosaCost: number; cakeCost: number; lunchCost: number }
  onDeleteEmployee: (tierId: string, userId: string) => void
}) => {
  // Note: Backend doesn't have tier-employee relationship
  // This is a placeholder - you may need to implement this differently
  const employees: TierEmployee[] = []
  const isLoading = false
  return (
    <AccordionItem value={tier.id}>
      <AccordionTrigger>
        <div className="flex items-center gap-4 text-left w-full">
          <div className="flex-1">
            <h3 className="font-semibold">{tier.name}</h3>
            <p className="text-sm text-muted-foreground">{tier.description || "Tier"}</p>
          </div>
          <div className="flex items-center gap-4 mr-8">
            <div className="text-sm">
              <span className="text-muted-foreground">Samosa:</span> {costs.samosaCost}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Cake:</span> {costs.cakeCost}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Lunch:</span> {costs.lunchCost}
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <Users className="h-3 w-3 mr-1" />
            {employees.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No employees assigned
              </div>
            ) : (
              employees.map((employee) => (
                <div key={employee.userId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="font-medium">{employee.userName || employee.userId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteEmployee(tier.id, employee.userId)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
  )
}

export default function Tiers() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedTierId, setSelectedTierId] = useState("")

  const tiersQuery = useQuery<Tier[]>({
    queryKey: ["tiers"],
    queryFn: () => tiersApi.getAll(1, 100),
  })

  const usersQuery = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
  })

  useEffect(() => {
    if (tiersQuery.isError) {
      const error = tiersQuery.error as any
      console.error("Failed to load tiers:", error)
      toast({
        title: "Error loading tiers",
        description: error?.response?.data?.message || error?.message || "Failed to load tiers",
        variant: "destructive",
      })
    }
  }, [tiersQuery.isError, tiersQuery.error, toast])

  useEffect(() => {
    if (usersQuery.isError) {
      const error = usersQuery.error as any
      console.error("Failed to load users:", error)
      toast({
        title: "Error loading users",
        description: error?.response?.data?.message || error?.message || "Failed to load users",
        variant: "destructive",
      })
    }
  }, [usersQuery.isError, usersQuery.error, toast])

  // Note: We'll fetch employees when needed, not in a loop (React hooks rules)

  // Note: Backend doesn't have tier-employee assignment endpoints
  // These handlers are placeholders - implement based on your backend structure
  const handleDeleteEmployee = (tierId: string, userId: string) => {
    toast({
      title: "Not implemented",
      description: "Tier-employee assignment is not available in the backend.",
      variant: "destructive",
    })
  }

  const handleAddEmployee = () => {
    toast({
      title: "Not implemented",
      description: "Tier-employee assignment is not available in the backend.",
      variant: "destructive",
    })
  }


  const allTiers = tiersQuery.data ?? []
  // Filter out Silver tier
  const tiers = allTiers.filter(tier => tier.name.toLowerCase() !== "silver")
  const users = usersQuery.data ?? []


  return (
    <div className="space-y-6">
      <div className="mb-6 p-4 rounded-md bg-muted text-muted-foreground text-sm flex items-start justify-between gap-3">
        <span>Manage employee tiers and their applicable fines. <a href="https://example.com/why-tiers" className="underline underline-offset-2 text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Why tiers & fines?</a></span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fine Tiers</h1>
          <p className="text-muted-foreground mt-2">
            Fine amounts are structured in tiers based on employee level
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee to Tier</DialogTitle>
              <DialogDescription>
                Add an employee to a specific tier. Costs will be automatically assigned based on the selected tier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Select Tier</Label>
                <Select
                  value={selectedTierId}
                  onValueChange={setSelectedTierId}
                  disabled={tiersQuery.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiersQuery.isLoading ? (
                      <SelectItem value="loading" disabled>Loading tiers...</SelectItem>
                    ) : tiers.length === 0 ? (
                      <SelectItem value="none" disabled>No tiers available</SelectItem>
                    ) : (
                      tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Select Employee</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={usersQuery.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersQuery.isLoading ? (
                      <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                    ) : users.length === 0 ? (
                      <SelectItem value="none" disabled>No employees available</SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddEmployee}
                disabled={!selectedTierId || !selectedUserId}
              >
                Add Employee (Not Available)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fine Structure by Employee Tier</CardTitle>
        </CardHeader>
        <CardContent>
          {tiersQuery.isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : tiersQuery.isError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-6 w-6 mx-auto text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load tiers</p>
            </div>
          ) : tiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tiers configured
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {tiers.map((tier, index) => {
                // Assign pricing based on tier order: first tier = T1 Juniors, second = T1 Seniors, etc.
                // This ensures all existing tiers get the new pricing structure
                const pricingTierName = tierPricingOrder[index] || tierPricingOrder[0]
                let costs: { samosaCost: number; cakeCost: number; lunchCost: number }
                
                // Always use tierCosts configuration based on tier order
                if (tierCosts[pricingTierName]) {
                  costs = tierCosts[pricingTierName]
                } else {
                  // Fallback to T1 Juniors if index is out of range
                  costs = tierCosts["T1 Juniors"]
                }
                
                return (
                  <TierAccordionItem
                    key={tier.id}
                    tier={tier}
                    costs={costs}
                    onDeleteEmployee={handleDeleteEmployee}
                  />
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}