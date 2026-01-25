"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  LogOut,
  Menu as MenuIcon,
  Package,
  Settings,
  User,
  Shield,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton"; // Import skeleton component

import { useIsMobile } from "@/hooks/use-mobile";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: session, status } = useSession();
  const userRole = session?.user?.role || "User";

  // Authentication check with proper redirect to /auth/login
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session && status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, status, pathname, router]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Show skeleton loader while checking authentication
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Skeleton className="h-9 w-9 md:hidden" />
          <div className="hidden md:flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>

        <div className="flex flex-1">
          {/* Sidebar Skeleton */}
          <aside className="hidden w-64 shrink-0 border-r md:block">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
            
            <nav className="flex flex-col gap-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
              <Skeleton className="h-10 w-full mt-4" />
            </nav>
          </aside>
          
          {/* Main Content Skeleton */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {/* Mobile user info skeleton */}
            <div className="mb-4 md:hidden">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            
            {/* Page content skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session || status === "unauthenticated") {
    return null;
  }

  // Navigation items based on user role
  const adminNavItems = [
    { title: "Dashboard", href: "/dashboard/products", icon: Package },
    { title: "Records", href: "/dashboard/records", icon: FileText },
    { title: "Users", href: "/dashboard/users", icon: User },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const userNavItems = [
    { title: "Dashboard", href: "/dashboard/products", icon: Package },
    { title: "Records", href: "/dashboard/records", icon: FileText },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Use Admin nav if role is "Admin", otherwise use User nav
  const navItems = userRole === "Admin" ? adminNavItems : userNavItems;

  const isNavItemActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace("/auth/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <div className="flex items-center justify-center border-b px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="https://images.unsplash.com/photo-1741335661527-39595b58807f?q=80&w=578&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Logo"
                  width={120}
                  height={48}
                  className="rounded-lg object-contain"
                  priority
                />
              </Link>
            </div>
            <nav className="flex flex-col gap-2 p-3 overflow-y-auto">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isNavItemActive(item)
                      ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge className="ml-auto flex h-6 w-6 items-center justify-center rounded-full">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
              {/* Logout link in sidebar */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-100 text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo for desktop */}
        <Link href="/" className="hidden md:flex items-center gap-2">
          <div className="relative w-[120px] h-[60px]">
            <Image
              src="https://images.unsplash.com/photo-1741335661527-39595b58807f?q=80&w=578&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Logo"
              fill
              className="object-contain"
              priority
              sizes="120px"
            />
          </div>
        </Link>

        <div className="flex-1"></div>

        {/* User info and logout on desktop */}
        <div className="hidden md:flex items-center gap-4">
          <Badge variant={userRole === "Admin" ? "default" : "secondary"}>
            {userRole}
          </Badge>
          <span className="text-sm text-gray-600">
            {session?.user?.name || "User"}
          </span>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* User dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image || "/placeholder-user.jpg"}
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || userRole?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {session?.user?.name || "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuLabel className="text-xs font-normal text-gray-500">
              {userRole}
              {session?.user?.email && (
                <div className="text-gray-400 truncate max-w-[200px]">
                  {session.user.email}
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={session?.user?.image || "/placeholder-user.jpg"}
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || userRole?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{session?.user?.name || "User"}</p>
                <Badge variant={userRole === "Admin" ? "default" : "outline"} className="text-xs">
                  {userRole}
                </Badge>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1 p-3 h-[calc(100vh-12rem)] overflow-y-auto">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                  isNavItemActive(item)
                    ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                    : "hover:bg-gray-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge className="ml-auto flex h-6 w-6 items-center justify-center rounded-full">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
            {/* Logout link in sidebar */}
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-red-50 text-red-600 border border-red-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* Optional: Show user role info at the top */}
          <div className="mb-4 md:hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border">
              <div>
                <p className="font-medium">{session?.user?.name || "User"}</p>
                <Badge variant={userRole === "Admin" ? "default" : "outline"}>
                  {userRole}
                </Badge>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
}