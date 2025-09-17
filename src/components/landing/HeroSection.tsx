import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, PlayCircle, Zap, Shield } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-indigo-100/60 py-20 sm:py-24 lg:py-32">
      {/* Beautiful background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-indigo-400/10" />
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
            {/* Badge */}
            <div className="flex items-center justify-center lg:justify-start">
              <Badge 
                variant="secondary" 
                className="mb-4 inline-flex items-center space-x-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-beautiful animate-scale-in"
              >
                <Zap className="h-3 w-3" />
                <span>Cyber Security Department</span>
              </Badge>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl animate-slide-up">
              <span className="block">Streamline Your</span>
              <span className="block text-gradient">
                Leave Management
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl animate-slide-up" style={{animationDelay: '0.2s'}}>
              A comprehensive digital solution for managing student leave requests, OD applications, 
              and academic attendance with role-based access for students, tutors, and administrators.
            </p>

            {/* Key features list */}
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600 justify-center lg:justify-start animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-emerald-500 mr-2" />
                Secure & Reliable
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-blue-600 mr-2" />
                Real-time Updates
              </div>
              <div className="flex items-center">
                <PlayCircle className="h-4 w-4 text-indigo-600 mr-2" />
                Easy to Use
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{animationDelay: '0.6s'}}>
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-beautiful-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleGetStarted}
                className="border-slate-300 text-slate-700 hover:bg-white hover:border-blue-300 hover:text-blue-700 px-8 py-3 text-lg font-semibold transition-all duration-300 shadow-beautiful hover:shadow-beautiful-lg transform hover:-translate-y-1"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                View Demo
              </Button>
            </div>

            {/* Stats or social proof */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start text-sm text-slate-500 space-y-2 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center">
                <span className="font-semibold text-slate-900">500+</span>
                <span className="ml-1">Active Students</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-slate-900">50+</span>
                <span className="ml-1">Faculty Members</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-slate-900">99.9%</span>
                <span className="ml-1">Uptime</span>
              </div>
            </div>
          </div>

          {/* Right side - Visual/Image */}
          <div className="mt-12 lg:col-span-6 lg:mt-0 animate-fade-in" style={{animationDelay: '0.8s'}}>
            <div className="relative">
              {/* Main visual container */}
              <div className="relative mx-auto w-full max-w-lg">
                {/* Floating cards mockup */}
                <div className="relative">
                  {/* Background card */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-3xl transform rotate-6 blur-sm" />
                  
                  {/* Main card */}
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-beautiful-xl p-8 transform -rotate-2 hover:rotate-0 transition-all duration-500 border border-white/50">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Leave Request</h3>
                        <p className="text-sm text-slate-500">Student Portal</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Status</span>
                        <Badge className="bg-emerald-50 text-emerald-700 text-xs border-emerald-200">Approved</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Duration</span>
                        <span className="text-sm font-medium">3 Days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Approved by</span>
                        <span className="text-sm font-medium">Dr. Smith</span>
                      </div>
                    </div>
                    
                    <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-beautiful">
                      View Details
                    </Button>
                  </div>

                  {/* Floating notification */}
                  <div className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-beautiful-lg p-4 border border-white/60 animate-scale-in" style={{animationDelay: '1.2s'}}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mr-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">Request Approved!</p>
                        <p className="text-xs text-slate-500">2 min ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
