import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Heart size={36} className="text-primary-300" />
      </div>
      <h1 className="text-8xl font-black text-gray-200 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h2>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-primary"><Home size={16} />Go Home</Link>
        <Link to="/doctors" className="btn-secondary"><Search size={16} />Find Doctors</Link>
      </div>
    </div>
  </div>
);
