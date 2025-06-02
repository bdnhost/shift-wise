import React, { useState, useEffect, useCallback } from 'react';
import { SmsAutomation } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, AlertTriangle, Info, MessageSquare, PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input'; // Added for automation_name

const AUTOMATION_TYPES_DEFINITIONS = [
  {
    value: 'SHIFT_ASSIGNED_NEW',
    label: 'הודעה על שיבוץ למשמרת חדשה',
    description: 'שולח SMS אוטומטי לעובד כאשר הוא משובץ למשמרת (בפעם הראשונה או אם שובץ מחדש).',
    defaultTemplate: 'שלום {employee_name}, שובצת למשמרת "{shift_title}" בתאריך {shift_date} בין השעות {shift_start_time} - {shift_end_time}. מיקום: {shift_location}. הערות: {shift_notes}',
    placeholders: ['{employee_name}', '{shift_title}', '{shift_date}', '{shift_start_time}', '{shift_end_time}', '{shift_location}', '{shift_notes}'],
    recipientGroup: 'ASSIGNED_EMPLOYEES_OF_SHIFT'
  },
  // Example for a future automation, currently not fully implemented in backend logic
  // {
  //   value: 'SHIFT_REMINDER_X_MINUTES_BEFORE',
  //   label: 'תזכורת X דקות/שעות לפני משמרת',
  //   description: 'שולח SMS תזכורת לפני תחילת המשמרת. (דורש הגדרת תזמון)',
  //   defaultTemplate: 'תזכורת: משמרת "{shift_title}" שלך מתחילה בתאריך {shift_date} בשעה {shift_start_time}.',
  //   placeholders: ['{employee_name}', '{shift_title}', '{shift_date}', '{shift_start_time}'],
  //   recipientGroup: 'ASSIGNED_EMPLOYEES_OF_SHIFT'
  // },
];

