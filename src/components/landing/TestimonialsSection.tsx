﻿﻿﻿﻿import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, GraduationCap, Users, Shield } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Department Head",
      department: "Cyber Security",
      avatar: "",
      rating: 5,
      content: "This system has revolutionized how we handle student leave requests. The automation and transparency have reduced our administrative burden by 80%.",
      highlight: "Reduced administrative burden by 80%"
    },
    {
      name: "Prof. Michael Chen",
      role: "Academic Tutor",
      department: "Computer Science",
      avatar: "",
      rating: 5,
      content: "As a tutor managing multiple batches, this platform makes it effortless to track and approve student requests. The real-time notifications are a game-changer.",
      highlight: "Game-changing notifications"
    },
    {
      name: "Priya Sharma",
      role: "Final Year Student",
      department: "Cyber Security",
      avatar: "",
      rating: 5,
      content: "The student portal is incredibly user-friendly. I can submit requests, track status, and manage my attendance all in one place. It's so much better than paper forms!",
      highlight: "Better than paper forms"
    },
    {
      name: "Dr. Robert Williams",
      role: "Dean of Academics",
      department: "Faculty Administration",
      avatar: "",
      rating: 5,
      content: "The analytics and reporting features provide excellent insights into student attendance patterns. This data helps us make informed academic decisions.",
      highlight: "Excellent insights for decision making"
    },
    {
      name: "Amit Patel",
      role: "Third Year Student",
      department: "Information Security",
      avatar: "",
      rating: 5,
      content: "Quick approvals, instant notifications, and easy OD certificate uploads. Everything I need for managing my academic leaves efficiently.",
      highlight: "Everything I need efficiently"
    },
    {
      name: "Dr. Lisa Thompson",
      role: "System Administrator",
      department: "IT Department",
      avatar: "",
      rating: 5,
      content: "The platform is robust, secure, and scales well. The role-based access control and audit trails meet all our compliance requirements perfectly.",
      highlight: "Meets all compliance requirements"
    }
  ];

  const stats = [
    {
      icon: GraduationCap,
      value: "500+",
      label: "Active Students",
      description: "Students actively using the platform"
    },
    {
      icon: Users,
      value: "50+",
      label: "Faculty Members",
      description: "Tutors and administrators"
    },
    {
      icon: Shield,
      value: "99.9%",
      label: "Uptime",
      description: "Reliable service availability"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index}
        className={`h-4 w-4 ${index < rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
      />
    ));
  };

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50/50 to-white relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-blue-50/30" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-beautiful animate-scale-in">
            Testimonials
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl animate-slide-up">
            Loved by students, tutors,
            <span className="block text-gradient">
              and administrators
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our users have to say about their experience 
            with our leave management system.
          </p>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-20 animate-slide-up" style={{animationDelay: '0.2s'}}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors duration-300 shadow-beautiful">
                    <IconComponent className="h-8 w-8" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 sm:text-4xl">{stat.value}</div>
                <div className="text-lg font-semibold text-slate-700 mt-2">{stat.label}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Testimonials grid */}
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3 animate-slide-up" style={{animationDelay: '0.4s'}}>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-beautiful-lg hover:shadow-beautiful-xl transition-all duration-300 group transform hover:-translate-y-1">
              <CardContent className="p-8">
                {/* Quote icon */}
                <div className="flex justify-between items-start mb-6">
                  <Quote className="h-8 w-8 text-blue-200 group-hover:text-blue-400 transition-colors duration-300" />
                  <div className="flex space-x-1">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>

                {/* Testimonial content */}
                <blockquote className="text-slate-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Highlight */}
                <div className="mb-6">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs border-blue-200">
                    {testimonial.highlight}
                  </Badge>
                </div>

                {/* Author info */}
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.department}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom section with overall rating */}
        <div className="mt-20 animate-fade-in" style={{animationDelay: '0.6s'}}>
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="flex space-x-1 mr-4">
                {renderStars(5)}
              </div>
              <span className="text-2xl font-bold text-slate-900">5.0</span>
              <span className="text-slate-600 ml-2">out of 5 stars</span>
            </div>
            <p className="text-lg text-slate-600 mb-8">
              Based on 200+ reviews from students, tutors, and administrators
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                GDPR Compliant
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                ISO 27001 Certified
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                24/7 Support
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                99.9% Uptime SLA
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
