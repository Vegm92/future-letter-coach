/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * Provides navigation between authenticated pages with active state highlighting
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Mail, 
  Settings, 
  LogOut,
  Menu,
  X,
  Target,
  Code,
  Wrench
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and stats'
  },
  {
    title: 'Letters',
    href: '/letters',
    icon: Mail,
    description: 'Manage your future letters'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account preferences'
  }
];

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
}

export function Sidebar({ className = '', isCollapsed, onToggleCollapse, user }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    return email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    return user?.email || 'User';
  };

  return (
    <div className={`flex flex-col h-full bg-card border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}>
      {/* Header */}
      <div className={`flex items-center p-4 border-b ${
        isCollapsed ? 'justify-center flex-col space-y-2' : 'justify-between'
      }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2 min-w-0">
              <Target className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="overflow-hidden">
                <h2 className="text-lg font-semibold whitespace-nowrap">Letter Coach</h2>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Future Self</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Target className="h-6 w-6 text-primary" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full h-auto p-3 ${
                    isCollapsed 
                      ? 'justify-center' 
                      : 'justify-start'
                  } ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <div className="ml-3 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-80">{item.description}</div>
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Development Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Development
                </h3>
              </div>
            )}
            <div className="space-y-1">
              <Link to="/dev/email-preview">
                <Button
                  variant={location.pathname === '/dev/email-preview' ? 'default' : 'ghost'}
                  className={`w-full h-auto p-3 ${
                    isCollapsed 
                      ? 'justify-center' 
                      : 'justify-start'
                  } ${
                    location.pathname === '/dev/email-preview'
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  title={isCollapsed ? 'Email Preview' : undefined}
                >
                  <Code className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <div className="ml-3 text-left">
                      <div className="font-medium">Email Preview</div>
                      <div className="text-xs opacity-80">Dev tool for emails</div>
                    </div>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* User Profile & Logout */}
      <div className={`p-4 space-y-3 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : 'space-x-3'}`}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground">
                Account
              </p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={`w-full ${isCollapsed ? 'p-2 justify-center' : 'justify-start'}`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
