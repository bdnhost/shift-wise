import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-600",
    ring: "ring-blue-100"
  },
  green: {
    bg: "bg-green-500", 
    light: "bg-green-50",
    text: "text-green-600",
    ring: "ring-green-100"
  },
  red: {
    bg: "bg-red-500",
    light: "bg-red-50", 
    text: "text-red-600",
    ring: "ring-red-100"
  },
  purple: {
    bg: "bg-purple-500",
    light: "bg-purple-50",
    text: "text-purple-600", 
    ring: "ring-purple-100"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, change, urgent }) {
  const colors = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${urgent ? 'ring-2 ring-red-200 bg-red-50/50' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className={`absolute top-0 left-0 w-full h-1 ${colors.bg}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className={`p-3 rounded-xl ${colors.light} ${colors.ring} ring-1`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          {urgent && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{value}</span>
              {change && (
                <span className={`text-sm ${urgent ? 'text-red-600' : colors.text} font-medium`}>
                  {change}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}