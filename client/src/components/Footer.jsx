import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-brand-dark-900 border-t border-brand-dark-800 text-brand-dark-300 font-sans mt-auto">
      {/* Assurances Banner */}
      <div className="border-b border-brand-dark-800 bg-brand-dark-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-maroon-900/40 border border-brand-maroon-800/30 rounded-xl text-brand-gold-500">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-white text-sm">Free Campus Pickup</h4>
                <p className="text-xs text-brand-dark-400 mt-1">Collect your merchandise directly from Block A Office.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-maroon-900/40 border border-brand-maroon-800/30 rounded-xl text-brand-gold-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-white text-sm">Secure Payment Gateway</h4>
                <p className="text-xs text-brand-dark-400 mt-1">Stripe-encrypted secure checkout for all transactions.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-maroon-900/40 border border-brand-maroon-800/30 rounded-xl text-brand-gold-500">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-white text-sm">Easy Returns & Exchanges</h4>
                <p className="text-xs text-brand-dark-400 mt-1">Return within 7 days for size adjustments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Branding */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Geeta University Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-lg text-white leading-none">
                GEETA UNIVERSITY
              </span>
            </div>
            <p className="text-xs text-brand-dark-400 leading-relaxed">
              The official merchandise platform of Geeta University. Wear your academic excellence and school pride on your sleeve.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-gold-500 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-brand-gold-500 transition-colors">All Merchandise</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-brand-gold-500 transition-colors">Shopping Cart</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policy */}
          <div>
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-5">
              Support
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li>
                <span className="hover:text-brand-gold-500 cursor-pointer transition-colors">FAQ & Support</span>
              </li>
              <li>
                <span className="hover:text-brand-gold-500 cursor-pointer transition-colors">Return Policy</span>
              </li>
              <li>
                <span className="hover:text-brand-gold-500 cursor-pointer transition-colors">Size Guide</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-5">
              Contact Campus
            </h4>
            <ul className="space-y-3.5 text-xs text-brand-dark-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-gold-500 shrink-0 mt-0.5" />
                <span>Geeta University Campus, NH-709, Panipat, Haryana, 132145</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-gold-500 shrink-0" />
                <span>+91 99960 51000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-gold-500 shrink-0" />
                <span>merch@geetauniversity.edu.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-dark-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-dark-400">
          <p>© {new Date().getFullYear()} Geeta University. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-brand-gold-500 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-brand-gold-500 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
