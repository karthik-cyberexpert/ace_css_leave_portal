import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckCircle, Briefcase, ClipboardList, Shield, Users, UserCog, Menu, LogOut, Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Notifications } from '@/components/Notifications';
import { useAppContext } from '@/context/AppContext';
import { ThemeToggle } from './theme-toggle';
import { getBestProfilePicture } from '@/utils/gravatar';
import Footer from './Footer';

const sidebarNavItems = [
  { title: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Leave Requests", href: "/admin-leave-requests", icon: CheckCircle },
  { title: "OD Requests", href: "/admin-od-requests", icon: Briefcase },
  { title: "Batch Management", href: "/admin-batch-management", icon: Calendar },
  { title: "Schedule Days", href: "/admin-schedule-days", icon: CalendarDays },
  { title: "Reports", href: "/admin-reports", icon: ClipboardList },
  { title: "Students", href: "/admin-students", icon: Users },
  { title: "Staff", href: "/admin-staff", icon: UserCog },
  { title: "Profile", href: "/admin-profile", icon: Shield },
];

const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const location = useLocation();
  const { profile, user } = useAppContext();

  const displayName = (profile?.first_name && profile?.last_name) 
    ? `${profile.first_name} ${profile.last_name}` 
    : 'Admin User';
  
  // Use getBestProfilePicture to get either custom image or Gravatar fallback
  const avatarSrc = getBestProfilePicture(profile?.profile_photo, user?.email);

  const profileLink = (
    <Link to="/admin-profile" className="flex items-center space-x-3 p-4 mb-6 hover:bg-sidebar-accent rounded-xl transition-all duration-300 hover:shadow-beautiful group">
      <Avatar className="h-10 w-10 ring-2 ring-sidebar-border group-hover:ring-primary/50 transition-all">
        <AvatarImage src={avatarSrc} alt="Admin" />
        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground"><Shield className="h-6 w-6" /></AvatarFallback>
      </Avatar>
      <span className="font-semibold text-lg text-sidebar-foreground group-hover:text-primary transition-colors">{displayName}</span>
    </Link>
  );

  return (
    <>
      {isMobile ? (
        <SheetClose asChild>
          {profileLink}
        </SheetClose>
      ) : (
        profileLink
      )}
      <Separator className="bg-sidebar-border mb-6" />
      <nav className="flex flex-col space-y-2">
        {sidebarNavItems.map((item) => {
          const buttonElement = (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 rounded-xl group",
                location.pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground shadow-beautiful"
              )}
              asChild
            >
              <Link to={item.href} className="flex items-center w-full">
                <item.icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                {item.title}
              </Link>
            </Button>
          );

          if (isMobile) {
            return (
              <SheetClose key={item.href} asChild>
                {buttonElement}
              </SheetClose>
            );
          }

          return buttonElement;
        })}
      </nav>
    </>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout } = useAppContext();

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/30 animate-fade-in">
      <aside className="w-64 bg-sidebar/90 backdrop-blur-xl text-sidebar-foreground border-r border-sidebar-border p-4 flex-col shadow-beautiful-xl hidden md:flex">
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between bg-background/90 backdrop-blur-lg border-b border-border p-4 sticky top-0 z-10 h-16 shadow-beautiful">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-border hover:bg-accent"><Menu className="h-6 w-6" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar/95 backdrop-blur-lg text-sidebar-foreground border-r-0 p-4">
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
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={onLogout} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main key={location.pathname} className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto animate-slide-up">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;