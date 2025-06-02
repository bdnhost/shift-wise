import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const actions = [
  {
    title: "הוסף עובד חדש",
    description: "הוסף עובד חדש למערכת",
    icon: Users,
    color: "bg-blue-500 hover:bg-blue-600",
    href: createPageUrl("Employees")
  },
  {
    title: "צור משמרת",
    description: "הוסף משמרת חדשה",
    icon: Plus,
    color: "bg-green-500 hover:bg-green-600", 
    href: createPageUrl("Shifts")
  },
  {
    title: "לוח זמנים",
    description: "צפה בלוח השבועי",
    icon: Calendar,
    color: "bg-purple-500 hover:bg-purple-600",
    href: createPageUrl("Schedule")
  }
];

export default function QuickActions() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Zap className="w-5 h-5 text-yellow-500" />
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={action.href}>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-4 hover:bg-gray-50 transition-all duration-200"
              >
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Button>
            </Link>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}