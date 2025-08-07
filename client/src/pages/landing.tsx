import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Shield, MessageCircle, Star, Users, Zap } from "lucide-react";
import AuthModal from "@/components/auth/auth-modal";

export default function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const features = [
    {
      icon: ShoppingBag,
      title: "Local Marketplace",
      description: "Buy and sell products in your local community with verified users"
    },
    {
      icon: Shield,
      title: "KYC Verified",
      description: "All users are verified through DigiLocker for secure transactions"
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Connect directly with buyers and sellers through our chat system"
    },
    {
      icon: Star,
      title: "Trust & Reviews",
      description: "Rate and review users to build a trusted marketplace community"
    },
    {
      icon: Users,
      title: "Community Focused",
      description: "Support local businesses and connect with your neighbors"
    },
    {
      icon: Zap,
      title: "Fast & Secure",
      description: "Lightning-fast transactions with top-notch security measures"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10,000+" },
    { label: "Products Listed", value: "50,000+" },
    { label: "Successful Transactions", value: "25,000+" },
    { label: "Cities Covered", value: "100+" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            🏖️ Welcome to Beachdo
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Local <span className="text-blue-600">Marketplace</span> Community
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with verified buyers and sellers in your area. Buy, sell, and discover amazing products with complete peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={() => setAuthModalOpen(true)}
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Beachdo?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We've built the most secure and user-friendly marketplace platform for local communities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start buying and selling with verified users in your local area today.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-3"
            onClick={() => setAuthModalOpen(true)}
          >
            Join Beachdo Now
          </Button>
        </div>
      </section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}