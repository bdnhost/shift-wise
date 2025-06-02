
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Trash2, User, Mail, Phone, Clock, Calendar, Award, TrendingUp, UserCog } from "lucide-react";
import { motion } from "framer-motion";
import { JobRole } from "@/api/entities";
import { Shift } from "@/api/entities"; // Added Shift import
import { EmployeeConstraint } from "@/api/entities";
import EmployeeConstraintsForm from "./EmployeeConstraintsForm";
import { format, parseISO, isFuture, isPast } from 'date-fns'; // Added isFuture, isPast
import { he } from 'date-fns/locale';

const roleColors = {
  "מנהל": "bg-purple-100 text-purple-700 border-purple-200",
  "קופאי": "bg-blue-100 text-blue-700 border-blue-200",
  "מלצר": "bg-green-100 text-green-700 border-green-200",
  "טבח": "bg-orange-100 text-orange-700 border-orange-200",
  "ניקיון": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "אחר": "bg-gray-100 text-gray-700 border-gray-200"
};

const statusColors = {
  "פעיל": "bg-green-100 text-green-700 border-green-200",
  "לא פעיל": "bg-red-100 text-red-700 border-red-200",
  "חופש": "bg-yellow-100 text-yellow-700 border-yellow-200"
};

export default function EmployeeProfile({ employee, onClose, onEdit, onDelete }) {
  const [jobRoles, setJobRoles] = useState({});
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [constraints, setConstraints] = useState([]);
  const [isLoadingConstraints, setIsLoadingConstraints] = useState(true);
  const [employeeShifts, setEmployeeShifts] = useState([]); // New state for shifts
  const [isLoadingShifts, setIsLoadingShifts] = useState(true); // New loading state

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingRoles(true);
      setIsLoadingConstraints(true);
      setIsLoadingShifts(true); // Added
      try {
        const roles = await JobRole.list();
        const rolesMap = {};
        roles.forEach(role => {
          rolesMap[role.id] = role;
        });
        setJobRoles(rolesMap);

        if (employee && employee.id) {
            const [employeeConstraints, shifts] = await Promise.all([
                EmployeeConstraint.filter({ employee_id: employee.id }),
                Shift.filter({ assigned_employee_id: employee.id }) // Fetch shifts assigned to this employee
            ]);
            setConstraints(employeeConstraints);
            // Sort shifts by date, with future shifts first
            const sortedShifts = shifts.sort((a, b) => {
                const dateA = parseISO(a.date);
                const dateB = parseISO(b.date);
                // Sort future shifts first, then past shifts, both chronologically
                if (isFuture(dateA) && !isFuture(dateB)) return -1;
                if (!isFuture(dateA) && isFuture(dateB)) return 1;
                return dateA.getTime() - dateB.getTime();
            });
            setEmployeeShifts(sortedShifts);
        }

      } catch (error) {
        console.error("Error fetching data for employee profile:", error);
      } finally {
        setIsLoadingRoles(false);
        setIsLoadingConstraints(false);
        setIsLoadingShifts(false); // Added
      }
    };
    fetchData();
  }, [employee]);

  const getPrimaryRoleName = () => {
    if (!employee || !employee.primary_job_role_id || isLoadingRoles) return "טוען...";
    const role = jobRoles[employee.primary_job_role_id];
    return role ? role.name : "לא הוגדר";
  };
  
  const handleConstraintsUpdated = (updatedConstraints) => {
    setConstraints(updatedConstraints);
  };

  // Helper function to get shift status color
  const getShiftStatusColor = (shift) => {
    const shiftDate = parseISO(shift.date);
    if (isPast(shiftDate)) {
      return "bg-gray-100 text-gray-600 border-gray-200"; // Past shifts
    } else if (isFuture(shiftDate)) {
      return shift.status === "מאויש" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"; // Future shifts
    }
    return "bg-green-100 text-green-700 border-green-200"; // Today (roughly) or other active
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" // Changed max-w-2xl to max-w-4xl for more space
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl text-white relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 left-4 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4 mt-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{employee.first_name} {employee.last_name}</h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge className={`${roleColors[getPrimaryRoleName()] || roleColors['אחר']} border`}>
                  {getPrimaryRoleName()}
                </Badge>
                <Badge className={`${statusColors[employee.status]} border`}>
                  {employee.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6"> {/* Changed to grid layout for better space utilization */}
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    פרטי התקשרות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{employee.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    פרטי עבודה
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">תפקיד ראשי</div>
                      <div className="font-semibold text-gray-900">{getPrimaryRoleName()}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">סטטוס</div>
                      <div className={`font-semibold ${
                        employee.status === 'פעיל' ? 'text-green-600' :
                        employee.status === 'לא פעיל' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {employee.status}
                      </div>
                    </div>
                  </div>
                  
                  {employee.hourly_rate && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">שכר לשעה</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">₪{employee.hourly_rate}</div>
                    </div>
                  )}
                  {employee.hire_date && (
                    <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-green-600"/>
                            <span className="text-sm text-green-600">תאריך תחילת עבודה</span>
                        </div>
                        <div className="font-semibold text-green-700">{format(parseISO(employee.hire_date), 'd MMMM yyyy', { locale: he })}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employee Constraints Section */}
              {employee && employee.id && (
                 <EmployeeConstraintsForm 
                    employeeId={employee.id} 
                    existingConstraints={constraints}
                    onConstraintsUpdate={handleConstraintsUpdated} 
                 />
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Employee Shifts Section - NEW */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    משמרות משויכות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingShifts ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">טוען משמרות...</p>
                    </div>
                  ) : employeeShifts.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">לא משויך למשמרות כרגע</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {employeeShifts.map((shift) => (
                        <div key={shift.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{shift.title}</h4>
                            <Badge className={`${getShiftStatusColor(shift)} border text-xs`}>
                              {shift.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(parseISO(shift.date), 'EEEE, d MMMM yyyy', { locale: he })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{shift.start_time} - {shift.end_time}</span>
                            </div>
                            {shift.location && (
                              <div className="text-xs text-gray-500">
                                📍 {shift.location}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    סטטיסטיקות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {new Date(employee.created_date).toLocaleDateString('he-IL')}
                      </div>
                      <div className="text-sm text-gray-600">תאריך הצטרפות</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{employeeShifts.length}</div>
                      <div className="text-sm text-gray-600">סה"כ משמרות</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-700">
                        {employeeShifts.filter(s => isFuture(parseISO(s.date))).length}
                      </div>
                      <div className="text-xs text-blue-600">משמרות עתידיות</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-700">
                        {employeeShifts.filter(s => isPast(parseISO(s.date)) && s.status === "מאויש").length}
                      </div>
                      <div className="text-xs text-green-600">משמרות שהושלמו</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onEdit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserCog className="w-4 h-4 ml-2" />
              ערוך פרטי עובד
            </Button>
            <Button
              onClick={onDelete}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחק עובד
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
