import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Edit, Trash2, Clock, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { JobRole } from "@/api/entities";

const statusColors = {
  "פעיל": "bg-green-100 text-green-700 border-green-200",
  "לא פעיל": "bg-red-100 text-red-700 border-red-200",
  "חופש": "bg-yellow-100 text-yellow-700 border-yellow-200"
};

export default function EmployeeCard({ employee, onEdit, onDelete, onViewProfile }) {
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

  const getPrimaryRoleName = () => {
    if (!employee.primary_job_role_id || isLoadingRoles) return "טוען...";
    const role = jobRoles[employee.primary_job_role_id];
    return role ? role.name : "תפקיד לא זמין";
  };

  const getAdditionalRolesCount = () => {
    if (!employee.job_role_ids || employee.job_role_ids.length <= 1) return 0;
    return employee.job_role_ids.length - 1;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center relative">
                <User className="w-6 h-6 text-white" />
                {employee.status === 'פעיל' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {employee.first_name} {employee.last_name}
                </h3>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs font-medium">
                    {getPrimaryRoleName()}
                  </Badge>
                  {getAdditionalRolesCount() > 0 && (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 border text-xs">
                      +{getAdditionalRolesCount()} תפקידים
                    </Badge>
                  )}
                  <Badge className={`${statusColors[employee.status]} border text-xs font-medium`}>
                    {employee.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewProfile(employee)}
                className="hover:bg-green-50 hover:text-green-600"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(employee)}
                className="hover:bg-blue-50 hover:text-blue-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(employee.id)}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {employee.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.hourly_rate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>₪{employee.hourly_rate} לשעה</span>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>הצטרף: {new Date(employee.created_date).toLocaleDateString('he-IL')}</span>
              <span className={employee.status === 'פעיל' ? 'text-green-600' : 'text-red-600'}>
                {employee.status === 'פעיל' ? '● זמין' : '● לא זמין'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}