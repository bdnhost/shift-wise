
import React, { useState, useEffect } from "react";
import { Employee, Shift, User } from "@/api/entities"; // Added User
import { Organization } from '@/api/entities'; // Added Organization
import StatsCard from "../components/dashboard/StatsCard";
import RecentShifts from "../components/dashboard/RecentShifts";
import QuickActions from "../components/dashboard/QuickActions";
import { Users, Clock, AlertCircle, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null); // New state for organization ID
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // First, attempt to fetch the current user
      const user = await User.me();
      setCurrentUser(user);
      
      // If user fetching is successful, then fetch the current organization
      const orgs = await Organization.list();
      if (orgs.length > 0) {
        const currentOrg = orgs[0]; // Assuming one organization per user for now
        setCurrentOrganizationId(currentOrg.id);
        
        // Then, fetch other dashboard data, filtered by the current organization ID
        const [employeesData, shiftsData] = await Promise.all([
          Employee.filter({ organization_id: currentOrg.id }),
          Shift.filter({ organization_id: currentOrg.id }, "-date") // Fetch shifts sorted by date descending for the organization
        ]);
        setEmployees(employeesData);
        setShifts(shiftsData);
      } else {
        // If no organization is found, set currentOrganizationId to null
        setCurrentOrganizationId(null);
        console.warn("No organization found for the current user. Please ensure an organization is set up.");
      }
    } catch (error) {
      console.error("שגיאה בטעינת נתוני הדשבורד:", error);
      // If user is not authenticated (e.g., 401 status), redirect to the landing page
      if (error.response && error.response.status === 401) {
        window.location.href = '/'; // Redirect to Index page (landing page)
        return; // Stop further execution in this component instance
      }
      // For any other error, ensure currentUser and currentOrganizationId are null to indicate no valid session/org
      setCurrentUser(null); 
      setCurrentOrganizationId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a general loading state (spinner) while authentication and initial data are being fetched
  if (isLoading) {
    return (
      <div className="p-6 space-y-8 bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen">
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני דשבורד...</p>
        </div>
      </div>
    );
  }

  // If isLoading is false but currentUser is null, it means authentication failed
  // If currentOrganizationId is null, it means no organization was found/assigned
  if (!currentUser || !currentOrganizationId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">מפנה לדף הכניסה או שאין ארגון מוגדר...</p>
      </div>
    );
  }

  // Calculations based on loaded data (only proceeds if isLoading is false and currentUser is not null)
  const activeEmployeesCount = employees.filter(emp => emp.status === "פעיל").length;
  
  const todayShifts = shifts.filter(shift => {
    try {
      return isToday(parseISO(shift.date));
    } catch (e) { return false; } // Handle invalid date formats if any
  });
  
  const unassignedShiftsCount = shifts.filter(shift => shift.status === "לא מאויש").length;
  
  const shiftsThisWeek = shifts.filter(shift => {
    try {
      const shiftDate = parseISO(shift.date);
      const today = new Date();
      return shiftDate >= startOfWeek(today, { weekStartsOn: 0 }) && shiftDate <= endOfWeek(today, { weekStartsOn: 0 });
    } catch(e) { return false; }
  });

  const totalHoursThisWeek = shiftsThisWeek.reduce((total, shift) => {
    if (!shift.start_time || !shift.end_time) return total; // Skip if times are missing
    try {
      // Create date objects with a common arbitrary date to compare times
      const startDate = new Date(`2000-01-01T${shift.start_time}`);
      const endDate = new Date(`2000-01-01T${shift.end_time}`);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return total;

      let durationHours = (endDate - startDate) / (1000 * 60 * 60);
      if (durationHours < 0) durationHours += 24; // Handles overnight shifts simple case
      return total + durationHours;
    } catch(e) {
      console.warn("Could not parse shift times:", shift.start_time, shift.end_time);
      return total;
    }
  }, 0);
  
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ברוך הבא, {currentUser?.full_name || "משתמש"}!
        </h1>
        <p className="text-lg text-gray-600">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: he })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="עובדים פעילים" 
          value={activeEmployeesCount} 
          icon={Users} 
          color="blue" 
        />
        <StatsCard 
          title="משמרות להיום" 
          value={todayShifts.length} 
          icon={Clock} 
          color="green" 
          change={`${todayShifts.filter(s => s.status === "מאויש").length} מאוישות`}
        />
        <StatsCard 
          title="משמרות לא מאוישות" 
          value={unassignedShiftsCount} 
          icon={AlertCircle} 
          color="red" 
          urgent={unassignedShiftsCount > 0}
          change={unassignedShiftsCount > 0 ? "דורש טיפול!" : "אין דחוף"}
        />
        <StatsCard 
          title="שעות השבוע" 
          value={Math.round(totalHoursThisWeek)} 
          icon={TrendingUp} 
          color="purple"
          change="משוער" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Today's Shifts */}
        <div className="lg:col-span-2">
          <RecentShifts shifts={todayShifts} employees={employees} isLoading={isLoading} />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}
