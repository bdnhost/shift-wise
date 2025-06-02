import React, { useState, useEffect } from "react";
import { Shift, Employee } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, Zap, PlusCircle } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import ShiftForm from "../components/shifts/ShiftForm"; // Import ShiftForm

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formDefaultDate, setFormDefaultDate] = useState(null);


  useEffect(() => {
    loadData();
  }, [currentWeek]); // Reload data when week changes

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch shifts for a broader range to avoid missing shifts at week boundaries if needed
      // For now, fetching all and filtering client-side is okay for moderate data
      const [shiftsData, employeesData] = await Promise.all([
        Shift.list("-date"), 
        Employee.list()
      ]);
      setShifts(shiftsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("שגיאה בטעינת נתונים:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getShiftsForDay = (day) => {
    return shifts.filter(shift => {
      try {
        return isSameDay(parseISO(shift.date), day);
      } catch (e) {
        console.warn("Invalid date format for shift:", shift);
        return false;
      }
    }).sort((a, b) => { // Sort shifts by start time within the day
        if (!a.start_time || !b.start_time) return 0;
        return a.start_time.localeCompare(b.start_time);
    });
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name.charAt(0)}.` : "לא משויך";
  };
  
  const handleOpenShiftForm = (shift = null, date = null) => {
    setEditingShift(shift);
    setFormDefaultDate(date ? format(date, "yyyy-MM-dd") : null);
    setShowShiftForm(true);
  };

  const handleCloseShiftForm = () => {
    setShowShiftForm(false);
    setEditingShift(null);
    setFormDefaultDate(null);
  };

  const handleSaveShift = async (shiftData) => {
    try {
      if (editingShift) {
        await Shift.update(editingShift.id, shiftData);
      } else {
        await Shift.create(shiftData);
      }
      handleCloseShiftForm();
      loadData(); // Refresh data
    } catch (error) {
      console.error("שגיאה בשמירת משמרת:", error);
      alert("שגיאה בשמירת המשמרת.");
    }
  };

  const statusColors = {
    "לא מאויש": "bg-red-100 text-red-800 border-red-300",
    "מאויש": "bg-green-100 text-green-800 border-green-300",
    "ממתין לאישור": "bg-yellow-100 text-yellow-800 border-yellow-300"
  };
  
  const roleColors = {
    "מנהל": "bg-purple-500",
    "קופאי": "bg-blue-500",
    "מלצר": "bg-emerald-500",
    "טבח": "bg-orange-500",
    "ניקיון": "bg-cyan-500",
    "אחר": "bg-slate-500"
  };


  if (isLoading && shifts.length === 0 && employees.length === 0) { // Show skeleton only on initial load
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-gray-100 to-indigo-50 min-h-screen">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 w-32 bg-gray-300 rounded"></div>
            <div className="h-10 w-48 bg-gray-300 rounded"></div>
            <div className="h-10 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg p-3 min-h-[300px]">
                <div className="h-6 w-20 bg-gray-300 rounded mb-3 mx-auto"></div>
                <div className="space-y-2">
                  <div className="h-16 bg-gray-300 rounded"></div>
                  <div className="h-16 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-100 to-indigo-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">🏗️ מגדל המשמרות</h1>
          <p className="text-gray-500 mt-1">תצוגה שבועית של המשמרות והשיבוצים</p>
        </div>
         <Button
            onClick={() => handleOpenShiftForm(null, currentWeek)} // Open form for new shift, defaults to current week start
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          >
            <PlusCircle className="w-5 h-5 ml-2" />
            הוסף משמרת
          </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          className="hover:bg-gray-50"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="hidden md:inline mr-2">שבוע קודם</span>
        </Button>
        
        <h2 className="text-xl md:text-2xl font-semibold text-indigo-700 text-center">
          {format(weekStart, 'd MMM', { locale: he })} - {format(weekEnd, 'd MMM yyyy', { locale: he })}
        </h2>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="hover:bg-gray-50"
        >
          <span className="hidden md:inline ml-2">שבוע הבא</span>
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Shift Towers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          return (
            <div key={day.toString()} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-3 border border-gray-200 min-h-[300px] flex flex-col">
              <div className="text-center font-bold text-lg text-gray-700 mb-3 pb-2 border-b border-gray-200">
                {format(day, 'EEEE', { locale: he })}
                <div className="text-sm text-gray-500 font-normal">
                  {format(day, 'd/M', { locale: he })}
                </div>
              </div>
              <div className="space-y-2 flex-grow">
                {dayShifts.length === 0 ? (
                  <div className="text-center text-gray-400 pt-10">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">אין משמרות</p>
                  </div>
                ) : (
                  dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => handleOpenShiftForm(shift)}
                      className={`p-2.5 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-shadow relative border-l-4 ${statusColors[shift.status] || 'bg-gray-100 border-gray-300'}`}
                    >
                       <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${roleColors[shift.required_role] || 'bg-gray-400'}`} title={shift.required_role}></div>
                      <h4 className="font-semibold text-sm text-gray-800 truncate pr-4">{shift.title}</h4>
                      <p className="text-xs text-gray-600">{shift.start_time} - {shift.end_time}</p>
                      <p className="text-xs text-gray-500 truncate">
                         <Users className="w-3 h-3 inline-block mr-1" /> 
                         {getEmployeeName(shift.assigned_employee_id)}
                      </p>
                       {shift.status === "לא מאויש" && (
                        <div className="absolute bottom-1 left-1">
                           <Zap className="w-3.5 h-3.5 text-red-500 animate-pulse" title="משמרת לא מאוישת"/>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
               <Button variant="ghost" size="sm" className="w-full mt-3 text-indigo-600 hover:bg-indigo-50" onClick={() => handleOpenShiftForm(null, day)}>
                <PlusCircle className="w-4 h-4 ml-1" /> הוסף למגדל
              </Button>
            </div>
          );
        })}
      </div>
      
      {showShiftForm && (
        <ShiftForm
          shift={editingShift}
          employees={employees}
          onSave={handleSaveShift}
          onCancel={handleCloseShiftForm}
          defaultDate={formDefaultDate || (editingShift ? editingShift.date : format(weekStart, "yyyy-MM-dd"))}
        />
      )}
    </div>
  );
}