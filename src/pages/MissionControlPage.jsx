
import React, { useState, useEffect, useMemo } from 'react';
import { Shift, Employee, JobRole, Organization } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, AlertTriangle, CheckCircle, XCircle, CalendarDays, Zap, RefreshCw, Settings, AlignJustify, Edit2, Eye, Download } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval, addHours, subHours, isAfter, isBefore, isEqual, eachWeekOfInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ShiftForm from "../components/shifts/ShiftForm";
import ScheduleExportDialog from '../components/mission_control/ScheduleExportDialog';

// --- HTML Generation Logic for Printing ---

const getEmployeeNameForPrint = (empId, employees) => {
  const emp = employees.find(e => e.id === empId);
  return emp ? `${emp.first_name} ${emp.last_name}` : 'לא משויך';
};

const getRoleNameForPrint = (roleId, jobRolesList) => {
  const role = jobRolesList.find(r => r.id === roleId);
  return role ? role.name : 'תפקיד לא ידוע';
};

const generateScheduleHtmlForPrint = (shifts, employees, jobRolesArray, organizationName, rangeType, startDate, endDate) => {
  let htmlContent = `
    <html>
      <head>
        <title>לוח משמרות - ${organizationName || 'ShiftWise'}</title>
        <meta charset="UTF-8">
        <style>
          body { direction: rtl; font-family: 'Arial', sans-serif; margin: 20px; font-size: 10pt; }
          .print-container { width: 100%; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          .header h1 { font-size: 18pt; margin: 0; color: #333; }
          .header h2 { font-size: 12pt; margin: 5px 0; color: #555; }
          .day-section { margin-bottom: 25px; padding: 10px; border: 1px solid #eee; border-radius: 5px; background-color: #fdfdfd; }
          .day-header { font-size: 14pt; font-weight: bold; color: #444; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px dashed #ddd;}
          .shift-card { border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 8px; background-color: #fff; page-break-inside: avoid; }
          .shift-card h4 { font-size: 11pt; margin: 0 0 5px 0; color: #0056b3; }
          .shift-card p { margin: 3px 0; font-size: 9pt; color: #333; }
          .shift-card .details { color: #555; }
          .shift-card .assigned { font-weight: bold; }
          .shift-card .unassigned { color: #d9534f; font-style: italic; }
          .shift-card .partially-assigned { color: #f0ad4e; }
          .no-shifts { text-align: center; color: #777; font-size: 11pt; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
          th { background-color: #f2f2f2; font-size: 10pt; }
          /* Print-specific styles */
          @media print {
            body { margin: 10mm; font-size: 9pt; }
            .print-container { margin: 0; padding: 0; border: none; box-shadow: none; }
            .day-section { border: none; padding: 5px 0; margin-bottom: 15px; }
            .shift-card { box-shadow: none; border: 1px solid #ccc; }
            button, .no-print { display: none !important; } /* Hide buttons in print */
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>לוח משמרות - ${organizationName || 'ShiftWise'}</h1>
  `;

  let dateRangeString = '';
  if (rangeType === 'day') {
    dateRangeString = format(startDate, 'EEEE, d MMMM yyyy', { locale: he });
  } else {
    dateRangeString = `${format(startDate, 'd MMM', { locale: he })} - ${format(endDate, 'd MMM yyyy', { locale: he })}`;
  }
  htmlContent += `<h2>טווח: ${dateRangeString}</h2></div>`;

  const relevantShifts = shifts.filter(s => {
    try {
      const shiftDate = parseISO(s.date);
      // Ensure the shift is within the interval, including the end date
      return isAfter(shiftDate, startDate) || isEqual(shiftDate, startDate) &&
             isBefore(shiftDate, endDate) || isEqual(shiftDate, endDate);
    } catch { return false; }
  }).sort((a, b) => {
    const dateComp = parseISO(a.date).getTime() - parseISO(b.date).getTime();
    if (dateComp !== 0) return dateComp;
    return (a.start_time || "").localeCompare(b.start_time || "");
  });

  if (relevantShifts.length === 0) {
    htmlContent += '<p class="no-shifts">אין משמרות בטווח התאריכים שנבחר.</p>';
  } else {
    if (rangeType === 'day') {
      htmlContent += `<div class="day-section">`;
      // For single day, we still want to show the day header
      htmlContent += `<div class="day-header">${format(startDate, 'EEEE, d MMMM yyyy', { locale: he })}</div>`;
      relevantShifts.forEach(shift => {
        const assignedNames = shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0
          ? shift.assigned_employee_ids.map(id => getEmployeeNameForPrint(id, employees)).join(', ')
          : 'לא מאויש';
        const statusClass = shift.assigned_employee_ids?.length === 0 ? 'unassigned' : 
                            shift.assigned_employee_ids?.length < shift.required_number_of_employees ? 'partially-assigned' : 'assigned';

        htmlContent += `
          <div class="shift-card">
            <h4>${shift.title || 'N/A'}</h4>
            <p class="details">זמן: ${shift.start_time || 'N/A'} - ${shift.end_time || 'N/A'}</p>
            <p class="details">תפקיד: ${getRoleNameForPrint(shift.required_job_role_id, jobRolesArray)} (${shift.required_number_of_employees || 1})</p>
            <p class="details ${statusClass}">משובצים: ${assignedNames}</p>
            ${shift.location ? `<p class="details">מיקום: ${shift.location}</p>` : ''}
            ${shift.notes ? `<p class="details">הערות: ${shift.notes}</p>` : ''}
          </div>
        `;
      });
      htmlContent += `</div>`;
    } else if (rangeType === 'week' || rangeType === 'month') {
      const daysInInterval = eachDayOfInterval({ start: startDate, end: endDate });
      daysInInterval.forEach(day => {
        htmlContent += `
          <div class="day-section">
            <div class="day-header">${format(day, 'EEEE, d MMMM yyyy', { locale: he })}</div>
        `;
        const shiftsForDay = relevantShifts.filter(s => isSameDay(parseISO(s.date), day));
        if (shiftsForDay.length > 0) {
          shiftsForDay.forEach(shift => {
            const assignedNames = shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0
              ? shift.assigned_employee_ids.map(id => getEmployeeNameForPrint(id, employees)).join(', ')
              : 'לא מאויש';
            const statusClass = shift.assigned_employee_ids?.length === 0 ? 'unassigned' : 
                                shift.assigned_employee_ids?.length < shift.required_number_of_employees ? 'partially-assigned' : 'assigned';
            htmlContent += `
              <div class="shift-card">
                <h4>${shift.title || 'N/A'}</h4>
                <p class="details">זמן: ${shift.start_time || 'N/A'} - ${shift.end_time || 'N/A'}</p>
                <p class="details">תפקיד: ${getRoleNameForPrint(shift.required_job_role_id, jobRolesArray)} (${shift.required_number_of_employees || 1})</p>
                <p class="details ${statusClass}">משובצים: ${assignedNames}</p>
                ${shift.location ? `<p class="details">מיקום: ${shift.location}</p>` : ''}
                ${shift.notes ? `<p class="details">הערות: ${shift.notes}</p>` : ''}
              </div>
            `;
          });
        } else {
          htmlContent += '<p class="no-shifts">אין משמרות ליום זה.</p>';
        }
        htmlContent += `</div>`; // Close day-section
      });
    }
  }

  htmlContent += `
        </div>
        <script>
          // Optional: Add a print button if the direct print doesn't work well,
          // or if you want to give the user a chance before printing.
          // setTimeout(() => { window.print(); /* window.close(); */ }, 500); // Auto print
        </script>
      </body>
    </html>
  `;
  return htmlContent;
};

