import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Shield,
  Heart,
  ChevronUp,
  GraduationCap
} from 'lucide-react';

const FooterSection = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { label: 'Student Portal', path: '/login' },
    { label: 'Tutor Portal', path: '/login' },
    { label: 'Admin Portal', path: '/login' },
    { label: 'Help Center', path: '/login' },
    { label: 'Documentation', path: '/login' },
    { label: 'System Status', path: '/login' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Leave Portal</h3>
                <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800">
                  Cyber Security Dept.
                </Badge>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Simplifying academic leave management for the Cyber Security Department.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Access</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button 
                    onClick={() => handleNavigation(link.path)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-3 text-blue-400" />
                cybersec.dept@university.edu
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-3 text-blue-400" />
                +1 (555) 123-4567
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-6">System</h3>
            <Button 
              onClick={() => handleNavigation('/login')}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              Access System
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2024 Cyber Security Department - Leave Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
