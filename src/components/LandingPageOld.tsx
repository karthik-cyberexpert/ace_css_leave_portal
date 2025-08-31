import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Shield, ChevronRight, BookOpen, Calendar, FileText } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  
  const handleLoginRedirect = () => {
    // All login buttons redirect to the same login page
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Leave Management System</h1>
            </div>
            <Button onClick={handleLoginRedirect} className="flex items-center space-x-2">
              <span>Login</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Cyber Security Department
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Streamline Your
            <span className="text-blue-600"> Leave Management</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive digital solution for managing student leave requests, OD applications, 
            and academic attendance with role-based access for students, tutors, and administrators.
          </p>
          
          {/* Login Options */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={handleLoginRedirect}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Student Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Submit leave requests, OD applications, and track your attendance records.
                </p>
                <Button className="w-full" onClick={handleLoginRedirect}>
                  Login as Student
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={handleLoginRedirect}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Tutor Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Review and approve student requests, monitor batch performance and attendance.
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleLoginRedirect}>
                  Login as Tutor
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={handleLoginRedirect}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage users, configure system settings, and oversee all academic operations.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleLoginRedirect}>
                  Login as Admin
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need for efficient leave management</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Digital Requests</h3>
              <p className="text-gray-600">
                Submit leave and OD requests digitally with automatic workflow routing and approval tracking.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Attendance Tracking</h3>
              <p className="text-gray-600">
                Real-time attendance monitoring with detailed reports and analytics for better decision making.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Batch Management</h3>
              <p className="text-gray-600">
                Organize students by batches and semesters with customizable academic calendar management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Access the system with your credentials and start managing leave requests efficiently.
          </p>
          <Button size="lg" onClick={handleLoginRedirect} className="text-lg px-8 py-3">
            Access System
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6" />
                <span className="text-lg font-semibold">Leave Management System</span>
              </div>
              <p className="text-gray-400">
                Simplifying academic leave management for the Cyber Security Department.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
              <ul className="space-y-2">
                <li><button onClick={handleLoginRedirect} className="text-gray-400 hover:text-white transition-colors">Student Portal</button></li>
                <li><button onClick={handleLoginRedirect} className="text-gray-400 hover:text-white transition-colors">Tutor Dashboard</button></li>
                <li><button onClick={handleLoginRedirect} className="text-gray-400 hover:text-white transition-colors">Admin Panel</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">Leave Request Management</li>
                <li className="text-gray-400">OD Application Processing</li>
                <li className="text-gray-400">Attendance Tracking</li>
                <li className="text-gray-400">Batch Management</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Cyber Security Department - Leave Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
