import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  BookOpen, 
  Shield, 
  Zap, 
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  Mail,
  Smartphone,
  Lock
} from 'lucide-react';

const FeaturesSection = () => {
  const mainFeatures = [
    {
      icon: FileText,
      title: 'Digital Requests',
      description: 'Submit leave and OD requests digitally with automatic workflow routing and approval tracking.',
      color: 'bg-blue-50 text-blue-600',
      features: ['One-click submissions', 'File attachments', 'Status tracking', 'Digital signatures']
    },
    {
      icon: Calendar,
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with detailed reports and analytics for better decision making.',
      color: 'bg-emerald-50 text-emerald-600',
      features: ['Real-time updates', 'Detailed reports', 'Analytics dashboard', 'Export options']
    },
    {
      icon: BookOpen,
      title: 'Batch Management',
      description: 'Organize students by batches and semesters with customizable academic calendar management.',
      color: 'bg-indigo-50 text-indigo-600',
      features: ['Semester planning', 'Batch organization', 'Academic calendar', 'Student grouping']
    }
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with data encryption and compliance standards.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with real-time updates and instant notifications.',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Customized dashboards and permissions for students, tutors, and admins.',
    },
    {
      icon: CheckCircle,
      title: 'Approval Workflows',
      description: 'Automated approval chains with customizable rules and notifications.',
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Accurate leave balance calculation and attendance time management.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Comprehensive reporting with insights and trend analysis.',
    },
    {
      icon: Mail,
      title: 'Smart Notifications',
      description: 'Email and in-app notifications for important updates and deadlines.',
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Seamless experience across all devices with mobile-first design.',
    },
    {
      icon: Lock,
      title: 'Data Privacy',
      description: 'GDPR compliant with advanced privacy controls and data protection.',
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50/50 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 bg-blue-50 text-blue-700 border-blue-200 shadow-beautiful animate-scale-in">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl animate-slide-up">
            Everything you need for
            <span className="block text-gradient">
              efficient leave management
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Our comprehensive platform provides all the tools and features you need to streamline 
            academic leave management processes with ease and efficiency.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid gap-8 lg:grid-cols-3 mb-20 animate-slide-up" style={{animationDelay: '0.4s'}}>
          {mainFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="relative bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-beautiful-lg hover:shadow-beautiful-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <CardHeader className="pb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-slate-600 mb-6">{feature.description}</p>
                  
                  {/* Feature list */}
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-500">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional features section */}
        <div className="relative">
          <div className="text-center mb-12 animate-fade-in">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Powered by advanced capabilities
            </h3>
            <p className="mt-4 text-lg text-slate-600">
              Built with modern technology stack for reliability and performance
            </p>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-slide-up" style={{animationDelay: '0.6s'}}>
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-beautiful hover:shadow-beautiful-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                        {feature.title}
                      </h4>
                      <p className="mt-2 text-sm text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA section */}
        <div className="mt-20 text-center animate-slide-up" style={{animationDelay: '0.8s'}}>
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-8 py-12 shadow-beautiful-xl border border-blue-500/20">
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to transform your leave management?
            </h3>
            <p className="mt-4 text-lg text-blue-50">
              Join hundreds of educational institutions already using our platform
            </p>
            <div className="mt-8">
              <div className="flex flex-wrap justify-center gap-8 text-blue-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-sm">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">ISO27001</div>
                  <div className="text-sm">Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