// --- End of HTML Generation Logic ---

// Basic styling inspired by the NASA example
const missionControlStyles = {
  pageContainer: `min-h-screen bg-gradient-to-br from-[#0d1a2d] to-[#000000] text-[#00ff41] p-4 font-mono`,
  header: `grid-column-full text-center bg-gradient-to-r from-[#001122] via-[#002244] to-[#001122] border-2 border-[#00ff41] rounded-lg p-4 mb-4 shadow-[0_0_20px_#00ff41] relative`, // Added relative for absolute positioning of buttons
  panel: `bg-[#0d1f2d]/80 border border-[#00ccaa] rounded-lg p-4 shadow-lg backdrop-blur-sm`,
  panelTitle: `text-[#00ccaa] text-lg font-bold mb-3 text-center uppercase border-b border-[#00ccaa] pb-2`,
  metricBox: `bg-black/50 border border-[#00ff41] rounded-md p-3 text-center`,
  metricValue: `text-2xl font-bold text-[#00ff41]`,
  metricLabel: `text-xs text-gray-400 uppercase`,
  shiftCard: `bg-gradient-to-br from-[#003366] to-[#0055aa] border border-[#00aaff] rounded-md p-2 mb-2 text-xs hover:shadow-[0_0_10px_#00aaff] transition-shadow cursor-pointer`, // Added cursor-pointer
  shiftCardActive: `bg-gradient-to-br from-[#006600] to-[#00aa00] border-[#00ff00] shadow-[0_0_8px_#00ff00]`,
  shiftCardWarning: `bg-gradient-to-br from-[#cc6600] to-[#ff9900] border-[#ffaa00] animate-pulse`,
  shiftCardCriticalUnassigned: `bg-gradient-to-br from-[#cc0000] to-[#ff3300] border-[#ff0000] animate-pulse-fast shadow-[0_0_10px_#ff0000]`, // New style
};

