
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertTriangle } from 'lucide-react';
import { Employee } from '@/api/entities'; // Import Employee entity
import { sendSms as sendSmsFunction } from '@/api/functions'; // Import the backend function

export default function ShiftSmsDialog({ shift, isOpen, onClose, allEmployees }) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [assignedEmployeesDetails, setAssignedEmployeesDetails] = useState([]);
  const [error, setError] = useState(null);
  const [smsResponse, setSmsResponse] = useState(null);

  useEffect(() => {
    if (isOpen && shift && shift.assigned_employee_ids && shift.assigned_employee_ids.length > 0) {
      // Fetch details of assigned employees to get their phone numbers
      const employeesToFetch = shift.assigned_employee_ids.map(id => 
        allEmployees.find(emp => emp.id === id)
      ).filter(Boolean); // Filter out any undefined if an ID doesn't match
      setAssignedEmployeesDetails(employeesToFetch);
    } else {
      setAssignedEmployeesDetails([]);
    }
    // Reset form state when dialog opens/closes or shift changes
    setMessage('');
    setError(null);
    setSmsResponse(null);
  }, [isOpen, shift, allEmployees]);

  const handleSendSms = async () => {
    if (!message.trim()) {
      setError("תוכן ההודעה לא יכול להיות ריק.");
      return;
    }
    setError(null);
    setSmsResponse(null);

    const phoneNumbers = assignedEmployeesDetails
      .map(emp => emp.phone)
      .filter(phone => phone && phone.trim() !== ''); // Filter out empty or null phone numbers

    if (phoneNumbers.length === 0) {
      setError("לא נמצאו מספרי טלפון תקינים עבור העובדים המשובצים.");
      return;
    }

    const recipientsString = phoneNumbers.join(';');

    setIsSending(true);
    try {
      const result = await sendSmsFunction({ recipient: recipientsString, msg: message });
      setSmsResponse(result.data);
      if (result.data && result.data.status > 0) {
        // Optionally close dialog on success or show success message
        // For now, just show response
        console.log(`SMS נשלח בהצלחה ל-${result.data.status} נמענים.`);
        setMessage(''); // Clear message on success
      } else {
        setError(`שגיאה בשליחת SMS: ${result.data.message || 'שגיאה לא ידועה מהשרת'}`);
      }
    } catch (err) {
      console.error("Error sending SMS via function:", err);
      setError("אירעה שגיאה בתקשורת עם שירות ה-SMS.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // The getEmployeeName function was not used and could be removed if not needed elsewhere.
  // const getEmployeeName = (empId) => {
  //   const emp = allEmployees.find(e => e.id === empId);
  //   return emp ? `${emp.first_name} ${emp.last_name}` : 'לא ידוע';
  // };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>שליחת SMS לעובדי משמרת: {shift?.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="recipients">נמענים:</Label>
            {assignedEmployeesDetails.length > 0 ? (
              <div className="mt-1 text-sm text-gray-600 p-2 border rounded-md bg-gray-50 max-h-24 overflow-y-auto">
                {assignedEmployeesDetails.map(emp => (
                  <div key={emp.id} className="flex justify-between items-center">
                    <span>{emp.first_name} {emp.last_name}</span>
                    <span className="text-xs text-gray-500">{emp.phone || "אין מספר טלפון"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-1">אין עובדים משובצים למשמרת זו או שלא נמצאו פרטיהם.</p>
            )}
          </div>
          <div>
            <Label htmlFor="sms_message">תוכן ההודעה:</Label>
            <Textarea
              id="sms_message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="כתוב את הודעתך כאן..."
              rows={4}
              disabled={assignedEmployeesDetails.length === 0}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          {smsResponse && (
            <div className={`text-sm p-3 border rounded-md flex items-start gap-2 ${smsResponse.status > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
               {smsResponse.status > 0 ? <Send className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
              <div>
                <strong>תגובת שרת:</strong> {smsResponse.message} 
                {smsResponse.status > 0 && ` (נשלח ל-${smsResponse.status} נמענים)`}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              ביטול
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSendSms}
            disabled={isSending || assignedEmployeesDetails.length === 0 || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            שלח הודעה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
