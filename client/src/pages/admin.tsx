import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  List, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import UserManagement from "@/components/admin/user-management";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: listingStats, isLoading: listingStatsLoading } = useQuery({
    queryKey: ["/api/admin/listings"],
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/listings", { status: "pending_approval", limit: "50" }],
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      await apiRequest('PUT', `/api/admin/reports/${reportId}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Report updated",
        description: "Report status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const approveListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await apiRequest('PUT', `/api/listings/${listingId}`, { status: 'active' });
    },
    onSuccess: () => {
      toast({
        title: "Listing approved",
        description: "Listing has been approved and is now active",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const rejectListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await apiRequest('PUT', `/api/listings/${listingId}`, { status: 'inactive' });
    },
    onSuccess: () => {
      toast({
        title: "Listing rejected",
        description: "Listing has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleReportAction = (reportId: string, status: string) => {
    updateReportMutation.mutate({ reportId, status });
  };

  const handleListingAction = (listingId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      approveListingMutation.mutate(listingId);
    } else {
      rejectListingMutation.mutate(listingId);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users, listings, and platform operations</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userStatsLoading ? '...' : userStats?.totalUsers || 0}
                      </p>
                      <p className="text-green-600 text-sm">↗ +12% this month</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Listings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {listingStatsLoading ? '...' : listingStats?.activeListings || 0}
                      </p>
                      <p className="text-green-600 text-sm">↗ +8% this month</p>
                    </div>
                    <List className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {listingStatsLoading ? '...' : listingStats?.pendingApproval || 0}
                      </p>
                      <p className="text-amber-600 text-sm">Requires attention</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reports</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportsLoading ? '...' : reports?.filter((r: any) => r.status === 'pending').length || 0}
                      </p>
                      <p className="text-red-600 text-sm">New reports</p>
                    </div>
                    <Flag className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {listingsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg animate-pulse">
                          <div className="w-12 h-12 bg-gray-200 rounded mr-4"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : listings?.listings?.length > 0 ? (
                    <div className="space-y-4">
                      {listings.listings.slice(0, 5).map((listing: any) => (
                        <div key={listing.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-12 h-12 object-cover rounded mr-4"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded mr-4"></div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">{listing.title}</h4>
                              <p className="text-sm text-gray-600">{formatPrice(listing.price)}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleListingAction(listing.id, 'approve')}
                              disabled={approveListingMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleListingAction(listing.id, 'reject')}
                              disabled={rejectListingMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No pending listings</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : reports?.length > 0 ? (
                    <div className="space-y-4">
                      {reports.slice(0, 5).map((report: any) => (
                        <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{report.reason}</h4>
                            <p className="text-sm text-gray-600">{report.targetType} report</p>
                            <Badge 
                              className={
                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {report.status}
                            </Badge>
                          </div>
                          {report.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'resolved')}
                                disabled={updateReportMutation.isPending}
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReportAction(report.id, 'dismissed')}
                                disabled={updateReportMutation.isPending}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No reports</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>Listings Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <Input
                      placeholder="Search listings..."
                      className="w-64"
                    />
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending_approval">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {listingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg animate-pulse">
                        <div className="w-16 h-16 bg-gray-200 rounded mr-4"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : listings?.listings?.length > 0 ? (
                  <div className="space-y-4">
                    {listings.listings.map((listing: any) => (
                      <div key={listing.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-16 h-16 object-cover rounded mr-4"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded mr-4"></div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{listing.title}</h4>
                            <p className="text-sm text-gray-600">{formatPrice(listing.price)}</p>
                            <p className="text-sm text-gray-500">{listing.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            className={
                              listing.status === 'active' ? 'bg-green-100 text-green-800' :
                              listing.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {listing.status.replace('_', ' ')}
                          </Badge>
                          <div className="flex space-x-2">
                            {listing.status === 'pending_approval' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleListingAction(listing.id, 'approve')}
                                  disabled={approveListingMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleListingAction(listing.id, 'reject')}
                                  disabled={rejectListingMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No listings found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Flags</CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : reports?.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report: any) => (
                      <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{report.reason}</h4>
                            <p className="text-sm text-gray-600">{report.description}</p>
                            <div className="flex items-center mt-2 space-x-2">
                              <Badge 
                                className={
                                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }
                              >
                                {report.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {report.targetType} • {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {report.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'resolved')}
                                disabled={updateReportMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReportAction(report.id, 'dismissed')}
                                disabled={updateReportMutation.isPending}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No reports found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
