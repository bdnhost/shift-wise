
import React, { useState, useEffect, useMemo } from "react";
import { Shift, Employee, JobRole, User } from "@/api/entities";
import { Organization } from '@/api/entities'; // Added Organization
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, UserCheck, UserX, Grid3X3, Calendar, Clock, LayoutGrid, Users, MessageSquare, Download, FileText } from "lucide-react";
import { exportShiftsToCSV, exportScheduleToHTML } from "@/utils/exportUtils";
import { toast } from "sonner";
import ShiftForm from "../components/shifts/ShiftForm";
import { format, parse, addDays, subDays, startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ShiftSmsDialog from "../components/shifts/ShiftSmsDialog";

const SHIFT_COLORS = {
  "לא מאויש": "bg-red-200 border-red-400 hover:bg-red-300",
  "מאויש חלקית": "bg-yellow-200 border-yellow-400 hover:bg-yellow-300",
  "מאויש": "bg-green-200 border-green-400 hover:bg-green-300",
  "ממתין לאישור": "bg-orange-200 border-orange-400 hover:bg-orange-300",
};

const DAY_DURATION_MINUTES = 24 * 60;

const VIEW_TYPES = {
  RIVER: 'river',
  GRID: 'grid',
  TIMELINE: 'timeline'
};

export default function ShiftsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null); // Added currentOrganizationId state
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobRoles, setJobRoles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(VIEW_TYPES.RIVER);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [shiftForSms, setShiftForSms] = useState(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    setIsLoading(true);
    try {
      // Check authentication first
      const user = await User.me();
      setCurrentUser(user);
      
      // Fetch the current organization
      const orgs = await Organization.list();
      if (orgs.length > 0) {
        const currentOrg = orgs[0]; // Assuming the first organization is the current one
        setCurrentOrganizationId(currentOrg.id);
        // If authenticated and organization found, load data
        await loadData(currentOrg.id);
      } else {
        console.warn("No organization found. Cannot load shifts.");
        setShifts([]); // Clear shifts if no organization
        setEmployees([]); // Clear employees if no organization
        setJobRoles({}); // Clear job roles if no organization
      }
    } catch (error) {
      console.error("שגיאה באימות או בטעינת נתונים:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/'; // Redirect to Index page
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (organizationId) => {
    try {
      const [shiftsData, employeesData, jobRolesData] = await Promise.all([
        Shift.filter({ organization_id: organizationId }, "-date"), // Filter by organization_id
        Employee.filter({ organization_id: organizationId }),       // Filter by organization_id
        JobRole.filter({ organization_id: organizationId })         // Filter by organization_id
      ]);
      setShifts(shiftsData);
      setEmployees(employeesData);
      
      const rolesMap = {};
      jobRolesData.forEach(role => {
        rolesMap[role.id] = role;
      });
      setJobRoles(rolesMap);
    } catch (error) {
      console.error("שגיאה בטעינת נתונים:", error);
    }
  };

  const handleSaveShift = async (shiftData) => {
    try {
      const dataToSave = {
        ...shiftData,
        date: shiftData.date || format(selectedDate, "yyyy-MM-dd"),
        organization_id: currentOrganizationId // Add organization_id to shift data
      };

      let savedShift;
      if (editingShift) {
        savedShift = await Shift.update(editingShift.id, dataToSave);
      } else {
        savedShift = await Shift.create(dataToSave);
      }
      setShowFormDialog(false);
      setEditingShift(null);
      await loadData(currentOrganizationId); // Reload data for the current organization

      // Return the saved shift so ShiftForm can use it for SMS automation
      return savedShift;
    } catch (error) {
      console.error("שגיאה בשמירת משמרת:", error);
      alert("שגיאה בשמירת המשמרת. בדוק את הקונסול לפרטים.");
      throw error; // Re-throw to let ShiftForm handle it
    }
  };

  const handleOpenFormDialog = (shiftToEdit = null) => {
    setEditingShift(shiftToEdit);
    setShowFormDialog(true);
  };

  const handleDeleteShift = async (shiftId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק משמרת זו?")) {
      try {
        await Shift.delete(shiftId);
        loadData(currentOrganizationId); // Reload data for the current organization
      } catch (error) {
        console.error("שגיאה במחיקת משמרת:", error);
        alert("שגיאה במחיקת המשמרת.");
      }
    }
  };
  
  const handleOpenSmsDialog = (shift) => {
    setShiftForSms(shift);
    setShowSmsDialog(true);
  };

  const handleExportCSV = () => {
    try {
      exportShiftsToCSV(shiftsForSelectedDate, employees, jobRoles);
      toast.success("הייצוא ל-CSV הושלם בהצלחה!");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("שגיאה בייצוא ל-CSV");
    }
  };

  const handleExportSchedule = () => {
    try {
      exportScheduleToHTML(shiftsForSelectedDate, employees, jobRoles, {
        startDate: format(selectedDate, "yyyy-MM-dd"),
        endDate: format(selectedDate, "yyyy-MM-dd"),
        title: `לוח משמרות - ${format(selectedDate, "d MMMM yyyy", { locale: he })}`
      });
      toast.success("פותח דף הדפסה...");
    } catch (error) {
      console.error("Error exporting schedule:", error);
      toast.error("שגיאה בייצוא לוח משמרות");
    }
  };

  const getEmployeeForShiftDisplay = (shift) => {
    if (shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0) {
        if (shift.assigned_employee_ids.length === 1) {
            return getEmployeeById(shift.assigned_employee_ids[0]);
        }
        return { first_name: `${shift.assigned_employee_ids.length} עובדים`, last_name: ''};
    }
    return null;
  }

  const shiftsForSelectedDate = useMemo(() => {
    return shifts.filter(shift => 
        format(parse(shift.date, "yyyy-MM-dd", new Date()), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
    ).sort((a,b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [shifts, selectedDate]);

  const getEmployeeById = (id) => employees.find(emp => emp.id === id);
  const getRoleName = (roleId) => {
    const role = jobRoles[roleId];
    return role ? role.name : "תפקיד לא זמין";
  };

  // River View Component
  const renderRiverView = () => {
    const renderShiftBlock = (shift) => {
      const startTime = parse(shift.start_time, "HH:mm", new Date());
      const endTime = parse(shift.end_time, "HH:mm", new Date());
      
      let durationMinutes = differenceInMinutes(endTime, startTime);
      if (durationMinutes < 0) { // Handles overnight shifts
        durationMinutes += DAY_DURATION_MINUTES;
      }

      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const leftPercentage = (startMinutes / DAY_DURATION_MINUTES) * 100;
      const widthPercentage = (durationMinutes / DAY_DURATION_MINUTES) * 100;
      
      let employeeDisplay;
      let displayIcon;

      if (shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0) {
        if (shift.assigned_employee_ids.length === shift.required_number_of_employees) {
          displayIcon = <UserCheck className="w-3 h-3 text-green-700" />;
          employeeDisplay = shift.assigned_employee_ids.length === 1 
            ? `${getEmployeeById(shift.assigned_employee_ids[0])?.first_name} ${getEmployeeById(shift.assigned_employee_ids[0])?.last_name.charAt(0)}.`
            : `${shift.assigned_employee_ids.length} עובדים`;
        } else {
          displayIcon = <Users className="w-3 h-3 text-yellow-700" />;
          employeeDisplay = `${shift.assigned_employee_ids.length}/${shift.required_number_of_employees} מאויש`;
        }
      } else {
        displayIcon = <UserX className="w-3 h-3 text-red-700" />;
        employeeDisplay = "לא מאויש";
      }
      
      const titleText = `${shift.title} - ${employeeDisplay}\n${shift.start_time} - ${shift.end_time}\nתפקיד: ${getRoleName(shift.required_job_role_id)}\nנדרשים: ${shift.required_number_of_employees}`;

      return (
        <div
          key={shift.id}
          title={titleText}
          className={`absolute h-full py-1 px-2 rounded-md border text-xs cursor-pointer transition-all duration-150 ease-in-out ${SHIFT_COLORS[shift.status] || 'bg-gray-200 border-gray-400'}`}
          style={{
            left: `${leftPercentage}%`,
            width: `${widthPercentage}%`,
            minWidth: '60px',
          }}
          onClick={() => handleOpenFormDialog(shift)}
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className="font-semibold truncate text-gray-800">{shift.title}</p>
              <p className="truncate text-gray-700 text-[10px]">{getRoleName(shift.required_job_role_id)} ({shift.required_number_of_employees})</p>
            </div>
            <div className="mt-auto">
              <div className="flex items-center gap-1">
                {displayIcon}
                <p className={`truncate text-[10px] ${
                    shift.status === 'לא מאויש' ? 'text-red-700' : 
                    shift.status === 'מאויש חלקית' ? 'text-yellow-800' : 'text-gray-700'
                }`}>{employeeDisplay}</p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const hourSlots = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `${hour}:00`;
    });

    return (
      <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
        <div className="relative flex justify-between text-xs text-gray-500 mb-2 px-2">
          {hourSlots.map((hour, index) => (
            <span key={hour} className="flex-1 text-center" style={{ minWidth: `${100/24}%`}}>
              {index % 2 === 0 ? hour : ''}
            </span>
          ))}
        </div>
        <div 
          className="relative w-full h-48 bg-white rounded-lg shadow-md overflow-hidden border-t border-b border-gray-300"
          style={{ direction: 'ltr' }}
        >
          {hourSlots.map((_, index) => (
            <div
              key={`grid-${index}`}
              className="absolute top-0 bottom-0 border-r border-gray-200"
              style={{ left: `${(index / 24) * 100}%`, width: `${(1/24)*100}%` }}
            ></div>
          ))}
          {shiftsForSelectedDate.length > 0 ? 
            shiftsForSelectedDate.map(renderShiftBlock) :
            (
              <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">אין משמרות מתוכננות ליום זה.</p>
              </div>
            )
          }
        </div>
      </div>
    );
  };

  // Grid View Component  
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shiftsForSelectedDate.length > 0 ? shiftsForSelectedDate.map((shift) => {
          let employeeInfo;
          let statusIcon;

          if (shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0) {
            if (shift.assigned_employee_ids.length === shift.required_number_of_employees) {
              statusIcon = <UserCheck className="w-4 h-4 text-green-600" />;
              employeeInfo = shift.assigned_employee_ids.map(id => {
                const emp = getEmployeeById(id);
                return emp ? `${emp.first_name} ${emp.last_name.charAt(0)}.` : 'לא ידוע';
              }).join(', ');
            } else {
              statusIcon = <Users className="w-4 h-4 text-yellow-600" />;
              employeeInfo = `${shift.assigned_employee_ids.length}/${shift.required_number_of_employees} עובדים שובצו`;
            }
          } else {
            statusIcon = <UserX className="w-4 h-4 text-red-600" />;
            employeeInfo = "לא מאויש";
          }
          
          return (
            <div
              key={shift.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${SHIFT_COLORS[shift.status] || 'bg-gray-100 border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-800 text-lg hover:text-blue-600" onClick={() => handleOpenFormDialog(shift)}>{shift.title}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFormDialog(shift);
                    }}
                    title="ערוך משמרת"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-green-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0) {
                            handleOpenSmsDialog(shift);
                        } else {
                            alert("אין עובדים משובצים למשמרת זו כדי לשלוח SMS.");
                        }
                    }}
                    disabled={!shift.assigned_employee_ids || shift.assigned_employee_ids.length === 0}
                    title={shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0 ? "שלח SMS למשובצים" : "אין עובדים משובצים"}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteShift(shift.id);
                    }}
                    title="מחק משמרת"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm" onClick={() => handleOpenFormDialog(shift)}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{shift.start_time} - {shift.end_time}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-purple-600">{getRoleName(shift.required_job_role_id)}</span>
                  <span className="text-gray-500">({shift.required_number_of_employees} נדרשים)</span>
                </div>
                
                {shift.location && (
                  <div className="text-gray-600">📍 {shift.location}</div>
                )}
                
                <div className="flex items-center gap-2 pt-2">
                  {statusIcon}
                  <span className={`font-medium ${
                    shift.status === 'לא מאויש' ? 'text-red-700' : 
                    shift.status === 'מאויש חלקית' ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {employeeInfo}
                  </span>
                </div>
                
                {shift.notes && (
                  <div className="mt-2 p-2 bg-white/50 rounded text-xs text-gray-600">
                    {shift.notes}
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">אין משמרות מתוכננות ליום זה</p>
          </div>
        )}
      </div>
    );
  };

  // Timeline View Component
  const renderTimelineView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 w-32">שעה</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">משמרות</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => {
                const hourShifts = shiftsForSelectedDate.filter(shift => {
                  const startHour = parseInt(shift.start_time.split(':')[0]);
                  const endHour = parseInt(shift.end_time.split(':')[0]);
                  return hour >= startHour && (endHour > startHour ? hour < endHour : (hour < 24 || hour < endHour) );
                });
                
                return (
                  <tr key={hour} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4 font-mono text-gray-600 bg-gray-50">
                      {hour.toString().padStart(2, '0')}:00
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {hourShifts.length > 0 ? hourShifts.map((shift) => {
                          let employeeText;
                          let statusSpecificClass = "";
                          if (shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0) {
                            if (shift.assigned_employee_ids.length === shift.required_number_of_employees) {
                                employeeText = shift.assigned_employee_ids.length === 1 
                                    ? getEmployeeById(shift.assigned_employee_ids[0])?.first_name
                                    : `${shift.assigned_employee_ids.length} עובדים`;
                                statusSpecificClass = "text-green-700";
                            } else {
                                employeeText = `${shift.assigned_employee_ids.length}/${shift.required_number_of_employees}`;
                                statusSpecificClass = "text-yellow-700";
                            }
                          } else {
                            employeeText = "ריק";
                            statusSpecificClass = "text-red-700";
                          }
                          return (
                            <div
                              key={shift.id}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs cursor-pointer transition-all hover:shadow-md ${SHIFT_COLORS[shift.status] || 'bg-gray-100 border-gray-300'}`}
                              onClick={() => handleOpenFormDialog(shift)}
                              title={`${shift.title} (${shift.start_time}-${shift.end_time}) | ${shift.required_number_of_employees} נדרשים`}
                            >
                              <span className="font-medium">{shift.title}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-purple-700">{getRoleName(shift.required_job_role_id)}</span>
                               <span className={`${statusSpecificClass} flex items-center gap-1`}>
                                  {shift.status === "לא מאויש" ? <UserX className="w-3 h-3" /> :
                                   shift.status === "מאויש חלקית" ? <Users className="w-3 h-3" /> :
                                   <UserCheck className="w-3 h-3" />
                                  }
                                  {employeeText}
                                </span>
                            </div>
                          );
                        }) : (
                          <span className="text-gray-400 text-sm">אין משמרות</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case VIEW_TYPES.GRID:
        return renderGridView();
      case VIEW_TYPES.TIMELINE:
        return renderTimelineView();
      case VIEW_TYPES.RIVER:
      default:
        return renderRiverView();
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני משמרות...</p>
        </div>
      </div>
    );
  }

  // If no user or no organization after loading, don't render content
  if (!currentUser || !currentOrganizationId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">מפנה לדף הכניסה או שאין ארגון מוגדר...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">משמרות</h1>
          <p className="text-gray-600 mt-1">
            ניהול וצפייה במשמרות בתצוגות שונות
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50"
            disabled={shiftsForSelectedDate.length === 0}
          >
            <Download className="w-4 h-4 ml-2" />
            ייצוא ל-CSV
          </Button>
          <Button
            onClick={handleExportSchedule}
            variant="outline"
            className="border-purple-600 text-purple-700 hover:bg-purple-50"
            disabled={shiftsForSelectedDate.length === 0}
          >
            <FileText className="w-4 h-4 ml-2" />
            הדפסת לוח
          </Button>
          <Button
            onClick={() => handleOpenFormDialog()}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 ml-2" />
            צור משמרת חדשה
          </Button>
        </div>
      </div>

      {/* View Selector & Date Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-lg shadow border">
        {/* View Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">תצוגה:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentView === VIEW_TYPES.RIVER ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(VIEW_TYPES.RIVER)}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              נהר הזמן
            </Button>
            <Button
              variant={currentView === VIEW_TYPES.GRID ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(VIEW_TYPES.GRID)}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              כרטיסים
            </Button>
            <Button
              variant={currentView === VIEW_TYPES.TIMELINE ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(VIEW_TYPES.TIMELINE)}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              לוח שעות
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(parse(e.target.value, "yyyy-MM-dd", new Date()))}
            className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 max-w-xs text-center"
          />
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <p className="text-center text-xl font-semibold text-gray-700">
        {format(selectedDate, "EEEE, d MMMM yyyy", { locale: he })}
      </p>

      {/* Main Content Area */}
      {renderCurrentView()}

      {/* Shift Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={(isOpen) => {
          setShowFormDialog(isOpen);
          if (!isOpen) setEditingShift(null);
      }}>
        <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingShift ? "עריכת משמרת" : "יצירת משמרת חדשה"}</DialogTitle>
          </DialogHeader>
          <ShiftForm
            shift={editingShift}
            employees={employees}
            jobRoles={Object.values(jobRoles)}
            onSave={handleSaveShift}
            onCancel={() => {
              setShowFormDialog(false);
              setEditingShift(null);
            }}
            defaultDate={!editingShift ? format(selectedDate, "yyyy-MM-dd") : null}
          />
        </DialogContent>
      </Dialog>

      {/* SMS Dialog */}
      {shiftForSms && (
        <ShiftSmsDialog
          shift={shiftForSms}
          isOpen={showSmsDialog}
          onClose={() => {
            setShowSmsDialog(false);
            setShiftForSms(null);
          }}
          allEmployees={employees}
        />
      )}
    </div>
  );
}
