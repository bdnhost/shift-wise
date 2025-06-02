
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart2, Settings } from "lucide-react";
import UserManagementTable from "../components/admin/UserManagementTable";
import { createPageUrl } from "@/utils"; // For potential redirection

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      if (!user || user.role !== 'admin') {
        // Redirect non-admins to Dashboard instead of Index
        alert("אין לך הרשאה לגשת לדף זה.");
        window.location.href = createPageUrl("Dashboard");
        return;
      }
    } catch (error) {
      // Error fetching user, likely not authenticated
      console.error("Admin dashboard - user not authenticated:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/'; // Redirect to Index page
        return;
      }
      // Fallback for other errors, though 401 is the primary case for unauthenticated
      alert("עליך להתחבר כדי לגשת לדף זה.");
      window.location.href = '/'; // Redirect to Index page
      return;
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // If not admin after loading (though redirect should have happened)
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6 text-center text-red-600">
        <h1 className="text-2xl font-bold">גישה נדחתה</h1>
        <p>אין לך הרשאה לצפות בדף זה.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">לוח בקרה למנהל</h1>
        <p className="text-gray-600 mt-1">ניהול הגדרות המערכת והמשתמשים.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ניהול משתמשים
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            סטטיסטיקות (בקרוב)
          </TabsTrigger>
          <TabsTrigger value="system-settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            הגדרות מערכת (בקרוב)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementTable />
        </TabsContent>
        
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>סטטיסטיקות שימוש</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">תכונה זו תהיה זמינה בקרוב.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-settings">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות מערכת גלובליות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">תכונה זו תהיה זמינה בקרוב.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