export default function SmsAutomationManagement() {
  const [automations, setAutomations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [focusedTextareaIndex, setFocusedTextareaIndex] = useState(null);

  const loadAutomations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const existingAutomations = await SmsAutomation.list();
      const updatedAutomations = AUTOMATION_TYPES_DEFINITIONS.map(typeDef => {
        const existing = existingAutomations.find(a => a.event_type === typeDef.value);
        if (existing) {
          return { 
            ...existing, 
            // Ensure client-side definitions are merged for display
            placeholders: typeDef.placeholders, 
            description: typeDef.description,
            label: typeDef.label 
          };
        }
        return {
          id: null, // Important for knowing it's a new record
          automation_name: typeDef.label,
          event_type: typeDef.value,
          is_active: false,
          message_template: typeDef.defaultTemplate,
          recipient_group: typeDef.recipientGroup,
          notes: '',
          // Client-side definitions
          placeholders: typeDef.placeholders,
          description: typeDef.description,
          label: typeDef.label
        };
      });
      setAutomations(updatedAutomations);
    } catch (e) {
      console.error("Error loading SMS automations:", e);
      setError("שגיאה בטעינת הגדרות אוטומציה.");
      setAutomations(AUTOMATION_TYPES_DEFINITIONS.map(typeDef => ({ // Fallback to default structure on error
        id: null, automation_name: typeDef.label, event_type: typeDef.value, is_active: false,
        message_template: typeDef.defaultTemplate, recipient_group: typeDef.recipientGroup, notes: '',
        placeholders: typeDef.placeholders, description: typeDef.description, label: typeDef.label
      })));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAutomations();
  }, [loadAutomations]);

  const handleAutomationChange = (index, field, value) => {
    const newAutomations = [...automations];
    newAutomations[index] = { ...newAutomations[index], [field]: value };
    setAutomations(newAutomations);
  };
  
  const handleAddPlaceholder = (index, placeholder) => {
    const newAutomations = [...automations];
    const currentTemplate = newAutomations[index].message_template || "";
    // Add placeholder at cursor position or end if no focused textarea is tracked well
    // This simplified version adds to the end. For cursor position, more complex state needed for selectionStart/End.
    newAutomations[index].message_template = `${currentTemplate} ${placeholder} `;
    setAutomations(newAutomations);
  };


  const handleSaveAutomations = async () => {
    setIsSaving(true);
    setError(null);
    let success = true;
    try {
      for (const automation of automations) {
        // Destructure to remove client-side only fields before saving
        const { placeholders, description, label, ...dataToSave } = automation;
        
        if (!dataToSave.automation_name || !dataToSave.message_template) {
            setError(`אוטומציה "${label}" דורשת שם ותבנית הודעה.`);
            success = false;
            break;
        }

        if (dataToSave.id) { // Existing record, update it
          await SmsAutomation.update(dataToSave.id, dataToSave);
        } else { // New record, create it
          const newRecord = await SmsAutomation.create(dataToSave);
          // Update local state with the new ID for subsequent saves
          // This part is important so that next save calls update instead of create again
          setAutomations(prevAutomations => 
            prevAutomations.map(a => 
              a.event_type === newRecord.event_type ? { ...a, ...newRecord, placeholders, description, label } : a
            )
          );
        }
      }
      if (success) {
        alert("הגדרות האוטומציה נשמרו בהצלחה!");
        loadAutomations(); // Reload to confirm and get any new IDs
      }
    } catch (e) {
      console.error("Error saving SMS automations:", e);
      setError(`שגיאה בשמירת הגדרות האוטומציה: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderPlaceholderButtons = (index, placeholders) => {
    if (!placeholders || placeholders.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-xs text-gray-600 self-center mr-2">הוסף משתנה:</span>
        {placeholders.map(p => (
          <Button
            key={p}
            variant="outline"
            size="xs"
            className="text-xs px-1.5 py-0.5 h-auto font-mono"
            onClick={() => handleAddPlaceholder(index, p)}
          >
            {p}
          </Button>
        ))}
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-2">טוען הגדרות אוטומציה...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            ניהול אוטומציות SMS
          </CardTitle>
          <CardDescription>
            הגדר הודעות SMS אוטומטיות שיישלחו בתגובה לאירועים שונים במערכת.
            שים לב: יכולת זו תלויה בהגדרות תקינות של שירות ה-SMS ובזמינות יתרה בחשבונך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          {automations.length === 0 && !isLoading && (
            <p className="text-center text-gray-500 py-8">לא הוגדרו סוגי אוטומציות. נסה לרענן את הדף.</p>
          )}
          
          <div className="space-y-8">
            {automations.map((automation, index) => (
              <Card key={automation.event_type} className="shadow-lg border-l-4 border-indigo-500">
                <CardHeader className="bg-indigo-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="mb-2 sm:mb-0">
                            {/* Allow editing automation_name */}
                            <Input 
                                value={automation.automation_name}
                                onChange={(e) => handleAutomationChange(index, 'automation_name', e.target.value)}
                                className="text-lg font-semibold text-gray-800 p-1 border-b-2 border-transparent focus:border-indigo-500 hover:border-gray-300 transition-colors"
                            />
                            <CardDescription className="mt-1">{automation.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                            <Switch
                                id={`active-${automation.event_type}`}
                                checked={automation.is_active}
                                onCheckedChange={(checked) => handleAutomationChange(index, 'is_active', checked)}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                            <Label htmlFor={`active-${automation.event_type}`} className="text-sm font-medium cursor-pointer">
                                {automation.is_active ? "אוטומציה פעילה" : "אוטומציה כבויה"}
                            </Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className={!automation.is_active ? 'opacity-60' : ''}>
                    <Label htmlFor={`template-${automation.event_type}`} className="text-base font-semibold text-gray-700">
                      תבנית ההודעה:
                    </Label>
                    <Textarea
                      id={`template-${automation.event_type}`}
                      value={automation.message_template}
                      onFocus={() => setFocusedTextareaIndex(index)}
                      onBlur={() => setFocusedTextareaIndex(null)}
                      onChange={(e) => handleAutomationChange(index, 'message_template', e.target.value)}
                      placeholder="כתוב כאן את תבנית ההודעה..."
                      rows={6}
                      className="mt-1 text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!automation.is_active}
                    />
                    {automation.is_active && renderPlaceholderButtons(index, automation.placeholders)}
                  </div>
                  
                  {automation.is_active && (
                    <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200 text-indigo-800">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm">משתנים זמינים בתבנית:</h4>
                          <p className="text-xs mt-1 font-mono">
                            {automation.placeholders ? automation.placeholders.join(', ') : 'אין משתנים מיוחדים לאוטומציה זו.'}
                          </p>
                          <p className="text-xs mt-1">
                            הקפד לכתוב את המשתנים בדיוק כפי שהם מופיעים, כולל סוגריים מסולסלים.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex justify-center border-t pt-6">
            <Button 
              onClick={handleSaveAutomations} 
              disabled={isSaving || isLoading}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              שמור את כל הגדרות האוטומציה
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}