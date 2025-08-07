import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Heart, CheckCircle, Shield, MessageCircle, Star } from "lucide-react";
import { Link } from "wouter";
import ProductCard from "@/components/products/product-card";

const categories = [
  { id: 'electronics', name: 'Electronics', icon: 'fas fa-laptop' },
  { id: 'fashion', name: 'Fashion', icon: 'fas fa-tshirt' },
  { id: 'home', name: 'Home', icon: 'fas fa-home' },
  { id: 'vehicles', name: 'Vehicles', icon: 'fas fa-car' },
  { id: 'books', name: 'Books', icon: 'fas fa-book' },
  { id: 'more', name: 'More', icon: 'fas fa-ellipsis-h' }
];

export default function Home() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/listings", { limit: "8", status: "active" }],
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories"],
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Products<br/>
              <span className="text-accent">From Local Sellers</span>
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Connect with trusted sellers in your area. Buy, sell, and discover unique items with verified KYC authentication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="bg-accent hover:bg-amber-600 text-white">
                  Start Browsing
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products, services..."
                className="pl-10 pr-4 py-3 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <div className="text-center group cursor-pointer">
                  <div className="bg-gray-100 rounded-xl p-6 mb-3 group-hover:bg-primary group-hover:text-white transition-all">
                    <i className={`${category.icon} text-2xl`}></i>
                  </div>
                  <span className="font-medium text-gray-700 group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products">
              <Button variant="link" className="text-primary hover:text-blue-700 font-semibold">
                View All
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-t-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings?.listings?.slice(0, 4).map((listing: any) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Safe & Secure Trading</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We ensure every transaction is secure with verified users and trusted payment methods.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">KYC Verification</h3>
              <p className="text-gray-600">All users are verified through DigiLocker integration for enhanced security and trust.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Chat</h3>
              <p className="text-gray-600">Communicate safely with buyers and sellers through our encrypted messaging system.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rating System</h3>
              <p className="text-gray-600">Build trust through our transparent rating and review system for all transactions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
