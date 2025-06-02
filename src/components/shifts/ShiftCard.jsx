
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, User, Edit, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const statusColors = {
  "לא מאויש": "bg-red-100 text-red-700 border-red-200",
  "מאויש": "bg-green-100 text-green-700 border-green-200",
  "ממתין לאישור": "bg-yellow-100 text-yellow-700 border-yellow-200"
};

const roleColors = {
  "מנהל": "bg-purple-100 text-purple-700 border-purple-200",
  "קופאי": "bg-blue-100 text-blue-700 border-blue-200",
  "מלצר": "bg-green-100 text-green-700 border-green-200",
  "טבח": "bg-orange-100 text-orange-700 border-orange-200",
  "ניקיון": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "אחר": "bg-gray-100 text-gray-700 border-gray-200"
};

export default function ShiftCard({ shift, employees, getEmployeeName, onEdit, onDelete, onAssignEmployee }) {
  const availableEmployees = employees.filter(emp => 
    emp.status === "פעיל" && emp.role === shift.required_role
  );

  return (
    <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-lg">{shift.title}</h3>
            <div className="flex gap-2">
              <Badge className={`${statusColors[shift.status]} border text-xs font-medium`}>
                {shift.status}
              </Badge>
              <Badge className={`${roleColors[shift.required_role]} border text-xs font-medium`}>
                {shift.required_role}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(shift)}
              className="hover:bg-blue-50 hover:text-blue-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(shift.id)}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{format(new Date(shift.date), 'EEEE, d MMMM yyyy', { locale: he })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{shift.start_time} - {shift.end_time}</span>
          </div>
          
          {shift.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{shift.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{getEmployeeName(shift.assigned_employee_id)}</span>
          </div>
        </div>

        {shift.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>הערות:</strong> {shift.notes}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">שיבוץ עובד:</label>
          <Select
            value={shift.assigned_employee_id || ""}
            onValueChange={(value) => onAssignEmployee(shift.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="בחר עובד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>ללא עובד</SelectItem>
              {availableEmployees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
