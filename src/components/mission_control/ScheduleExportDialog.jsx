import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar as CalendarIcon, Printer } from 'lucide-react'; // Changed Download to Printer

export default function ScheduleExportDialog({ isOpen, onClose, onExport }) {
  const [rangeType, setRangeType] = useState('day'); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));

  const handleExportClick = () => {
    let startDate, endDate;
    switch (rangeType) {
      case 'day':
        startDate = selectedDate;
        endDate = selectedDate;
        break;
      case 'week':
        startDate = selectedWeek;
        endDate = endOfWeek(selectedWeek, { weekStartsOn: 0 });
        break;
      case 'month':
        startDate = selectedMonth;
        endDate = endOfMonth(selectedMonth);
        break;
      default:
        return;
    }
    onExport(rangeType, startDate, endDate);
    onClose();
  };

  const renderDateSelector = () => {
    switch (rangeType) {
      case 'day':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
              >
                <CalendarIcon className="ml-2 h-4 w-4" /> {/* Changed mr-2 to ml-2 for RTL */}
                {selectedDate ? format(selectedDate, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700"> {/* Added styling for popover */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                }}
                initialFocus
                locale={he}
                className="text-gray-100"
                
              />
            </PopoverContent>
          </Popover>
        );
      case 'week':
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setSelectedWeek(addDays(selectedWeek, 7))} className="bg-gray-700 border-gray-600 hover:bg-gray-600">&gt;</Button> {/* Swapped buttons for RTL */}
            <span className="text-center flex-grow text-gray-200">
              {format(selectedWeek, 'd MMM', { locale: he })} - {format(endOfWeek(selectedWeek, { weekStartsOn: 0 }), 'd MMM yyyy', { locale: he })}
            </span>
            <Button variant="outline" size="icon" onClick={() => setSelectedWeek(subDays(selectedWeek, 7))} className="bg-gray-700 border-gray-600 hover:bg-gray-600">&lt;</Button>
          </div>
        );
      case 'month':
        return (
           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
              >
                <CalendarIcon className="ml-2 h-4 w-4" /> {/* Changed mr-2 to ml-2 for RTL */}
                {selectedMonth ? format(selectedMonth, 'MMMM yyyy', { locale: he }) : <span>בחר חודש</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700"> {/* Added styling for popover */}
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(month) => {
                  if (month) setSelectedMonth(startOfMonth(month));
                }}
                initialFocus
                locale={he}
                captionLayout="dropdown-buttons"
                fromYear={new Date().getFullYear() - 5}
                toYear={new Date().getFullYear() + 5}
                className="text-gray-100"
              />
            </PopoverContent>
          </Popover>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-sky-400">ייצוא לוח משמרות להדפסה</DialogTitle>
          <DialogDescription className="text-gray-400">
            בחר את טווח הזמן הרצוי. התוכן יוצג בחלון חדש, מוכן להדפסה או שמירה כ-PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rangeType" className="text-gray-300">בחר טווח:</Label>
            <Select value={rangeType} onValueChange={setRangeType}>
              <SelectTrigger id="rangeType" className="w-full bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue placeholder="בחר טווח" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-gray-100 border-gray-600">
                <SelectItem value="day" className="hover:bg-gray-600 focus:bg-gray-600">יום</SelectItem>
                <SelectItem value="week" className="hover:bg-gray-600 focus:bg-gray-600">שבוע</SelectItem>
                <SelectItem value="month" className="hover:bg-gray-600 focus:bg-gray-600">חודש</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
             <Label className="text-gray-300">בחר תאריך/שבוע/חודש:</Label>
            {renderDateSelector()}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700">
            ביטול
          </Button>
          <Button onClick={handleExportClick} className="bg-sky-500 hover:bg-sky-600 text-white">
            <Printer className="ml-2 h-4 w-4" /> {/* Changed Download to Printer */}
            הצג להדפסה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}