import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, MessageCircle, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens anyway
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">Beachdo</h1>
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products, services..."
                  className="pl-10 pr-4"
                />
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="text-gray-700 hover:text-primary">
                      <Plus className="w-4 h-4 mr-1" />
                      Sell
                    </Button>
                  </Link>
                  <Link href="/chat">
                    <Button variant="ghost" className="text-gray-700 hover:text-primary">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Messages
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl} />
                          <AvatarFallback>
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user?.firstName} {user?.lastName}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/products?saved=true">Wishlist</Link>
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Panel</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} className="bg-primary hover:bg-blue-600">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
