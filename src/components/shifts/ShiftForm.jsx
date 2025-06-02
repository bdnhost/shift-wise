
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, AlertTriangle, User, Plus, Minus } from "lucide-react";
import { format, parseISO, isWithinInterval, getDay, isEqual } from "date-fns";
import { JobRole } from "@/api/entities";
import { EmployeeConstraint } from "@/api/entities";
import { SmsAutomation } from "@/api/entities"; // Import SmsAutomation
import { sendSms as sendSmsFunction } from "@/api/functions"; // Import sendSms function and rename it to avoid conflict

export default function ShiftForm({ shift, employees, onSave, onCancel, defaultDate }) {
  const [formData, setFormData] = useState({
    title: "",
    date: defaultDate || format(new Date(), "yyyy-MM-dd"),
    start_time: "",
    end_time: "",
    required_job_role_id: "",
    assigned_employee_ids: [],
    required_number_of_employees: 1,
    location: "",
    notes: "",
    status: "לא מאויש",
    difficulty_level: "בינוני" 
  });

  const [allJobRoles, setAllJobRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeConstraints, setEmployeeConstraints] = useState({});
  const [constraintWarnings, setConstraintWarnings] = useState({});
  const [shiftAssignedAutomation, setShiftAssignedAutomation] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const roles = await JobRole.list();
        setAllJobRoles(roles);

        const automations = await SmsAutomation.filter({ event_type: 'SHIFT_ASSIGNED_NEW', is_active: true });
        if (automations.length > 0) {
          setShiftAssignedAutomation(automations[0]);
        }
      } catch (error) {
        console.error("Error fetching initial data for ShiftForm:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (shift) {
      setFormData({
        title: shift.title || "",
        date: shift.date || defaultDate || format(new Date(), "yyyy-MM-dd"),
        start_time: shift.start_time || "",
        end_time: shift.end_time || "",
        required_job_role_id: shift.required_job_role_id || "",
        assigned_employee_ids: Array.isArray(shift.assigned_employee_ids) ? shift.assigned_employee_ids : [],
        required_number_of_employees: shift.required_number_of_employees || 1,
        location: shift.location || "",
        notes: shift.notes || "",
        status: shift.status || "לא מאויש",
        difficulty_level: shift.difficulty_level || "בינוני"
      });
    } else {
      setFormData(prev => ({
        ...prev,
        title: "",
        date: defaultDate || format(new Date(), "yyyy-MM-dd"),
        start_time: "",
        end_time: "",
        required_job_role_id: "",
        assigned_employee_ids: [],
        required_number_of_employees: 1,
        location: "",
        notes: "",
        status: "לא מאויש",
        difficulty_level: "בינוני"
      }));
    }
  }, [shift, defaultDate]);

  // Fetch constraints for all assigned employees
  useEffect(() => {
    const fetchEmployeeConstraints = async () => {
      if (formData.assigned_employee_ids.length > 0) {
        try {
          const constraintsMap = {};
          await Promise.all(
            formData.assigned_employee_ids.map(async (employeeId) => {
              const constraints = await EmployeeConstraint.filter({ 
                employee_id: employeeId, 
                is_active: true 
              });
              constraintsMap[employeeId] = constraints;
            })
          );
          setEmployeeConstraints(constraintsMap);
        } catch (error) {
          console.error("Error fetching employee constraints:", error);
          setEmployeeConstraints({});
        }
      } else {
        setEmployeeConstraints({});
      }
    };
    fetchEmployeeConstraints();
  }, [formData.assigned_employee_ids]);

  // Check for conflicts when constraints or shift details change
  useEffect(() => {
    checkShiftConflicts();
  }, [employeeConstraints, formData.date, formData.start_time, formData.end_time]);

  const checkShiftConflicts = () => {
    const warnings = {};
    
    if (!formData.date || Object.keys(employeeConstraints).length === 0) {
      setConstraintWarnings({});
      return;
    }

    const shiftDate = parseISO(formData.date);

    Object.entries(employeeConstraints).forEach(([employeeId, constraints]) => {
      for (const constraint of constraints) {
        if (constraint.constraint_type === 'UNAVAILABLE_DATE_SPECIFIC') {
          const constraintStartDate = parseISO(constraint.start_date);
          const constraintEndDate = constraint.end_date ? parseISO(constraint.end_date) : constraintStartDate;
          
          if (isWithinInterval(shiftDate, { start: constraintStartDate, end: constraintEndDate }) || 
              isEqual(shiftDate, constraintStartDate) || 
              isEqual(shiftDate, constraintEndDate)) {
            const employee = employees.find(emp => emp.id === employeeId);
            warnings[employeeId] = `${employee?.first_name} ${employee?.last_name} אינו זמין בתאריך זה (${constraint.notes || 'אי זמינות ספציפית'})`;
            break;
          }
        } else if (constraint.constraint_type === 'UNAVAILABLE_DAY_RECURRING') {
          const shiftDayOfWeek = getDay(shiftDate); // Sunday is 0, Monday is 1 ...
          const constraintDayMap = { 
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
            thursday: 4, friday: 5, saturday: 6 
          };
          
          if (constraint.day_of_week && constraintDayMap[constraint.day_of_week.toLowerCase()] === shiftDayOfWeek) {
            const employee = employees.find(emp => emp.id === employeeId);
            warnings[employeeId] = `${employee?.first_name} ${employee?.last_name} אינו זמין בדרך כלל בימי ${constraint.day_of_week} (${constraint.notes || 'אי זמינות קבועה'})`;
            break;
          }
        }
        // Add more constraint type checks here if needed (e.g., time slots)
      }
    });

    setConstraintWarnings(warnings);
  };

  const processSmsAutomations = async (savedShift, previouslyAssignedEmployeeIds = []) => {
    // Use the state variable directly, no need to re-fetch
    if (!shiftAssignedAutomation || !shiftAssignedAutomation.is_active || !savedShift || !savedShift.assigned_employee_ids) {
      return; 
    }

    const newAssignedEmployeeIds = savedShift.assigned_employee_ids.filter(
      id => !previouslyAssignedEmployeeIds.includes(id)
    );

    if (newAssignedEmployeeIds.length === 0) {
      return; 
    }

    for (const employeeId of newAssignedEmployeeIds) {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee || !employee.phone) {
        console.warn(`SMS Automation: Employee ${employeeId} not found or has no phone for shift ${savedShift.title}.`); // More specific warning
        continue;
      }

      let message = shiftAssignedAutomation.message_template; // Use shiftAssignedAutomation
      message = message.replace(/{employee_name}/g, `${employee.first_name} ${employee.last_name}`);
      message = message.replace(/{shift_title}/g, savedShift.title);
      try {
        message = message.replace(/{shift_date}/g, format(parseISO(savedShift.date), 'dd/MM/yyyy')); // Add try-catch for date format
      } catch (e) { console.error("SMS Automation: Could not format shift_date", e); }
      message = message.replace(/{shift_start_time}/g, savedShift.start_time || ''); // Add default empty string
      message = message.replace(/{shift_end_time}/g, savedShift.end_time || ''); // Add default empty string
      message = message.replace(/{shift_location}/g, savedShift.location || 'לא צוין');
      message = message.replace(/{shift_notes}/g, savedShift.notes || '');
      
      try {
        console.log(`SMS Automation: Attempting to send SMS to ${employee.phone} for shift "${savedShift.title}"`); // More specific log
        const smsResult = await sendSmsFunction({ recipient: employee.phone, msg: message }); // Use sendSmsFunction
        if (smsResult.data && smsResult.data.status > 0) {
          console.log(`SMS Automation: Successfully sent SMS to ${employee.phone}. Response:`, smsResult.data.message);
        } else {
          console.error(`SMS Automation: Failed to send SMS to ${employee.phone}. API Response:`, smsResult.data);
        }
      } catch (smsError) {
        console.error(`SMS Automation: Error calling sendSms function for ${employee.phone}:`, smsError);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.keys(constraintWarnings).length > 0) {
      const warningMessages = Object.values(constraintWarnings).join('\n');
      if (!window.confirm(`נמצאו אילוצים:\n${warningMessages}\n\nהאם ברצונך להמשיך ולשבץ את העובדים למרות האילוצים?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    const previouslyAssignedIds = shift ? Array.isArray(shift.assigned_employee_ids) ? [...shift.assigned_employee_ids] : [] : [];

    try {
      const updatedFormData = { ...formData };
      
      // Ensure assigned_employee_ids is always an array
      if (!Array.isArray(updatedFormData.assigned_employee_ids)) {
        updatedFormData.assigned_employee_ids = [];
      }
      
      // Update status based on assignment
      if (updatedFormData.assigned_employee_ids.length === 0) {
        updatedFormData.status = "לא מאויש";
      } else if (updatedFormData.assigned_employee_ids.length < updatedFormData.required_number_of_employees) {
        updatedFormData.status = "מאויש חלקית";
      } else {
        updatedFormData.status = "מאויש";
      }
      
      console.log("Submitting shift data:", updatedFormData); // Debug log
      
      const savedShiftData = await onSave(updatedFormData); 
      
      console.log("Received saved shift data:", savedShiftData); // Debug log
      
      // Process SMS automations
      if (savedShiftData && savedShiftData.id) { 
        await processSmsAutomations(savedShiftData, previouslyAssignedIds);
      } else if (!shift) { 
         console.warn("SMS Automation: onSave did not return the created shift object with ID");
      }

    } catch (error) {
      console.error("Error in ShiftForm handleSubmit:", error);
      alert("שגיאה בשמירת המשמרת: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`Changing ${field} to:`, value); // Debug log
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmployeeToggle = (employeeId) => {
    console.log("Toggling employee:", employeeId); // Debug log
    setFormData(prev => {
      const currentIds = Array.isArray(prev.assigned_employee_ids) ? prev.assigned_employee_ids : [];
      const isCurrentlyAssigned = currentIds.includes(employeeId);
      const newAssignedIds = isCurrentlyAssigned
        ? currentIds.filter(id => id !== employeeId)
        : [...currentIds, employeeId];
      
      console.log("Previous assigned IDs:", currentIds);
      console.log("New assigned IDs:", newAssignedIds);
      
      return { ...prev, assigned_employee_ids: newAssignedIds };
    });
  };

  // Filter employees based on the selected required_job_role_id
  const availableEmployees = employees.filter(emp => {
    console.log("Checking employee:", emp.first_name, emp.last_name, "Status:", emp.status, "Job roles:", emp.job_role_ids);
    
    if (emp.status !== "פעיל") {
      return false;
    }
    
    if (!formData.required_job_role_id) {
      return true; // Show all active employees if no role selected
    }
    
    // Check if employee has the required job role
    if (!emp.job_role_ids || !Array.isArray(emp.job_role_ids)) {
      console.log("Employee has no job_role_ids or it's not an array:", emp.job_role_ids);
      return false;
    }
    
    return emp.job_role_ids.includes(formData.required_job_role_id);
  });

  console.log("Available employees:", availableEmployees.length);
  console.log("Required job role ID:", formData.required_job_role_id);
  console.log("Form data assigned employee IDs:", formData.assigned_employee_ids);

  return (
    <Card className="bg-white shadow-xl border-0 my-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-900">
          {shift ? "עריכת משמרת" : "יצירת משמרת חדשה"}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">שם המשמרת</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="למשל: משמרת בוקר"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">תאריך</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start_time">שעת התחלה</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange("start_time", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">שעת סיום</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange("end_time", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_job_role_id">תפקיד נדרש</Label>
              <Select
                value={formData.required_job_role_id}
                onValueChange={(value) => {
                  console.log("Changing required job role to:", value);
                  handleInputChange("required_job_role_id", value);
                  handleInputChange("assigned_employee_ids", []);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  {allJobRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="required_number_of_employees">מספר עובדים נדרש</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleInputChange("required_number_of_employees", Math.max(1, formData.required_number_of_employees - 1))}
                  disabled={formData.required_number_of_employees <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="required_number_of_employees"
                  type="number"
                  value={formData.required_number_of_employees}
                  onChange={(e) => handleInputChange("required_number_of_employees", Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleInputChange("required_number_of_employees", formData.required_number_of_employees + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">רמת קושי/חשיבות</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => handleInputChange("difficulty_level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר רמת קושי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="קל">קל</SelectItem>
                  <SelectItem value="בינוני">בינוני</SelectItem>
                  <SelectItem value="מאתגר">מאתגר</SelectItem>
                  <SelectItem value="קריטי">קריטי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="location">מיקום</Label>
                <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="למשל: סניף ראשי"
                />
            </div>
          </div>

          {/* Employee Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">בחירת עובדים למשמרת</Label>
              <div className="text-sm text-gray-600">
                {formData.assigned_employee_ids.length} מתוך {formData.required_number_of_employees} נבחרו
              </div>
            </div>
            
            {!formData.required_job_role_id ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">בחר תפקיד נדרש תחילה כדי לראות עובדים זמינים</p>
              </div>
            ) : availableEmployees.length === 0 ? (
              <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-yellow-700">אין עובדים זמינים עם התפקיד הנדרש</p>
                <p className="text-xs text-yellow-600 mt-2">
                  תפקיד נדרש: {allJobRoles.find(r => r.id === formData.required_job_role_id)?.name || formData.required_job_role_id}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {availableEmployees.map((employee) => {
                  const isAssigned = formData.assigned_employee_ids.includes(employee.id);
                  const hasWarning = constraintWarnings[employee.id];
                  
                  return (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeToggle(employee.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isAssigned
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${hasWarning ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAssigned ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {employee.phone || employee.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {employee.id}
                          </p>
                        </div>
                        {isAssigned && (
                          <div className="text-blue-500">
                            ✓
                          </div>
                        )}
                      </div>
                      
                      {hasWarning && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          {hasWarning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="הערות נוספות למשמרת..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 ml-2" />
              {isSubmitting ? "שומר..." : "שמור"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
