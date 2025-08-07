import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Ban,
  Eye,
  Edit,
  Shield,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  kycStatus: string;
  isActive: boolean;
  profileImageUrl?: string;
  createdAt: string;
  kycData?: any;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // This would be a real API endpoint in a complete implementation
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users/list", { search: searchTerm, status: statusFilter, role: roleFilter }],
    queryFn: async () => {
      // Since the specific endpoint doesn't exist, we'll return empty array
      // In a real implementation, this would fetch paginated user data
      return [];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      await apiRequest('PUT', `/api/admin/users/${userId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/list"] });
      setShowUserDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const approveKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('PUT', `/api/admin/kyc/${userId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "KYC approved",
        description: "User KYC has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/list"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const rejectKycMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await apiRequest('PUT', `/api/admin/kyc/${userId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "KYC rejected",
        description: "User KYC has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/list"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUserAction = (user: User, action: string) => {
    switch (action) {
      case 'activate':
        updateUserMutation.mutate({ userId: user.id, data: { isActive: true } });
        break;
      case 'deactivate':
        updateUserMutation.mutate({ userId: user.id, data: { isActive: false } });
        break;
      case 'approve_kyc':
        approveKycMutation.mutate(user.id);
        break;
      case 'reject_kyc':
        const reason = prompt("Please provide a reason for rejecting KYC:");
        if (reason) {
          rejectKycMutation.mutate({ userId: user.id, reason });
        }
        break;
      default:
        break;
    }
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-800',
      seller: 'bg-blue-100 text-blue-800',
      buyer: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const mockUsers: User[] = [
    {
      id: "1",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+91 9876543210",
      role: "buyer",
      kycStatus: "verified",
      isActive: true,
      createdAt: "2024-01-15T00:00:00Z"
    },
    {
      id: "2",
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      phone: "+91 9876543211",
      role: "seller",
      kycStatus: "pending",
      isActive: true,
      createdAt: "2024-01-20T00:00:00Z"
    },
    {
      id: "3",
      email: "admin@beachdo.com",
      firstName: "Admin",
      lastName: "User",
      phone: "+91 9876543212",
      role: "admin",
      kycStatus: "verified",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z"
    }
  ];

  // Use mock data for demonstration since the API endpoint doesn't exist
  const displayUsers = users || mockUsers;

  const filteredUsers = displayUsers.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.kycStatus === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center flex-1">
                    <Avatar className="w-12 h-12 mr-4">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback>
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </h4>
                        {getRoleBadge(user.role)}
                        {!user.isActive && (
                          <Badge className="bg-red-100 text-red-800">
                            <Ban className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">KYC Status</p>
                      {getKycStatusBadge(user.kycStatus)}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Joined</p>
                      <p className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-6">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarImage src={selectedUser.profileImageUrl} />
                                  <AvatarFallback className="text-lg">
                                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-xl font-semibold">
                                    {selectedUser.firstName} {selectedUser.lastName}
                                  </h3>
                                  <p className="text-gray-600">{selectedUser.email}</p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    {getRoleBadge(selectedUser.role)}
                                    {getKycStatusBadge(selectedUser.kycStatus)}
                                  </div>
                                </div>
                              </div>
                              
                              <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                  <TabsTrigger value="kyc">KYC Details</TabsTrigger>
                                  <TabsTrigger value="actions">Actions</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="basic" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Email</label>
                                      <p className="text-gray-900">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Phone</label>
                                      <p className="text-gray-900">{selectedUser.phone}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Role</label>
                                      <p className="text-gray-900">{selectedUser.role}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Status</label>
                                      <p className="text-gray-900">
                                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Joined</label>
                                      <p className="text-gray-900">
                                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="kyc" className="space-y-4">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">KYC Status</label>
                                      <div className="mt-1">
                                        {getKycStatusBadge(selectedUser.kycStatus)}
                                      </div>
                                    </div>
                                    
                                    {selectedUser.kycData && (
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Submitted Documents</label>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                          <p className="text-sm text-gray-600">
                                            KYC documents have been submitted and are under review.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {selectedUser.kycStatus === 'pending' && (
                                      <div className="flex space-x-2">
                                        <Button
                                          onClick={() => handleUserAction(selectedUser, 'approve_kyc')}
                                          disabled={approveKycMutation.isPending}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Approve KYC
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleUserAction(selectedUser, 'reject_kyc')}
                                          disabled={rejectKycMutation.isPending}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject KYC
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="actions" className="space-y-4">
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Account Actions
                                      </label>
                                      <div className="space-y-2">
                                        {selectedUser.isActive ? (
                                          <Button
                                            variant="outline"
                                            onClick={() => handleUserAction(selectedUser, 'deactivate')}
                                            disabled={updateUserMutation.isPending}
                                            className="w-full justify-start"
                                          >
                                            <Ban className="w-4 h-4 mr-2" />
                                            Deactivate Account
                                          </Button>
                                        ) : (
                                          <Button
                                            onClick={() => handleUserAction(selectedUser, 'activate')}
                                            disabled={updateUserMutation.isPending}
                                            className="w-full justify-start bg-green-600 hover:bg-green-700"
                                          >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Activate Account
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t">
                                      <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                          <p className="text-sm font-medium text-yellow-800">
                                            Account Actions
                                          </p>
                                          <p className="text-sm text-yellow-700">
                                            Use these actions carefully as they affect user access to the platform.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {user.kycStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUserAction(user, 'approve_kyc')}
                            disabled={approveKycMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user, 'reject_kyc')}
                            disabled={rejectKycMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No users have registered yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
