import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Beachdo</h3>
            <p className="text-gray-300 mb-4">
              Your trusted marketplace for buying and selling with verified users and secure transactions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Buyers</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/products">
                  <a className="hover:text-white transition-colors">Browse Products</a>
                </Link>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Search & Filters</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Buyer Protection</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Sellers</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/dashboard">
                  <a className="hover:text-white transition-colors">Start Selling</a>
                </Link>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Seller Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Boost Listings</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Seller Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-300">
          <p>&copy; 2024 Beachdo. All rights reserved. | Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}
