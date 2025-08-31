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
      color: 'bg-blue-100 text-blue-600',
      features: ['One-click submissions', 'File attachments', 'Status tracking', 'Digital signatures']
    },
    {
      icon: Calendar,
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with detailed reports and analytics for better decision making.',
      color: 'bg-green-100 text-green-600',
      features: ['Real-time updates', 'Detailed reports', 'Analytics dashboard', 'Export options']
    },
    {
      icon: BookOpen,
      title: 'Batch Management',
      description: 'Organize students by batches and semesters with customizable academic calendar management.',
      color: 'bg-purple-100 text-purple-600',
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
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Everything you need for
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              efficient leave management
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools and features you need to streamline 
            academic leave management processes with ease and efficiency.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid gap-8 lg:grid-cols-3 mb-20">
          {mainFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="relative bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  
                  {/* Feature list */}
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
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
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Powered by advanced capabilities
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              Built with modern technology stack for reliability and performance
            </p>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {feature.title}
                      </h4>
                      <p className="mt-2 text-sm text-gray-600">
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
        <div className="mt-20 text-center">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12">
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to transform your leave management?
            </h3>
            <p className="mt-4 text-lg text-blue-100">
              Join hundreds of educational institutions already using our platform
            </p>
            <div className="mt-8">
              <div className="flex flex-wrap justify-center gap-8 text-blue-100">
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
