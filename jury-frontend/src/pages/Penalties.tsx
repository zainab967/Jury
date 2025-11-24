import { useMemo, useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Loader2, Plus, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi, penaltiesApi, logsApi } from "@/api";
import type { CreatePenaltyPayload, Penalty, User } from "@/types";

type PenaltyCounts = Record<
  string,
  { cake: number; lunch: number; samosa: number; logs: Penalty[] }
>;

const categoryOptions = [
  { label: "Lunch", value: "Lunch" },
  { label: "Cake", value: "Cake" },
  { label: "Samosa", value: "Samosa" },
];

// Remove penalty categories (only cake, lunch, samosa)
const removeCategoryOptions = [
  { label: "Lunch", value: "Lunch" },
  { label: "Cake", value: "Cake" },
  { label: "Samosa", value: "Samosa" },
];

const statusFilterOptions = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
];

const categoryFilterOptions = [
  { label: "All Categories", value: "all" },
  ...categoryOptions.map((option) => ({ label: option.label, value: option.value })),
];

const Penalties = () => {
  const { isJury } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAllMembers, setSelectAllMembers] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Remove penalty form state
  const [removeCategory, setRemoveCategory] = useState<string>("");
  const [removeSelectedMembers, setRemoveSelectedMembers] = useState<string[]>([]);
  const [removeSelectAllMembers, setRemoveSelectAllMembers] = useState(false);
  const [removeReason, setRemoveReason] = useState<string>("");
  const [removeDescription, setRemoveDescription] = useState<string>("");
  const [removing, setRemoving] = useState(false);

  const usersQuery = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
  });

  const penaltiesQuery = useQuery<Penalty[]>({
    queryKey: ["penalties"],
    queryFn: () => penaltiesApi.getAll(1, 100),
  });

  // Handle query errors
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

  useEffect(() => {
    if (penaltiesQuery.isError) {
      const error = penaltiesQuery.error as any
      console.error("Failed to load penalties:", error)
      toast({
        title: "Error loading penalties",
        description: error?.response?.data?.message || error?.message || "Failed to load penalties",
        variant: "destructive",
      })
    }
  }, [penaltiesQuery.isError, penaltiesQuery.error, toast])

  const createPenaltyMutation = useMutation({
    mutationFn: (payload: CreatePenaltyPayload) => penaltiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalties"] });
    },
    onError: (error: any) => {
      console.error("Create penalty error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create penalty."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  });

  const deletePenaltyMutation = useMutation({
    mutationFn: (id: string) => penaltiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalties"] });
    },
    onError: (error: any) => {
      console.error("Delete penalty error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete penalty."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  });

  const users = usersQuery.data ?? [];
  const penalties = penaltiesQuery.data ?? [];

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "paid" || normalized === "resolved") {
      return "bg-green-500 text-white border-transparent";
    }
    if (normalized === "pending") {
      return "bg-blue-500 text-white border-transparent";
    }
    return "bg-gray-500 text-white border-transparent";
  };

  const uniqueUsers = useMemo(() => {
    const lookup = new Map<string, string>();
    penalties.forEach((penalty) => {
      const name = penalty.user?.name ?? "Unknown";
      lookup.set(penalty.userId, name);
    });
    users.forEach((user) => {
      lookup.set(user.id, user.name);
    });
    return Array.from(lookup.entries()).map(([id, name]) => ({ id, name }));
  }, [penalties, users]);

  const filteredPenalties = useMemo(() => {
    return penalties.filter((penalty) => {
      const name = penalty.user?.name ?? "Unknown";
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        penalty.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (penalty.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "all" ||
        penalty.category.toLowerCase() === filterCategory.toLowerCase();

      const normalizedStatus =
        penalty.status.toLowerCase() === "resolved" ? "paid" : penalty.status.toLowerCase();
      const matchesStatus =
        filterStatus === "all" || normalizedStatus === filterStatus.toLowerCase();

      const matchesUser =
        selectedUser === "all" || penalty.userId.toLowerCase() === selectedUser.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus && matchesUser;
    });
  }, [penalties, searchTerm, filterCategory, filterStatus, selectedUser]);

  const countsByUser = useMemo(() => {
    return filteredPenalties.reduce<PenaltyCounts>((map, penalty) => {
      const key = penalty.user?.name ?? "Unknown";
      if (!map[key]) {
        map[key] = { cake: 0, lunch: 0, samosa: 0, logs: [] };
      }
      const categoryKey = penalty.category.toLowerCase();
      if (categoryKey.includes("cake")) map[key].cake += 1;
      if (categoryKey.includes("lunch")) map[key].lunch += 1;
      if (categoryKey.includes("samosa")) map[key].samosa += 1;
      map[key].logs.push(penalty);
      return map;
    }, {});
  }, [filteredPenalties]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectAllMembers) {
      setSelectedMembers([]);
      setSelectAllMembers(false);
      return;
    }
    const allIds = users.map((user) => user.id);
    setSelectedMembers(allIds);
    setSelectAllMembers(true);
  };

  const resetAddForm = () => {
    setCategory("");
    setReason("");
    setDescription("");
    setSelectedMembers([]);
    setSelectAllMembers(false);
  };

  const resetRemoveForm = () => {
    setRemoveCategory("");
    setRemoveReason("");
    setRemoveDescription("");
    setRemoveSelectedMembers([]);
    setRemoveSelectAllMembers(false);
  };

  const toggleRemoveMember = (memberId: string) => {
    setRemoveSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleRemoveSelectAll = () => {
    if (removeSelectAllMembers) {
      setRemoveSelectedMembers([]);
      setRemoveSelectAllMembers(false);
      return;
    }
    const allIds = users.map((user) => user.id);
    setRemoveSelectedMembers(allIds);
    setRemoveSelectAllMembers(true);
  };

  const handleRemovePenalties = async () => {
    if (removeSelectedMembers.length === 0) {
      toast({
        title: "Select members",
        description: "Choose at least one member before removing a penalty.",
      });
      return;
    }

    if (!removeCategory) {
      toast({
        title: "Select category",
        description: "Choose a penalty category before submitting.",
      });
      return;
    }

    if (!removeReason.trim()) {
      toast({
        title: "Reason required",
        description: "Provide a reason for removing the penalty.",
      });
      return;
    }

    setRemoving(true);
    try {
      // First, check if penalties exist for selected members with the specified category
      const penaltiesToDelete = penalties.filter(
        (penalty) =>
          removeSelectedMembers.includes(penalty.userId) &&
          penalty.category.toLowerCase() === removeCategory.toLowerCase() &&
          penalty.status.toLowerCase() === "pending"
      );

      if (penaltiesToDelete.length === 0) {
        // Check which users don't have penalties
        const usersWithoutPenalties = removeSelectedMembers.filter((userId) => {
          const userPenalties = penalties.filter(
            (penalty) =>
              penalty.userId === userId &&
              penalty.category.toLowerCase() === removeCategory.toLowerCase() &&
              penalty.status.toLowerCase() === "pending"
          );
          return userPenalties.length === 0;
        });

        const userNames = usersWithoutPenalties
          .map((userId) => users.find((u) => u.id === userId)?.name)
          .filter(Boolean)
          .join(", ");

        toast({
          title: "No penalties found",
          description: userNames
            ? `No pending ${removeCategory} penalties found for: ${userNames}`
            : `No pending ${removeCategory} penalties found for selected members.`,
          variant: "destructive",
        });
        setRemoving(false);
        return;
      }

      // Verify each selected member has at least one penalty
      const membersWithoutPenalties = removeSelectedMembers.filter((userId) => {
        return !penaltiesToDelete.some((penalty) => penalty.userId === userId);
      });

      if (membersWithoutPenalties.length > 0) {
        const memberNames = membersWithoutPenalties
          .map((userId) => users.find((u) => u.id === userId)?.name)
          .filter(Boolean)
          .join(", ");

        toast({
          title: "Some members have no penalties",
          description: `The following members don't have pending ${removeCategory} penalties: ${memberNames}. Proceeding with removal for other members.`,
          variant: "default",
        });
      }

      // Delete penalties and create log entries
      await Promise.all(
        penaltiesToDelete.map(async (penalty) => {
          // Delete the penalty
          await deletePenaltyMutation.mutateAsync(penalty.id);

          // Create log entry for the removed penalty
          try {
            await logsApi.create({
              userId: penalty.userId,
              action: "removed",
              result: `${removeCategory} penalty removed: ${removeReason.trim()}${removeDescription.trim() ? ` - ${removeDescription.trim()}` : ''}`,
            });
          } catch (logError) {
            console.error("Failed to create log entry:", logError);
          }
        })
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["penalties"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });

      const removedUserNames = Array.from(
        new Set(
          penaltiesToDelete
            .map((penalty) => users.find((u) => u.id === penalty.userId)?.name)
            .filter(Boolean)
        )
      ).join(", ");

      toast({
        title: "Penalty removed",
        description: `Removed ${penaltiesToDelete.length} ${removeCategory} penalty/penalty(ies) for: ${removedUserNames}`,
      });
      resetRemoveForm();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to remove penalty",
        description: "Something went wrong while removing penalties.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleCreatePenalties = async () => {
    if (selectedMembers.length === 0) {
      toast({
        title: "Select members",
        description: "Choose at least one member before adding a penalty.",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Select category",
        description: "Choose a penalty category before submitting.",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Provide a short reason for the penalty.",
      });
      return;
    }

    // Map category to amount based on tier pricing (default amounts)
    const categoryAmounts: Record<string, number> = {
      "Lunch": 5500, // Default lunch amount
      "Cake": 1000,  // Default cake amount
      "Samosa": 80,  // Default samosa amount
    };

    const penaltyAmount = categoryAmounts[category] || 0;

    setSubmitting(true);
    try {
        await Promise.all(
          selectedMembers.map(async (userId) => {
            // Create penalty
            const penalty = await createPenaltyMutation.mutateAsync({
              userId,
              category,
              reason: reason.trim(),
              description: description.trim() || undefined,
              amount: penaltyAmount,
              status: "pending", // Required by backend
              date: new Date().toISOString(),
            });

            // Create log entry for the penalty (log is associated with the user who received the penalty)
            try {
              await logsApi.create({
                userId, // The user who received the penalty
                action: "added",
                result: `${category} penalty: ${reason.trim()}${description.trim() ? ` - ${description.trim()}` : ''} (Amount: PKR ${penaltyAmount})`,
              });
            } catch (logError) {
              // Log creation failure shouldn't block penalty creation
              console.error("Failed to create log entry:", logError);
            }

            return penalty;
          })
        );
      
      // Invalidate queries to refresh data (logs are auto-created by backend when penalty is created)
      queryClient.invalidateQueries({ queryKey: ["penalties"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      
      toast({
        title: "Penalty added",
        description: `Created penalties for ${selectedMembers.length} member(s). Logs have been automatically updated.`,
      });
      resetAddForm();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to add penalty",
        description: "Something went wrong while creating penalties.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePenalty = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePenaltyMutation.mutateAsync(id);
      toast({
        title: "Penalty removed",
        description: "The penalty entry has been deleted.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to delete",
        description: "We couldn't delete this penalty. Try again later.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const selectedMemberNames = selectedMembers
    .map((memberId) => users.find((user) => user.id === memberId)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Penalty Management</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={() => penaltiesQuery.refetch()}
          disabled={penaltiesQuery.isFetching}
        >
          {penaltiesQuery.isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Search Penalties</TabsTrigger>
          {isJury && <TabsTrigger value="add">Add Penalty</TabsTrigger>}
          {isJury && <TabsTrigger value="remove">Remove Penalty</TabsTrigger>}
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Penalty Overview</CardTitle>
              <CardDescription>Filter and review all penalty records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by name, reason, or description..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <div>
                  <Label>User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {penaltiesQuery.isLoading || usersQuery.isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredPenalties.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No penalties found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your filters or search criteria.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Cakes</TableHead>
                        <TableHead>Lunch</TableHead>
                        <TableHead>Samosa</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(countsByUser).map(([userName, data]) => (
                        <TableRow key={userName}>
                          <TableCell className="font-medium">{userName}</TableCell>
                          <TableCell>{data.cake}</TableCell>
                          <TableCell>{data.lunch}</TableCell>
                          <TableCell>{data.samosa}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  View Logs
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Penalty Logs - {userName}</DialogTitle>
                                  <DialogDescription>
                                    Review individual penalty entries and manage records.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                  {data.logs.map((log) => (
                                    <div
                                      key={log.id}
                                      className="flex items-start justify-between rounded-md border p-3"
                                    >
                                      <div className="space-y-1">
                                        <p className="font-medium">
                                          {log.category} • {log.reason}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(log.date).toLocaleString()}
                                        </p>
                                        {log.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {log.description}
                                          </p>
                                        )}
                                        <Badge variant="outline" className={getStatusColor(log.status)}>
                                          {log.status.toLowerCase() === "resolved" ? "paid" : log.status}
                                        </Badge>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeletePenalty(log.id)}
                                        disabled={deletingId === log.id}
                                      >
                                        {deletingId === log.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          "Delete"
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isJury && (
          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Penalty
                </CardTitle>
                <CardDescription>
                  Create a new penalty record for one or more members.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Members</Label>
                    <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-4">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <input
                          type="checkbox"
                          id="penalty-select-all"
                          checked={selectAllMembers}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                        <Label htmlFor="penalty-select-all" className="font-medium">
                          Select All Members
                        </Label>
                      </div>
                      {usersQuery.isLoading ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {users.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`member-${user.id}`}
                                checked={selectedMembers.includes(user.id)}
                                onChange={() => toggleMember(user.id)}
                                className="rounded"
                              />
                              <Label htmlFor={`member-${user.id}`}>{user.name}</Label>
                            </div>
                          ))}
                          {users.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No members available. Add users first.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {selectedMembers.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedMemberNames}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="penalty-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="penalty-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="penalty-reason">Reason</Label>
                    <Input
                      id="penalty-reason"
                      placeholder="Reason for penalty"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="penalty-description">Description</Label>
                    <Textarea
                      id="penalty-description"
                      placeholder="Additional details..."
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreatePenalties}
                  disabled={submitting || users.length === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Penalty
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isJury && (
          <TabsContent value="remove" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Remove Penalty
                </CardTitle>
                <CardDescription>
                  Remove pending penalty records for one or more members.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Members</Label>
                    <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border p-4">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <input
                          type="checkbox"
                          id="remove-select-all"
                          checked={removeSelectAllMembers}
                          onChange={handleRemoveSelectAll}
                          className="rounded"
                        />
                        <Label htmlFor="remove-select-all" className="font-medium">
                          Select All Members
                        </Label>
                      </div>
                      {usersQuery.isLoading ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {users.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`remove-member-${user.id}`}
                                checked={removeSelectedMembers.includes(user.id)}
                                onChange={() => toggleRemoveMember(user.id)}
                                className="rounded"
                              />
                              <Label htmlFor={`remove-member-${user.id}`}>{user.name}</Label>
                            </div>
                          ))}
                          {users.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No members available. Add users first.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {removeSelectedMembers.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {removeSelectedMembers
                          .map((memberId) => users.find((user) => user.id === memberId)?.name)
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remove-category">Category</Label>
                    <Select value={removeCategory} onValueChange={setRemoveCategory}>
                      <SelectTrigger id="remove-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {removeCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remove-reason">Reason</Label>
                    <Input
                      id="remove-reason"
                      placeholder="Reason for removing penalty"
                      value={removeReason}
                      onChange={(event) => setRemoveReason(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remove-description">Description (Optional)</Label>
                    <Textarea
                      id="remove-description"
                      placeholder="Additional details..."
                      value={removeDescription}
                      onChange={(event) => setRemoveDescription(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleRemovePenalties}
                  disabled={removing || users.length === 0}
                >
                  {removing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Remove Penalty
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Penalties;

