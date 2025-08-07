import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  List, 
  Heart, 
  MessageCircle, 
  Settings, 
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProductForm from "@/components/products/product-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userListings, isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/my-listings"],
    enabled: isAuthenticated,
  });

  const { data: savedItems, isLoading: savedLoading } = useQuery({
    queryKey: ["/api/saved-items"],
    enabled: isAuthenticated,
  });

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/chats"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await apiRequest('DELETE', `/api/listings/${listingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Listing deleted",
        description: "Your listing has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const handleEditListing = (listing: any) => {
    setEditingListing(listing);
    setShowCreateForm(true);
  };

  const handleDeleteListing = (listingId: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteMutation.mutate(listingId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending_approval': return <Clock className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'sold': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">{user?.email}</p>
                  <div className="flex items-center justify-center mt-2">
                    {user?.kycStatus === 'verified' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        KYC Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        KYC Pending
                      </Badge>
                    )}
                  </div>
                </div>
                
                <nav className="space-y-2">
                  <div className="flex items-center px-3 py-2 text-primary bg-primary bg-opacity-10 rounded-lg">
                    <LayoutDashboard className="w-4 h-4 mr-3" />
                    Dashboard
                  </div>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your listings and account</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Listings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userListings?.filter((l: any) => l.status === 'active').length || 0}
                      </p>
                    </div>
                    <List className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {userListings?.reduce((acc: number, listing: any) => acc + (listing.viewCount || 0), 0) || 0}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Messages</p>
                      <p className="text-2xl font-bold text-gray-900">{chats?.length || 0}</p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="listings" className="space-y-6">
              <TabsList>
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="listings">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>My Listings</CardTitle>
                      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                        <DialogTrigger asChild>
                          <Button className="bg-primary hover:bg-blue-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Listing
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {editingListing ? 'Edit Listing' : 'Create New Listing'}
                            </DialogTitle>
                          </DialogHeader>
                          <ProductForm
                            editData={editingListing}
                            onSuccess={() => {
                              setShowCreateForm(false);
                              setEditingListing(null);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {listingsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg animate-pulse">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : userListings?.length > 0 ? (
                      <div className="space-y-4">
                        {userListings.map((listing: any) => (
                          <div key={listing.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-16 h-16 object-cover rounded-lg mr-4"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4 flex items-center justify-center">
                                <span className="text-xs text-gray-400">No Image</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{listing.title}</h4>
                              <p className="text-gray-600 text-sm">{formatPrice(listing.price)}</p>
                              <div className="flex items-center mt-1">
                                <Badge className={`${getStatusColor(listing.status)} mr-2`}>
                                  {getStatusIcon(listing.status)}
                                  <span className="ml-1 capitalize">{listing.status.replace('_', ' ')}</span>
                                </Badge>
                                <span className="text-xs text-gray-500">{listing.viewCount || 0} views</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditListing(listing)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteListing(listing.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                        <p className="text-gray-600 mb-4">Start selling by creating your first listing</p>
                        <Button 
                          onClick={() => setShowCreateForm(true)}
                          className="bg-primary hover:bg-blue-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Listing
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wishlist">
                <Card>
                  <CardHeader>
                    <CardTitle>Saved Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                            <div className="w-full h-32 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : savedItems?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedItems.map((item: any) => (
                          <Link key={item.id} href={`/products/${item.listingId}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-4">
                                <div className="w-full h-32 bg-gray-200 rounded mb-4 flex items-center justify-center">
                                  <span className="text-gray-400">Saved Item</span>
                                </div>
                                <h4 className="font-medium text-gray-900 mb-2">Saved Item</h4>
                                <p className="text-sm text-gray-600">View details</p>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No saved items</h3>
                        <p className="text-gray-600 mb-4">Items you save will appear here</p>
                        <Link href="/products">
                          <Button className="bg-primary hover:bg-blue-600">
                            Browse Products
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chatsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center p-4 border border-gray-200 rounded-lg animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : chats?.length > 0 ? (
                      <div className="space-y-4">
                        {chats.map((chat: any) => (
                          <Link key={chat.id} href={`/chat?id=${chat.id}`}>
                            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
                              <Avatar className="w-12 h-12 mr-4">
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">Chat Conversation</h4>
                                <p className="text-sm text-gray-600">Click to view messages</p>
                              </div>
                              <MessageCircle className="w-5 h-5 text-gray-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
                        <p className="text-gray-600">Your conversations will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
