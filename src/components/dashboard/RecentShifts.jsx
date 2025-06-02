import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { JobRole } from "@/api/entities";

const statusColors = {
  "לא מאויש": "bg-red-100 text-red-700 border-red-200",
  "מאויש": "bg-green-100 text-green-700 border-green-200", 
  "ממתין לאישור": "bg-yellow-100 text-yellow-700 border-yellow-200"
};

export default function RecentShifts({ shifts, employees, isLoading }) {
  const [jobRoles, setJobRoles] = useState({});
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const roles = await JobRole.list();
        const rolesMap = {};
        roles.forEach(role => {
          rolesMap[role.id] = role;
        });
        setJobRoles(rolesMap);
      } catch (error) {
        console.error("Error fetching job roles:", error);
      } finally {
        setIsLoadingRoles(false);
      }
    };
    fetchJobRoles();
  }, []);

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : "לא מאויש";
  };

  const getRoleName = (roleId) => {
    if (isLoadingRoles) return "טוען...";
    const role = jobRoles[roleId];
    return role ? role.name : "תפקיד לא זמין";
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            משמרות היום
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Clock className="w-5 h-5 text-blue-600" />
          משמרות היום
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">אין משמרות מתוכננות להיום</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.slice(0, 5).map((shift, index) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{shift.title}</h4>
                    <span className="text-sm text-gray-500">
                      {shift.start_time} - {shift.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {getEmployeeName(shift.assigned_employee_id)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{getRoleName(shift.required_job_role_id)}</span>
                    </div>
                    {shift.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {shift.location}
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={`${statusColors[shift.status]} border font-medium`}>
                  {shift.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}