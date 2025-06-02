
import React, { useState, useEffect, useRef } from "react";
import { Employee } from "@/api/entities";
import { User } from "@/api/entities"; // Import User entity
import { Organization } from '@/api/entities'; // Import Organization entity
import { JobRole } from "@/api/entities"; // Import JobRole entity
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User as UserIcon, UploadCloud, FileText, Loader2, AlertTriangle, LayoutGrid, List, Users as UsersGroupIcon, DownloadCloud } from "lucide-react"; // Renamed User to UserIcon to avoid conflict
import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeCard from "../components/employees/EmployeeCard";
import EmployeeProfile from "../components/employees/EmployeeProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";

const VIEW_TYPES = {
  CARDS: 'cards',
  TABLE: 'table',
  CONSTELLATION: 'constellation'
};

export default function Employees() {
  const [currentUser, setCurrentUser] = useState(null); // New state for current user
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null); // Add state for org ID
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentView, setCurrentView] = useState(VIEW_TYPES.CARDS);
  const fileInputRef = useRef(null);
  const [allJobRolesForOrg, setAllJobRolesForOrg] = useState([]); // New state to store job roles for mapping

  useEffect(() => {
    checkAuthAndLoadBaseData();
  }, []);

  const checkAuthAndLoadBaseData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const orgs = await Organization.list();
      if (orgs.length > 0) {
        const currentOrg = orgs[0];
        setCurrentOrganizationId(currentOrg.id);
        await loadEmployees(currentOrg.id);
        // Load job roles for the current organization once
        const roles = await JobRole.filter({ organization_id: currentOrg.id });
        setAllJobRolesForOrg(roles);
      } else {
        console.warn("No organization found. Cannot load employees or roles.");
        setEmployees([]); // Clear employees if no organization found
        setCurrentOrganizationId(null); // Ensure org ID is null if no org
        setAllJobRolesForOrg([]); // Clear job roles
      }
    } catch (error) {
      console.error("שגיאה באימות או בטעינת נתונים בסיסיים:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/'; // Redirect to Index page
        return; // Important: stop further execution
      }
      setCurrentUser(null); // Explicitly set to null if auth failed for other reasons
      setCurrentOrganizationId(null); // Clear organization ID on error as well
      setEmployees([]); // Clear employees on error
      setAllJobRolesForOrg([]); // Clear job roles on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async (organizationId) => {
    try {
      // Filter employees by organization_id for RLS
      const data = await Employee.filter({ organization_id: organizationId }, "-created_date");
      setEmployees(data);
    } catch (error) {
      console.error("שגיאה בטעינת עובדים:", error);
      setEmployees([]); // Ensure employees are cleared on loading error
    }
  };

  const handleSave = async (employeeData) => {
    try {
      // Add organization_id to employee data for RLS
      const dataWithOrg = { ...employeeData, organization_id: currentOrganizationId };
      
      if (editingEmployee) {
        await Employee.update(editingEmployee.id, dataWithOrg);
      } else {
        await Employee.create(dataWithOrg);
      }
      setShowForm(false);
      setEditingEmployee(null);
      await loadEmployees(currentOrganizationId);
    } catch (error) {
      console.error("שגיאה בשמירת עובד:", error);
      alert("שגיאה בשמירת העובד. בדוק את הקונסול לפרטים.");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק עובד זה?")) {
      try {
        await Employee.delete(employeeId);
        loadEmployees(currentOrganizationId); // Reload with current organization ID
      } catch (error) {
        console.error("שגיאה במחיקת עובד:", error);
      }
    }
  };

  const handleViewProfile = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const { file_url } = await UploadFile({ file });
      
      const employeeSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            first_name: { type: "string", description: "שם פרטי" },
            last_name: { type: "string", description: "שם משפחה" },
            email: { type: "string", format: "email", description: "כתובת אימייל" },
            phone: { type: "string", description: "מספר טלפון" },
            role_name_for_import: { type: "string", description: "שם תפקיד (ראשי)"},
            hourly_rate: { type: "number", description: "שכר לשעה (מספר)" },
            status: { type: "string", enum: ["פעיל", "לא פעיל", "חופש"], default: "פעיל", description: "סטטוס (פעיל/לא פעיל/חופש)" },
            hire_date: { type: "string", format: "date", description: "תאריך תחילת עבודה (YYYY-MM-DD)" }
          },
          required: ["first_name", "last_name", "role_name_for_import"]
        }
      };

      const extractionResult = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: employeeSchema
      });

      if (extractionResult.status === "success" && extractionResult.output) {
        const employeesToCreate = [];
        const employeesWithRoleErrors = [];

        for (const empFromFile of extractionResult.output) {
          const roleNameFromCsv = empFromFile.role_name_for_import?.trim().toLowerCase();
          const matchedRole = allJobRolesForOrg.find(
            (jr) => jr.name.trim().toLowerCase() === roleNameFromCsv
          );

          if (matchedRole) {
            employeesToCreate.push({
              first_name: empFromFile.first_name,
              last_name: empFromFile.last_name,
              email: empFromFile.email,
              phone: empFromFile.phone,
              job_role_ids: [matchedRole.id], // Assign as an array with the matched role ID
              primary_job_role_id: matchedRole.id, // Set the matched role ID as primary
              hourly_rate: empFromFile.hourly_rate ? parseFloat(empFromFile.hourly_rate) : null,
              status: empFromFile.status || "פעיל",
              hire_date: empFromFile.hire_date,
              organization_id: currentOrganizationId
            });
          } else {
            employeesWithRoleErrors.push({ 
              name: `${empFromFile.first_name || ''} ${empFromFile.last_name || ''}`, 
              roleAttempted: empFromFile.role_name_for_import 
            });
          }
        }

        let importSummaryMessage = "";
        if (employeesToCreate.length > 0) {
          await Employee.bulkCreate(employeesToCreate);
          importSummaryMessage += `${employeesToCreate.length} עובדים יובאו בהצלחה. `;
          await loadEmployees(currentOrganizationId); // Refresh employee list
        }

        if (employeesWithRoleErrors.length > 0) {
          const errorDetails = employeesWithRoleErrors
            .map(err => `לא ניתן היה למצוא תפקיד תואם עבור "${err.roleAttempted}" (עבור ${err.name})`)
            .join('\n');
          importSummaryMessage += `\n${employeesWithRoleErrors.length} עובדים לא יובאו עקב שגיאות במיפוי תפקידים:\n${errorDetails}\nודא ששמות התפקידים בקובץ תואמים לשמות התפקידים המוגדרים במערכת עבור הארגון שלך.`;
          setImportError(importSummaryMessage); // Show detailed error for roles not found
        } else if (employeesToCreate.length > 0) {
            alert(`${employeesToCreate.length} עובדים יובאו בהצלחה!`); // Success message if no role errors
        } else {
            alert("לא נמצאו עובדים תקינים לייבוא. בדוק את הקובץ או שגיאות מיפוי תפקידים.");
        }

      } else {
        console.error("Extraction failed:", extractionResult.details);
        setImportError(`שגיאה בחילוץ נתונים מהקובץ: ${extractionResult.details}. ודא שהקובץ בפורמט CSV תקין ושהעמודות תואמות לדוגמה.`);
      }
    } catch (error) {
      console.error("שגיאה בתהליך ייבוא הקובץ:", error);
      setImportError("אירעה שגיאה בתהליך ייבוא הקובץ. נסה שוב.");
    } finally {
      setIsImporting(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const generateSampleCsvContent = () => {
    // Define headers - these MUST match the properties in employeeSchema for ExtractDataFromUploadedFile
    const headers = [
      "first_name", 
      "last_name", 
      "email", 
      "phone", 
      "role_name_for_import", // This implies the user provides the name of the role.
                              // The system will need to map this to a JobRole ID.
      "hourly_rate", 
      "status",
      "hire_date" // YYYY-MM-DD format
    ];
    
    const sampleData = [
      ["ישראל", "ישראלי", "israel@example.com", "050-1234567", "מלצר", "35.5", "פעיל", "2023-05-15"],
      ["דנה", "כהן", "dana@example.com", "052-7654321", "קופאית", "38", "פעיל", "2024-01-10"],
      ["משה", "לוי", "moshe@example.com", "054-1122333", "טבח", "45", "לא פעיל", "2022-11-01"]
    ];

    let csvContent = headers.join(",") + "\n";
    sampleData.forEach(row => {
      csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",") + "\n"; // Enclose in quotes and escape existing quotes
    });

    return csvContent;
  };

  const downloadSampleCsv = () => {
    const csvContent = generateSampleCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "employee_import_sample.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert("הדפדפן שלך אינו תומך בהורדה ישירה. נסה דפדפן מודרני יותר.");
    }
  };


  const filteredEmployees = employees.filter(emp => {
    const searchMatch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = statusFilter === "all" || emp.status === statusFilter;
    const roleMatch = roleFilter === "all" || emp.role === roleFilter;
    
    return searchMatch && statusMatch && roleMatch;
  });

  // Cards View Component
  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEmployees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewProfile={handleViewProfile}
        />
      ))}
    </div>
  );

  // Table View Component
  const renderTableView = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              עובד
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              תפקיד
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              סטטוס
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              שכר לשעה
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              פעולות
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredEmployees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="mr-4">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {employee.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  employee.status === 'פעיל' ? 'bg-green-100 text-green-800' :
                  employee.status === 'לא פעיל' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {employee.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.hourly_rate ? `₪${employee.hourly_rate}` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProfile(employee)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    צפה
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(employee)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    ערוך
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(employee.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    מחק
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Constellation View Component
  const renderConstellationView = () => {
    const roleGroups = {
      "מנהל": { color: "bg-purple-500", employees: [] },
      "טבח": { color: "bg-orange-500", employees: [] },
      "מלצר": { color: "bg-green-500", employees: [] },
      "קופאי": { color: "bg-blue-500", employees: [] },
      "ניקיון": { color: "bg-cyan-500", employees: [] },
      "אחר": { color: "bg-gray-500", employees: [] }
    };

    filteredEmployees.forEach(emp => {
      if (roleGroups[emp.role]) {
        roleGroups[emp.role].employees.push(emp);
      } else {
        // If role doesn't match predefined groups, add to 'אחר'
        roleGroups["אחר"].employees.push(emp);
      }
    });

    return (
      <div className="space-y-8">
        {Object.entries(roleGroups).map(([role, group]) => (
          group.employees.length > 0 && (
            <div key={role} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-4 h-4 rounded-full ${group.color}`}></div>
                <h3 className="text-xl font-bold text-gray-800">{role}</h3>
                <span className="text-sm text-gray-500">({group.employees.length} עובדים)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {group.employees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    whileHover={{ scale: 1.05 }}
                    className="text-center cursor-pointer"
                    onClick={() => handleViewProfile(employee)}
                  >
                    <div className={`w-16 h-16 ${group.color} rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg relative`}>
                      <UserIcon className="w-8 h-8 text-white" />
                      {employee.status === 'פעיל' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                      {employee.status === 'לא פעיל' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {employee.first_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {employee.last_name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  const renderCurrentView = () => {
    if (filteredEmployees.length === 0 && !showForm) {
      return (
        <div className="col-span-full text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm || statusFilter !== "all" || roleFilter !== "all" 
              ? "לא נמצאו עובדים התואמים לחיפוש" 
              : "אין עובדים במערכת. נסה להוסיף עובד חדש או לייבא מקובץ."}
          </p>
        </div>
      );
    }

    switch (currentView) {
      case VIEW_TYPES.TABLE:
        return renderTableView();
      case VIEW_TYPES.CONSTELLATION:
        return renderConstellationView();
      case VIEW_TYPES.CARDS:
      default:
        return renderCardsView();
    }
  };

  // Show loading while checking authentication and loading initial data
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני עובדים...</p>
        </div>
      </div>
    );
  }

  // If no user or organization after loading, redirect will happen or user is not logged in.
  // This serves as a fallback or explicit message.
  if (!currentUser || !currentOrganizationId) {
    return (
      <div className="p-6 text-center flex items-center justify-center h-screen">
        <p className="text-gray-600">מפנה לדף הכניסה או שאין ארגון מוגדר...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול עובדים</h1>
          <p className="text-gray-600 mt-1">נהל את כל העובדים שלך במקום אחד</p>
        </div>
        <div className="flex gap-2 flex-wrap">
           <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" // Keep .xlsx and .xls for future if ExtractData supports them well
          />
          <Button
            onClick={downloadSampleCsv} // Added new button
            variant="outline"
            className="shadow-sm border-green-500 text-green-600 hover:bg-green-50"
          >
            <DownloadCloud className="w-5 h-5 ml-2" />
            הורד CSV לדוגמה
          </Button>
          <Button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            variant="outline"
            className="shadow-sm"
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5 ml-2" />
            )}
            ייבוא מקובץ CSV
          </Button>
          {/* <Button
            variant="outline"
            className="shadow-sm"
            disabled
            title="ייבוא מגוגל דרייב (בקרוב)"
          >
            <FileText className="w-5 h-5 ml-2" />
            ייבוא מגוגל דרייב
          </Button> */}
          <Button
            onClick={() => { setShowForm(true); setEditingEmployee(null); }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 ml-2" />
            הוסף עובד חדש
          </Button>
        </div>
      </div>

      {/* Import Error Message */}
      {importError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start gap-3 whitespace-pre-wrap">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <h4 className="font-bold">שגיאת ייבוא</h4>
            <p className="text-sm">{importError}</p>
          </div>
        </div>
      )}

      {/* View Selector & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-lg shadow border">
        {/* View Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">תצוגה:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentView === VIEW_TYPES.CARDS ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(VIEW_TYPES.CARDS)}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              כרטיסים
            </Button>
            <Button
              variant={currentView === VIEW_TYPES.TABLE ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(VIEW_TYPES.TABLE)}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              טבלה
            </Button>
            <Button
              variant={currentView === VIEW_TYPES.CONSTELLATION ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(VIEW_TYPES.CONSTELLATION)}
              className="flex items-center gap-2"
            >
              <UsersGroupIcon className="w-4 h-4" />
              קבוצות
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חפש עובדים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="פעיל">פעיל</SelectItem>
              <SelectItem value="לא פעיל">לא פעיל</SelectItem>
              <SelectItem value="חופש">חופש</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="תפקיד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל התפקידים</SelectItem>
              {allJobRolesForOrg.map(role => (
                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
              ))}
              <SelectItem value="אחר">אחר</SelectItem> {/* Keep "אחר" for constellation view if needed */}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Main Content Area (Skeletons for data loading, not initial auth check) */}
      {employees.length === 0 && !isLoading && !searchTerm && statusFilter === "all" && roleFilter === "all" ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white shadow-lg border-0 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div>
                                <Skeleton className="h-5 w-32 mb-1" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
      ) : (
        renderCurrentView()
      )}

      {/* Employee Form Modal */}
      <AnimatePresence>
      {showForm && (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <EmployeeForm
            employee={editingEmployee}
            onSave={handleSave}
            onCancel={() => {
                setShowForm(false);
                setEditingEmployee(null);
            }}
            />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Employee Profile Modal */}
      <AnimatePresence>
      {selectedEmployee && (
        <EmployeeProfile
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={() => {
            setEditingEmployee(selectedEmployee);
            setSelectedEmployee(null);
            setShowForm(true);
          }}
          onDelete={() => {
            handleDelete(selectedEmployee.id);
            setSelectedEmployee(null);
          }}
        />
      )}
      </AnimatePresence>
    </div>
  );
}
