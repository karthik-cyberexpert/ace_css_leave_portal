import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckCircle, Briefcase, ClipboardList, Shield, Users, UserCog, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Notifications } from '@/components/Notifications';
import { useAppContext } from '@/context/AppContext';
import { ThemeToggle } from './theme-toggle';

const sidebarNavItems = [
  { title: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Leave Requests", href: "/admin-leave-requests", icon: CheckCircle },
  { title: "OD Requests", href: "/admin-od-requests", icon: Briefcase },
  { title: "Reports", href: "/admin-reports", icon: ClipboardList },
  { title: "Students", href: "/admin-students", icon: Users },
  { title: "Staff", href: "/admin-staff", icon: UserCog },
  { title: "Profile", href: "/admin-profile", icon: Shield },
];

const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const location = useLocation();
  const { profile } = useAppContext();
  const LinkComponent = isMobile ? SheetClose : React.Fragment;

  const displayName = (profile?.first_name && profile?.last_name) 
    ? `${profile.first_name} ${profile.last_name}` 
    : 'Admin User';
  const avatarSrc = profile?.profile_photo;

  return (
    <>
      <Link to="/admin-profile" className="flex items-center space-x-3 p-4 mb-6 hover:bg-sidebar-accent rounded-lg transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarSrc} alt="Admin" />
          <AvatarFallback><Shield className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <span className="font-semibold text-lg text-gray-900">{displayName}</span>
      </Link>
      <Separator className="bg-sidebar-border mb-6" />
      <nav className="flex flex-col space-y-2">
        {sidebarNavItems.map((item) => (
          <LinkComponent key={item.href} asChild>
            <Button
              variant="ghost"
              className={cn(
                "justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200",
                location.pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              asChild
            >
              <Link to={item.href} className="flex items-center w-full">
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            </Button>
          </LinkComponent>
        ))}
      </nav>
    </>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 flex-col shadow-lg hidden md:flex">
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between bg-white border-b p-4 sticky top-0 z-10 h-16">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground border-r-0 p-0">
                <SidebarContent isMobile />
              </SheetContent>
            </Sheet>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* Right-aligned icons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Notifications role="admin" />
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={() => navigate('/login')}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;