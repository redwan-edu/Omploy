import { Mail, MessageSquare, Phone } from "lucide-react";
import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Grid with 4 equal columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Omploy</h3>
            <p>Your AI assistant for a more productive digital life.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/pricing" className="hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/talk" className="hover:text-white">
                  Talk
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/history" className="hover:text-white">
                  History
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="hover:text-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white">
                  Terms
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-500 pt-4 text-center text-sm">
          <p className="mb-1">Powered by Supabase + Bolt.new</p>
          <p>© 2025 Omploy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
