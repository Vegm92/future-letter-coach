import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Plus,
  Settings,
  User,
  LogOut,
  PenTool
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "All Letters", url: "/letters", icon: Mail },
  { title: "Create Letter", url: "/create", icon: Plus },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  user: any;
  onCreateClick: () => void;
}

export function AppSidebar({ user, onCreateClick }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreateClick();
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center space-x-2">
          <PenTool className="h-8 w-8 text-primary" />
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              FutureLetter AI
            </h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.title === "Create Letter" ? (
                      <button
                        onClick={handleCreateClick}
                        className={`w-full flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 ${
                          collapsed ? "justify-center" : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    ) : (
                      <NavLink
                        to={item.url}
                        className={({ isActive: linkActive }) =>
                          `flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 ${
                            isActive(item.url) || linkActive
                              ? "bg-muted text-primary font-medium"
                              : ""
                          } ${collapsed ? "justify-center" : ""}`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="space-y-2">
          {!collapsed && (
            <div className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className={`w-full ${collapsed ? "p-2" : ""}`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}