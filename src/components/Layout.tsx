﻿﻿﻿﻿﻿﻿import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, ClipboardList, UserCircle, Menu, LogOut } from 'lucide-react';
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
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowInactive: true, // Allow inactive students to view dashboard
  },
  {
    title: "Leave Request",
    href: "/leave-request",
    icon: FileText,
    allowInactive: false, // Disable for inactive students
  },
  {
    title: "OD Request",
    href: "/od-request",
    icon: Briefcase,
    allowInactive: false, // Disable for inactive students
  },
  {
    title: "Request Status",
    href: "/request-status",
    icon: ClipboardList,
    allowInactive: true, // Allow inactive students to view request status (read-only)
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserCircle,
    allowInactive: true, // Allow inactive students to view profile
  },
];

const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
  const location = useLocation();
  const { currentUser } = useAppContext();
  const isUserActive = currentUser?.is_active ?? true;

  // Get the best profile picture URL (handles custom uploads and Gravatar)
  const profilePictureUrl = getBestProfilePicture(currentUser?.profile_photo, currentUser?.email);

  return (
    <>
      <Link to="/profile" className="flex items-center space-x-3 p-4 mb-6 hover:bg-sidebar-accent rounded-lg transition-colors">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profilePictureUrl} alt={currentUser?.name} />
          <AvatarFallback><UserCircle className="h-10 w-10 text-sidebar-primary-foreground" /></AvatarFallback>
        </Avatar>
        <span className="font-semibold text-lg text-foreground">{currentUser?.name}</span>
      </Link>
      <Separator className="bg-sidebar-border mb-6" />
      {!isUserActive && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium text-center">
            Account Inactive - Limited Access
          </p>
        </div>
      )}
      <nav className="flex flex-col space-y-2">
        {sidebarNavItems.map((item) => {
          const isDisabled = !isUserActive && !item.allowInactive;
          const buttonContent = isDisabled ? (
            <Button
              variant="ghost"
              className="justify-start text-sidebar-foreground/50 opacity-50 cursor-not-allowed rounded-xl"
              disabled
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.title}
            </Button>
          ) : (
            <Button
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

          return isMobile ? (
            <SheetClose key={item.href} asChild={!isDisabled}>
              {buttonContent}
            </SheetClose>
          ) : (
            <React.Fragment key={item.href}>
              {buttonContent}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
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
              <SheetContent side="left" className="w-64 bg-sidebar/95 backdrop-blur-lg text-sidebar-foreground border-r-0 p-0">
                <SidebarContent isMobile />
              </SheetContent>
            </Sheet>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* Right-aligned icons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Notifications role="student" />
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={onLogout} className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto animate-slide-up">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
