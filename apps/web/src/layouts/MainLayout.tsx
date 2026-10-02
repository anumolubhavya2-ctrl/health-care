import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Heart } from 'lucide-react';

export const MainLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <footer className="bg-white border-t border-gray-100 py-10 mt-16">
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart size={13} className="text-white fill-white" />
              </div>
              <span className="font-bold text-gray-900">CareSync</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">Healthcare appointments without the uncertainty.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Patients</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/doctors" className="hover:text-primary-600 transition-colors">Find Doctors</Link></li>
              <li><Link to="/symptoms" className="hover:text-primary-600 transition-colors">Symptom Checker</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-600 transition-colors">My Appointments</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Doctors</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/register?role=DOCTOR" className="hover:text-primary-600 transition-colors">Join CareSync</Link></li>
              <li><Link to="/doctor/dashboard" className="hover:text-primary-600 transition-colors">Doctor Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/support" className="hover:text-primary-600 transition-colors">Help Center</Link></li>
              <li><Link to="/support" className="hover:text-primary-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} CareSync. All rights reserved.</p>
          <p className="text-xs text-gray-400">⚠️ CareSync does not provide medical advice. Always consult a qualified healthcare professional.</p>
        </div>
      </div>
    </footer>
  </div>
);