// Helper to get current time HH:MM
const getCurrentTime = () => format(new Date(), 'HH:mm');

export default function MissionControlPage() { // ודא שה-export default כאן
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [jobRoles, setJobRoles] = useState({}); // This will be a map {id: role_obj}
  const [organization, setOrganization] = useState(null); // Keep the org object
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const weekDays = useMemo(() => eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }) }), [currentWeekStart]);

  const [showShiftFormDialog, setShowShiftFormDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const orgDataList = await Organization.list();
      let currentOrg = null;
      if (orgDataList.length > 0) {
        currentOrg = orgDataList[0]; 
        setOrganization(currentOrg);
        setOrganizationName(currentOrg.name || "הארגון שלי");
      } else {
        setOrganization(null);
        setOrganizationName("הארגון שלי");
        console.warn("No organization found for Mission Control.");
        setShifts([]);
        setEmployees([]);
        setJobRoles({});
        setIsLoading(false);
        return;
      }

      const orgId = currentOrg.id;

      const [shiftsData, employeesData, jobRolesData] = await Promise.all([
        Shift.filter({ organization_id: orgId }, '-date'),
        Employee.filter({ organization_id: orgId }),
        JobRole.filter({ organization_id: orgId })
      ]);

      setShifts(shiftsData);
      setEmployees(employeesData);
      
      const rolesMap = {};
      jobRolesData.forEach(role => { rolesMap[role.id] = role; });
      setJobRoles(rolesMap);
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching mission control data:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(getCurrentTime()), 60000);
    const refreshInterval = setInterval(() => fetchData(false), 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
    };
  }, []);

  const handleOpenShiftFormDialog = (shiftToEdit = null) => {
    setEditingShift(shiftToEdit);
    setShowShiftFormDialog(true);
  };

  const handleSaveShift = async (shiftData) => {
    try {
      const dataToSave = { ...shiftData, organization_id: organization?.id };
      if (editingShift) {
        await Shift.update(editingShift.id, dataToSave);
      } else {
        const dateToSave = shiftData.date || format(new Date(), "yyyy-MM-dd");
        await Shift.create({ ...dataToSave, date: dateToSave });
      }
      setShowShiftFormDialog(false);
      setEditingShift(null);
      fetchData(false);
    } catch (error) {
      console.error("שגיאה בשמירת משמרת:", error);
      alert("שגיאה בשמירת המשמרת.");
    }
  };
  
  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.first_name} ${emp.last_name.charAt(0)}.` : 'N/A';
  };
  
  const getRoleName = (roleId) => jobRoles[roleId]?.name || 'N/A';

  const shiftsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach(day => {
      grouped[format(day, 'yyyy-MM-dd')] = shifts
        .filter(s => isSameDay(parseISO(s.date), day))
        .sort((a,b) => (a.start_time || "").localeCompare(b.start_time || ""));
    });
    return grouped;
  }, [shifts, weekDays]);

  const now = new Date();
  const activeShiftsNow = shifts.filter(shift => {
    try {
      const shiftStartDateTime = parseISO(`${shift.date}T${shift.start_time}`);
      const shiftEndDateTime = parseISO(`${shift.date}T${shift.end_time}`);
      const effectiveEndDateTime = isBefore(shiftEndDateTime, shiftStartDateTime) ? addHours(shiftEndDateTime, 24) : shiftEndDateTime;
      return isWithinInterval(now, { start: shiftStartDateTime, end: effectiveEndDateTime }) && shift.status === "מאויש";
    } catch { return false; }
  });

  const employeesOnDutyCount = activeShiftsNow.reduce((acc, shift) => acc + (shift.assigned_employee_ids?.length || 0), 0);
  
  const todayShifts = shifts.filter(s => isSameDay(parseISO(s.date), now));
  const unassignedShiftsToday = todayShifts.filter(s => s.status === "לא מאויש").length;
  const partiallyAssignedShiftsToday = todayShifts.filter(s => s.status === "מאויש חלקית").length;
  const criticalUnassignedToday = todayShifts.filter(s => s.difficulty_level === "קריטי" && s.status === "לא מאויש").length;
  
  const criticalAlertsCount = unassignedShiftsToday + partiallyAssignedShiftsToday + criticalUnassignedToday;

  const getShiftCardStyle = (shift) => {
    let style = missionControlStyles.shiftCard;
    try {
      const shiftStartDateTime = parseISO(`${shift.date}T${shift.start_time}`);
      const shiftEndDateTime = parseISO(`${shift.date}T${shift.end_time}`);
      const effectiveEndDateTime = isBefore(shiftEndDateTime, shiftStartDateTime) ? addHours(shiftEndDateTime, 24) : shiftEndDateTime;

      if (isWithinInterval(now, { start: shiftStartDateTime, end: effectiveEndDateTime })) {
        if (shift.status === "מאויש") style += ` ${missionControlStyles.shiftCardActive}`;
        else if (shift.status === "לא מאויש" || shift.status === "מאויש חלקית") style += ` ${missionControlStyles.shiftCardWarning}`;
      }
      if (shift.difficulty_level === "קריטי" && shift.status === "לא מאויש") {
         style += ` ${missionControlStyles.shiftCardCriticalUnassigned}`;
      }
    } catch {}
    return style;
  };

  const getDifficultyEmoji = (level) => {
    if (level === "קריטי") return "🔥";
    if (level === "מאתגר") return "⚠️";
    return "";
  }

  const handleExportRequested = (rangeType, startDate, endDate) => {
    console.log(`Exporting HTML for print: ${rangeType} from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    const jobRolesArray = Object.values(jobRoles); // Assuming jobRoles is a map {id: role}
    
    const htmlString = generateScheduleHtmlForPrint(shifts, employees, jobRolesArray, organizationName, rangeType, startDate, endDate);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlString);
      printWindow.document.close();
      // Give the browser a moment to render before printing
      setTimeout(() => {
        try {
          printWindow.focus(); // For FireFox
          printWindow.print();
          // printWindow.close(); // Optional: close after print dialog
        } catch (e) {
          console.error("Error trying to print:", e);
          alert("שגיאה בפתיחת חלון ההדפסה. ייתכן שחוסם הפופאפים מונע זאת.");
        }
      }, 500);
    } else {
      alert("לא ניתן לפתוח חלון חדש להדפסה. אנא בדוק אם חוסם הפופאפים פעיל.");
    }
  };

  if (isLoading && shifts.length === 0) {
    return (
      <div className={missionControlStyles.pageContainer}>
        <div className={missionControlStyles.header}>
          <h1 className="text-3xl font-bold">טוען מרכז בקרה...</h1>
        </div>
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00ff41]"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={missionControlStyles.pageContainer}>
      <header className={missionControlStyles.header}>
        <h1 className="text-3xl font-bold mb-1">🚀 SHIFT MISSION CONTROL</h1>
        <div className="text-lg text-[#ffaa00]">
          {format(now, 'EEEE, d MMMM yyyy', { locale: he })} | {currentTime} (מקומי)
        </div>
        <div className="text-xs text-gray-400 mt-1">
          מקור נתונים: {organization?.name || 'לא הוגדר ארגון'} | רענון אחרון: {format(lastRefreshed, 'HH:mm:ss')}
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <Button 
            onClick={() => setShowExportDialog(true)} 
            variant="outline" 
            className="border-sky-500 text-sky-400 hover:bg-sky-500/20"
            title="ייצא לוח זמנים"
            disabled={!organization || shifts.length === 0}
          >
            <Download className="w-4 h-4 mr-2" /> ייצוא להדפסה
          </Button>
          <Button onClick={() => fetchData(true)} variant="outline" className="border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20">
            <RefreshCw className="w-4 h-4 mr-2"/> רענון
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <aside className={`lg:col-span-1 space-y-4 ${missionControlStyles.panel}`}>
          <h2 className={missionControlStyles.panelTitle}>נתוני משימה</h2>
          <div className={missionControlStyles.metricBox}>
            <div className={missionControlStyles.metricValue}>{employeesOnDutyCount}</div>
            <div className={missionControlStyles.metricLabel}>עובדים במשמרת פעילה</div>
          </div>
          <div className={missionControlStyles.metricBox}>
            <div className={missionControlStyles.metricValue}>{unassignedShiftsToday}</div>
            <div className={missionControlStyles.metricLabel}>משמרות לא מאוישות (היום)</div>
          </div>
           <div className={missionControlStyles.metricBox}>
            <div className={missionControlStyles.metricValue}>{partiallyAssignedShiftsToday}</div>
            <div className={missionControlStyles.metricLabel}>מאוישות חלקית (היום)</div>
          </div>
          <div className={`${missionControlStyles.metricBox} ${criticalUnassignedToday > 0 ? 'border-red-500' : ''}`}>
            <div className={`${missionControlStyles.metricValue} ${criticalUnassignedToday > 0 ? 'text-red-400' : ''}`}>{criticalUnassignedToday}</div>
            <div className={missionControlStyles.metricLabel}>משמרות קריטיות לא מאוישות (היום)</div>
          </div>
          
          <h2 className={`${missionControlStyles.panelTitle} mt-4`}>התראות מערכת</h2>
          {criticalAlertsCount > 0 ? (
            <div className="bg-red-900/50 border border-red-500 rounded p-3 text-red-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{criticalAlertsCount} התראות קריטיות דורשות טיפול!</span>
              </div>
              {unassignedShiftsToday > 0 && <p className="text-xs mt-1">- {unassignedShiftsToday} משמרות לא מאוישות היום.</p>}
              {partiallyAssignedShiftsToday > 0 && <p className="text-xs mt-1">- {partiallyAssignedShiftsToday} משמרות מאוישות חלקית היום.</p>}
              {criticalUnassignedToday > 0 && <p className="text-xs mt-1 text-red-200">- {criticalUnassignedToday} משמרות קריטיות לא מאוישות היום!</p>}
            </div>
          ) : (
            <div className="bg-green-900/50 border border-green-500 rounded p-3 text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>המערכת יציבה, אין התראות קריטיות.</span>
              </div>
            </div>
          )}
           <Button onClick={() => fetchData(true)} variant="outline" className="w-full mt-4 border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20">
            <RefreshCw className="w-4 h-4 mr-2"/> רענן נתונים
          </Button>
        </aside>

        <main className={`lg:col-span-3 ${missionControlStyles.panel}`}>
          <h2 className={missionControlStyles.panelTitle}>לוח שידורים שבועי - בקרה חיה</h2>
           <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day.toISOString()} className="bg-black/30 border border-[#0077aa] rounded-md p-1.5 min-h-[200px] flex flex-col">
                <h3 className="text-center text-[#00aaff] font-bold text-sm mb-2 border-b border-[#0077aa] pb-1">
                  {format(day, 'EEE', { locale: he })}
                  <span className="block text-xs">{format(day, 'd/M')}</span>
                </h3>
                <div className="space-y-1 flex-grow overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                  {isLoading && shiftsByDay[format(day, 'yyyy-MM-dd')] === undefined ? (
                     <p className="text-xs text-gray-500 text-center pt-4">טוען...</p>
                  ) : shiftsByDay[format(day, 'yyyy-MM-dd')]?.length > 0 ? (
                    shiftsByDay[format(day, 'yyyy-MM-dd')].map(shift => (
                      <div 
                        key={shift.id} 
                        className={getShiftCardStyle(shift)}
                        onClick={() => handleOpenShiftFormDialog(shift)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-semibold truncate text-white">{getDifficultyEmoji(shift.difficulty_level)} {shift.title}</p>
                          {shift.status === "לא מאויש" && <XCircle className="w-3 h-3 text-red-300" />}
                          {shift.status === "מאויש חלקית" && <AlertTriangle className="w-3 h-3 text-yellow-300" />}
                          {shift.status === "מאויש" && <CheckCircle className="w-3 h-3 text-green-300" />}
                        </div>
                        <p className="truncate">{shift.start_time} - {shift.end_time}</p>
                        <p className="truncate text-sky-300">{getRoleName(shift.required_job_role_id)} ({shift.required_number_of_employees})</p>
                        {shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0 ? (
                           shift.assigned_employee_ids.map(empId => (
                            <p key={empId} className="truncate text-xs text-green-300">👨‍🚀 {getEmployeeName(empId)}</p>
                           ))
                        ) : (
                          <p className="truncate text-xs text-red-400">⚠️ לא מאויש</p>
                        )}
                        {shift.status === "מאויש חלקית" && <p className="text-xs text-yellow-300">⚠️ ({shift.assigned_employee_ids?.length || 0}/{shift.required_number_of_employees})</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center pt-4">אין משמרות</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <Dialog open={showShiftFormDialog} onOpenChange={(isOpen) => {
          setShowShiftFormDialog(isOpen);
          if (!isOpen) setEditingShift(null);
      }}>
        <DialogContent className="sm:max-w-[650px] text-black bg-gray-50 overflow-y-auto max-h-[90vh] font-sans" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">{editingShift ? "עריכת משמרת" : "יצירת משמרת חדשה"}</DialogTitle>
          </DialogHeader>
          <ShiftForm
            shift={editingShift}
            employees={employees} 
            jobRoles={Object.values(jobRoles)} 
            onSave={handleSaveShift}
            onCancel={() => {
              setShowShiftFormDialog(false);
              setEditingShift(null);
            }}
            defaultDate={!editingShift ? format(currentWeekStart, "yyyy-MM-dd") : null} 
            currentOrganizationId={organization?.id} 
          />
        </DialogContent>
      </Dialog>

      <ScheduleExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExportRequested}
      />
    </div>
  );
}
