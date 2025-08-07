import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MapPin, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProductCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: string;
    location: string;
    images: string[];
    status: string;
    isBoosted: boolean;
    createdAt: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
      kycStatus: string;
    };
  };
}

export default function ProductCard({ listing }: ProductCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest('DELETE', `/api/saved-items/${listing.id}`);
      } else {
        await apiRequest('POST', '/api/saved-items', { listingId: listing.id });
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

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <Link href={`/products/${listing.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2"
            onClick={handleSaveToggle}
            disabled={saveMutation.isPending}
          >
            <Heart 
              className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
          
          {listing.isBoosted && (
            <Badge className="absolute top-2 left-2 bg-accent text-white">
              Featured
            </Badge>
          )}
          
          {listing.status === 'active' && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white" style={{marginTop: listing.isBoosted ? '32px' : '0'}}>
              New
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {listing.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary">
              {formatPrice(listing.price)}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{listing.location}</span>
            </div>
          </div>
          
          {listing.user && (
            <div className="flex items-center pt-3 border-t border-gray-100">
              <Avatar className="w-6 h-6 mr-2">
                <AvatarImage src={listing.user.profileImageUrl} />
                <AvatarFallback className="text-xs">
                  {listing.user.firstName[0]}{listing.user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 flex-1">
                {listing.user.firstName} {listing.user.lastName}
              </span>
              {listing.user.kycStatus === 'verified' && (
                <CheckCircle className="h-4 w-4 text-green-500" title="KYC Verified" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
