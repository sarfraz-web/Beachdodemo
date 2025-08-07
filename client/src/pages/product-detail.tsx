import { useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Share2, 
  MapPin, 
  Eye, 
  CheckCircle, 
  MessageCircle,
  Flag,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import ChatWidget from "@/components/chat/chat-widget";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/listings/${productId}`],
    enabled: !!productId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest('DELETE', `/api/saved-items/${productId}`);
      } else {
        await apiRequest('POST', '/api/saved-items', { listingId: productId });
      }
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      toast({
        title: isSaved ? "Removed from wishlist" : "Added to wishlist",
        description: isSaved ? "Item removed from your wishlist" : "Item added to your wishlist",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-items"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      await apiRequest('POST', '/api/reports', {
        targetType: 'listing',
        targetId: productId,
        reason,
        description: `Report for listing: ${product?.listing?.title}`
      });
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for reporting. We'll review this listing.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
              <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
              <Link href="/products">
                <Button className="bg-primary hover:bg-blue-600">
                  Browse Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { listing, user: seller } = product;
  const images = listing.images || [];

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save items to your wishlist",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report listings",
        variant: "destructive",
      });
      return;
    }
    
    const reason = prompt("Please provide a reason for reporting this listing:");
    if (reason) {
      reportMutation.mutate(reason);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link has been copied to clipboard",
      });
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact sellers",
        variant: "destructive",
      });
      return;
    }
    
    if (user?.id === seller?.id) {
      toast({
        title: "Cannot contact yourself",
        description: "You cannot start a conversation with yourself",
        variant: "destructive",
      });
      return;
    }

    setShowChatWidget(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              {images.length > 0 ? (
                <div className="relative">
                  <img
                    src={images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      currentImageIndex === index ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.location}
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {listing.viewCount || 0} views
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveToggle}
                    disabled={saveMutation.isPending}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReport}>
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(listing.price)}
                </span>
                <div className="flex space-x-2">
                  {listing.isBoosted && (
                    <Badge className="bg-accent text-white">Featured</Badge>
                  )}
                  <Badge 
                    className={
                      listing.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {listing.status === 'active' ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
            </div>

            <Separator />

            {/* Seller Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h3>
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={seller?.profileImageUrl} />
                  <AvatarFallback>
                    {seller?.firstName?.[0]}{seller?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {seller?.firstName} {seller?.lastName}
                    </h4>
                    {seller?.kycStatus === 'verified' && (
                      <CheckCircle className="w-4 h-4 text-green-500" title="KYC Verified" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Member since {new Date(seller?.createdAt).getFullYear()}</p>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">5.0 (12 reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {listing.status === 'active' && user?.id !== seller?.id && (
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-blue-600"
                  onClick={handleContactSeller}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSaveToggle}
                  disabled={saveMutation.isPending}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Safety Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Safety Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Meet in a public place for transactions</li>
                  <li>• Inspect the item before making payment</li>
                  <li>• Use secure payment methods</li>
                  <li>• Trust your instincts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Widget */}
        {showChatWidget && (
          <ChatWidget
            sellerId={seller?.id}
            listingId={listing.id}
            onClose={() => setShowChatWidget(false)}
          />
        )}
      </div>
    </div>
  );
}
