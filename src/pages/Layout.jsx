
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Calendar, Users, BarChart3, Clock, Menu, X, Briefcase, Settings, ShieldAlert, RadioTower, MessageSquare } from "lucide-react";

const baseNavigationItems = [
  {
    title: "דשבורד",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
  },
  {
    title: "עובדים",
    url: createPageUrl("Employees"),
    icon: Users,
  },
  {
    title: "משמרות",
    url: createPageUrl("Shifts"),
    icon: Clock,
  },
  {
    title: "לוח זמנים",
    url: createPageUrl("Schedule"),
    icon: Calendar,
  },
  {
    title: "מרכז בקרה",
    url: createPageUrl("MissionControlPage"),
    icon: RadioTower,
  },
  {
    title: "בדיקת SMS",
    url: createPageUrl("TestSms"),
    icon: MessageSquare,
  },
  {
    title: "הגדרות",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

const adminNavigationItem = {
  title: "ניהול מערכת",
  url: createPageUrl("AdminDashboard"),
  icon: ShieldAlert,
};

export default function Layout({ children, currentPageName }) { // Added currentPageName prop
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [navigationItems, setNavigationItems] = useState(baseNavigationItems);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const isLandingPage = location.pathname === '/' || currentPageName === "Index"; // Check for landing page

  useEffect(() => {
    const fetchUser = async () => {
      // Don't try to fetch user if we are on the landing page and app is public
      // (This check assumes the platform setting "Public (No Login)" should allow index page without login)
      if (isLandingPage) {
        setIsUserLoading(false);
        setCurrentUser(null);
        setNavigationItems([]); // No nav items on landing page if user not logged in or explicitly hidden
        return;
      }

      setIsUserLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        let currentNavItems = [...baseNavigationItems];

        if (user && user.role === 'admin') {
          if (!currentNavItems.find(item => item.url === adminNavigationItem.url)) {
            currentNavItems.push(adminNavigationItem);
          }
        } else {
          currentNavItems = currentNavItems.filter(item => item.url !== adminNavigationItem.url);
        }
        setNavigationItems(currentNavItems);
      } catch (error) {
        console.warn("User not authenticated for layout:", error.message);
        setCurrentUser(null);
        setNavigationItems([]); 
        // If not on landing page and auth fails, the specific page should handle redirection.
        // Layout should not redirect here directly.
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchUser();
  }, [location.pathname, isLandingPage]); // Added isLandingPage to dependencies

  // If it's the landing page, and we are still in user loading phase (which shouldn't happen due to above logic)
  // or if it's the landing page and user isn't strictly required by layout itself
  if (isLandingPage && !currentUser && !isUserLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }
  
  // If user is loading for non-landing pages
  if (isUserLoading && !isLandingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user for non-landing pages (should be caught by individual pages already)
  // This is a fallback if a page doesn't implement its own auth check and redirect
  if (!currentUser && !isLandingPage && !isUserLoading) {
     console.warn("Layout: No current user for a protected page. Page should have redirected.");
     // It's better if individual pages handle their redirect to '/'
     // For safety, we can render children, assuming the page will show its own "redirecting..." message.
     // Or, more aggressively: window.location.href = '/'; return null;
     return (
        <div className="min-h-screen bg-gray-50">
            <main className="flex-1">
              {children} {/* Let the page handle its redirect logic */}
            </main>
        </div>
     );
  }


  // Regular layout for authenticated users on non-landing pages
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } md:translate-x-0`}>
        {/* Logo and Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center">
              <RadioTower className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">ShiftWise MC</h2>
              <p className="text-sm text-indigo-600">בקרת משמרות</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile - Conditionally render if user is loaded and exists */}
        <div className="absolute bottom-0 right-0 left-0 p-6 border-t border-gray-200">
          {!isUserLoading && currentUser && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {currentUser.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500">{currentUser.role === 'admin' ? 'מנהל מערכת' : 'משתמש'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:mr-72">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800 md:hidden">ShiftWise MC</h1>
            </div>
            {/* You can add other header elements here, like search or user menu for desktop */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
