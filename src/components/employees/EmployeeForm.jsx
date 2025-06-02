import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, PlusCircle, Trash2 } from "lucide-react";
import { JobRole } from "@/api/entities"; // Import JobRole entity

export default function EmployeeForm({ employee, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_role_ids: [], // Changed from single role string to array of IDs
    primary_job_role_id: null, // New field
    hourly_rate: "",
    status: "פעיל",
    hire_date: "",
    emergency_contact: { name: "", phone: "", relationship: "" }
  });

  const [allJobRoles, setAllJobRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        // TODO: In a multi-tenant app, filter roles by organization_id or show global templates
        const roles = await JobRole.list();
        setAllJobRoles(roles);
      } catch (error) {
        console.error("Error fetching job roles:", error);
      }
    };
    fetchJobRoles();
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        job_role_ids: employee.job_role_ids || [],
        primary_job_role_id: employee.primary_job_role_id || null,
        hourly_rate: employee.hourly_rate || "",
        status: employee.status || "פעיל",
        hire_date: employee.hire_date || "",
        emergency_contact: employee.emergency_contact || { name: "", phone: "", relationship: "" }
      });
    } else {
       setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        job_role_ids: [],
        primary_job_role_id: null,
        hourly_rate: "",
        status: "פעיל",
        hire_date: "",
        emergency_contact: { name: "", phone: "", relationship: "" }
      });
    }
  }, [employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.job_role_ids.length === 0) {
        alert("יש לבחור לפחות תפקיד אחד לעובד.");
        return;
    }
    if (formData.job_role_ids.length > 0 && !formData.primary_job_role_id && formData.job_role_ids.length === 1) {
        // Auto-set primary role if only one role is selected
        formData.primary_job_role_id = formData.job_role_ids[0];
    } else if (formData.job_role_ids.length > 0 && !formData.primary_job_role_id) {
        alert("יש לבחור תפקיד ראשי אחד מבין התפקידים שנבחרו.");
        return;
    }


    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };
      await onSave(dataToSave);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
        ...prev,
        emergency_contact: {
            ...prev.emergency_contact,
            [field]: value
        }
    }));
  };
  
  const handleJobRoleToggle = (roleId) => {
    setFormData(prev => {
        const newJobRoleIds = prev.job_role_ids.includes(roleId)
            ? prev.job_role_ids.filter(id => id !== roleId)
            : [...prev.job_role_ids, roleId];
        
        // If primary role was removed, unset it
        const newPrimaryJobRoleId = newJobRoleIds.includes(prev.primary_job_role_id) ? prev.primary_job_role_id : null;
        
        return { ...prev, job_role_ids: newJobRoleIds, primary_job_role_id: newPrimaryJobRoleId };
    });
  };


  const availablePrimaryRoles = allJobRoles.filter(role => formData.job_role_ids.includes(role.id));

  return (
    <Card className="bg-white shadow-xl border-0 mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-900">
          {employee ? "עריכת עובד" : "הוספת עובד חדש"}
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
          {/* Personal Details */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">פרטים אישיים</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">שם פרטי</Label>
                <Input id="first_name" value={formData.first_name} onChange={(e) => handleInputChange("first_name", e.target.value)} placeholder="הכנס שם פרטי" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">שם משפחה</Label>
                <Input id="last_name" value={formData.last_name} onChange={(e) => handleInputChange("last_name", e.target.value)} placeholder="הכנס שם משפחה" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">מייל</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="example@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="050-1234567" />
              </div>
            </div>
          </fieldset>

          {/* Job Roles */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">תפקידים</legend>
            <div className="space-y-3 mt-2">
                <div>
                    <Label>בחר תפקידים רלוונטיים לעובד:</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 p-2 border rounded-md max-h-48 overflow-y-auto">
                        {allJobRoles.map(role => (
                            <Button
                                key={role.id}
                                type="button"
                                variant={formData.job_role_ids.includes(role.id) ? "default" : "outline"}
                                onClick={() => handleJobRoleToggle(role.id)}
                                className="text-xs justify-start h-auto py-1.5 px-2"
                            >
                                {formData.job_role_ids.includes(role.id) && <PlusCircle className="w-3 h-3 mr-1.5 text-green-300" />}
                                {!formData.job_role_ids.includes(role.id) && <PlusCircle className="w-3 h-3 mr-1.5 text-gray-400" />}
                                {role.name}
                            </Button>
                        ))}
                    </div>
                </div>
                {formData.job_role_ids.length > 0 && (
                    <div className="space-y-2">
                        <Label htmlFor="primary_job_role_id">תפקיד ראשי</Label>
                        <Select value={formData.primary_job_role_id || ""} onValueChange={(value) => handleInputChange("primary_job_role_id", value || null)}>
                            <SelectTrigger><SelectValue placeholder="בחר תפקיד ראשי" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>ללא</SelectItem>
                                {availablePrimaryRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">בחר תפקיד ראשי אחד מבין התפקידים שסומנו.</p>
                    </div>
                )}
            </div>
          </fieldset>
          
          {/* Employment Details */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">פרטי העסקה</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">שכר לשעה (₪)</Label>
                <Input id="hourly_rate" type="number" value={formData.hourly_rate} onChange={(e) => handleInputChange("hourly_rate", e.target.value)} placeholder="0" min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="פעיל">פעיל</SelectItem>
                    <SelectItem value="לא פעיל">לא פעיל</SelectItem>
                    <SelectItem value="חופש">חופש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">תאריך תחילת עבודה</Label>
                <Input id="hire_date" type="date" value={formData.hire_date} onChange={(e) => handleInputChange("hire_date", e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* Emergency Contact */}
           <fieldset className="border p-4 rounded-md">
            <legend className="text-sm font-medium px-1">איש קשר בחירום</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className="space-y-2">
                    <Label htmlFor="emergency_name">שם מלא</Label>
                    <Input id="emergency_name" value={formData.emergency_contact.name} onChange={(e) => handleEmergencyContactChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="emergency_phone">טלפון</Label>
                    <Input id="emergency_phone" value={formData.emergency_contact.phone} onChange={(e) => handleEmergencyContactChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="emergency_relationship">קרבה</Label>
                    <Input id="emergency_relationship" value={formData.emergency_contact.relationship} onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)} />
                </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>ביטול</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 ml-2" />
              {isSubmitting ? "שומר..." : "שמור"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}