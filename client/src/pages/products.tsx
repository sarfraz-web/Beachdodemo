import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ProductCard from "@/components/products/product-card";

export default function Products() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get('category');
  const savedFromUrl = urlParams.get('saved');

  const buildQueryParams = () => {
    const params: Record<string, string> = {
      page: currentPage.toString(),
      limit: "12",
      status: "active"
    };

    if (searchTerm) params.search = searchTerm;
    if (selectedCategory || categoryFromUrl) params.categoryId = selectedCategory || categoryFromUrl || "";
    if (selectedLocation) params.location = selectedLocation;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    return params;
  };

  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/listings", buildQueryParams()],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: savedItems } = useQuery({
    queryKey: ["/api/saved-items"],
    enabled: !!savedFromUrl,
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedLocation("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
    setLocation('/products');
  };

  const totalPages = listings ? Math.ceil(listings.total / 12) : 1;

  // If showing saved items
  if (savedFromUrl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Wishlist</h1>
            <p className="text-gray-600 mt-2">Items you've saved for later</p>
          </div>

          {savedItems?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedItems.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
                  <p className="text-center text-gray-600">Saved item #{item.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved items</h3>
              <p className="text-gray-600 mb-4">Start browsing to save items you like</p>
              <Button onClick={() => setLocation('/products')} className="bg-primary hover:bg-blue-600">
                Browse Products
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
          <p className="text-gray-600 mt-2">Discover amazing products from trusted sellers</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} className="bg-primary hover:bg-blue-600">
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input
                    type="text"
                    placeholder="City, State"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                <div className="md:col-span-4 flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button onClick={handleSearch} className="bg-primary hover:bg-blue-600">
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(searchTerm || selectedCategory || selectedLocation || minPrice || maxPrice) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {categories?.find((c: any) => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {selectedLocation && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Location: {selectedLocation}
                    <button onClick={() => setSelectedLocation("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {(minPrice || maxPrice) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Price: ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                    <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {isLoading ? 'Loading...' : `${listings?.total || 0} products found`}
            </p>
            <Select defaultValue="newest">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : listings?.listings?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.listings.map((listing: any) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-primary hover:bg-blue-600" : ""}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all categories
            </p>
            <Button onClick={clearFilters} className="bg-primary hover:bg-blue-600">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
