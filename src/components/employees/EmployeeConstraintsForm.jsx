import React, { useState, useEffect } from 'react';
import { EmployeeConstraint } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit2, CalendarDays, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'd MMMM yyyy', { locale: he });
  } catch (error) {
    return dateString; // Fallback for invalid dates
  }
};

export default function EmployeeConstraintsForm({ employeeId, existingConstraints, onConstraintsUpdate }) {
  const [constraints, setConstraints] = useState(existingConstraints || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConstraint, setNewConstraint] = useState({
    employee_id: employeeId,
    constraint_type: '',
    start_date: '',
    end_date: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    value_numeric: null,
    value_string: '',
    is_active: true,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingConstraintId, setEditingConstraintId] = useState(null); // For future editing

  useEffect(() => {
    setConstraints(existingConstraints || []);
  }, [existingConstraints]);

  const handleInputChange = (field, value) => {
    setNewConstraint(prev => ({ ...prev, [field]: value }));
  };

  const resetNewConstraintForm = () => {
    setNewConstraint({
      employee_id: employeeId,
      constraint_type: '',
      start_date: '',
      end_date: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      value_numeric: null,
      value_string: '',
      is_active: true,
      notes: ''
    });
    setShowAddForm(false);
    setEditingConstraintId(null);
  };
  
  const handleSubmitConstraint = async () => {
    if (!newConstraint.constraint_type) {
      alert('אנא בחר סוג אילוץ.');
      return;
    }
    setIsSubmitting(true);
    try {
      let constraintDataToSave = { ...newConstraint };
      
      // Clean up fields not relevant to the constraint type
      if (constraintDataToSave.constraint_type !== 'UNAVAILABLE_DATE_SPECIFIC') {
        constraintDataToSave.start_date = null;
        constraintDataToSave.end_date = null;
      }
      if (constraintDataToSave.constraint_type !== 'UNAVAILABLE_DAY_RECURRING' && constraintDataToSave.constraint_type !== 'UNAVAILABLE_TIME_SLOT_RECURRING') {
        constraintDataToSave.day_of_week = null;
      }
      if (constraintDataToSave.constraint_type !== 'UNAVAILABLE_TIME_SLOT_RECURRING') {
          constraintDataToSave.start_time = null;
          constraintDataToSave.end_time = null;
      }
      // Add more cleanups for other types as they are implemented

      if (editingConstraintId) {
        // Update logic (for future)
        // const updatedConstraint = await EmployeeConstraint.update(editingConstraintId, constraintDataToSave);
        // const updatedConstraints = constraints.map(c => c.id === editingConstraintId ? updatedConstraint : c);
        // setConstraints(updatedConstraints);
      } else {
        const createdConstraint = await EmployeeConstraint.create(constraintDataToSave);
        const newConstraintsList = [...constraints, createdConstraint];
        setConstraints(newConstraintsList);
        if (onConstraintsUpdate) {
            onConstraintsUpdate(newConstraintsList);
        }
      }
      resetNewConstraintForm();
    } catch (error) {
      console.error('Error saving constraint:', error);
      alert('שגיאה בשמירת האילוץ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConstraint = async (constraintId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק אילוץ זה?')) {
      try {
        await EmployeeConstraint.delete(constraintId);
        const remainingConstraints = constraints.filter(c => c.id !== constraintId);
        setConstraints(remainingConstraints);
         if (onConstraintsUpdate) {
            onConstraintsUpdate(remainingConstraints);
        }
      } catch (error) {
        console.error('Error deleting constraint:', error);
        alert('שגיאה במחיקת האילוץ.');
      }
    }
  };

  // Helper to display constraint details
  const renderConstraintDetails = (constraint) => {
    switch (constraint.constraint_type) {
      case 'UNAVAILABLE_DATE_SPECIFIC':
        return `לא זמין מ-${formatDate(constraint.start_date)} עד ${formatDate(constraint.end_date || constraint.start_date)}`;
      case 'UNAVAILABLE_DAY_RECURRING':
        const daysMap = { sunday: 'ראשון', monday: 'שני', tuesday: 'שלישי', wednesday: 'רביעי', thursday: 'חמישי', friday: 'שישי', saturday: 'שבת' };
        return `לא זמין קבוע ביום ${daysMap[constraint.day_of_week] || constraint.day_of_week}`;
      // Add more cases as other types are implemented
      default:
        return `אילוץ מסוג: ${constraint.constraint_type}`;
    }
  };


  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600"/>
            ניהול אילוצי זמינות
        </CardTitle>
        <CardDescription>
          הגדר כאן ימים או תקופות בהם העובד אינו זמין לעבודה, או אילוצים קבועים אחרים.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {constraints.length === 0 && !showAddForm && (
          <p className="text-gray-500 text-center py-4">לא הוגדרו אילוצים עבור עובד זה.</p>
        )}

        {constraints.map(constraint => (
          <div key={constraint.id} className="mb-3 p-3 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-medium">{renderConstraintDetails(constraint)}</p>
              {constraint.notes && <p className="text-xs text-gray-500">הערה: {constraint.notes}</p>}
            </div>
            <div className="flex gap-2">
              {/* <Button variant="ghost" size="icon" onClick={() => { setEditingConstraintId(constraint.id); setNewConstraint({...constraint}); setShowAddForm(true); }} title="ערוך אילוץ">
                <Edit2 className="w-4 h-4" />
              </Button> */}
              <Button variant="ghost" size="icon" onClick={() => handleDeleteConstraint(constraint.id)} className="text-red-500 hover:text-red-600" title="מחק אילוץ">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="mt-4 w-full" variant="outline">
            <PlusCircle className="w-4 h-4 ml-2" /> הוסף אילוץ חדש
          </Button>
        )}

        {showAddForm && (
          <div className="mt-6 p-4 border rounded-lg bg-white shadow-md">
            <h3 className="text-lg font-semibold mb-4">{editingConstraintId ? 'ערוך אילוץ' : 'הוספת אילוץ חדש'}</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="constraint_type">סוג האילוץ</Label>
                <Select value={newConstraint.constraint_type} onValueChange={(value) => handleInputChange('constraint_type', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר סוג אילוץ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNAVAILABLE_DATE_SPECIFIC">אי זמינות בתאריך/טווח ספציפי</SelectItem>
                    <SelectItem value="UNAVAILABLE_DAY_RECURRING">אי זמינות ביום קבוע בשבוע</SelectItem>
                    {/* Add more constraint types here as they become available */}
                  </SelectContent>
                </Select>
              </div>

              {newConstraint.constraint_type === 'UNAVAILABLE_DATE_SPECIFIC' && (
                <>
                  <div>
                    <Label htmlFor="start_date">תאריך התחלה</Label>
                    <Input type="date" id="start_date" value={newConstraint.start_date} onChange={(e) => handleInputChange('start_date', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="end_date">תאריך סיום (אופציונלי, אם טווח)</Label>
                    <Input type="date" id="end_date" value={newConstraint.end_date} onChange={(e) => handleInputChange('end_date', e.target.value)} />
                  </div>
                </>
              )}

              {newConstraint.constraint_type === 'UNAVAILABLE_DAY_RECURRING' && (
                <div>
                  <Label htmlFor="day_of_week">יום בשבוע</Label>
                  <Select value={newConstraint.day_of_week} onValueChange={(value) => handleInputChange('day_of_week', value)}>
                    <SelectTrigger><SelectValue placeholder="בחר יום" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">ראשון</SelectItem>
                      <SelectItem value="monday">שני</SelectItem>
                      <SelectItem value="tuesday">שלישי</SelectItem>
                      <SelectItem value="wednesday">רביעי</SelectItem>
                      <SelectItem value="thursday">חמישי</SelectItem>
                      <SelectItem value="friday">שישי</SelectItem>
                      <SelectItem value="saturday">שבת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Placeholder for other constraint type fields - to be expanded */}
              {newConstraint.constraint_type && !['UNAVAILABLE_DATE_SPECIFIC', 'UNAVAILABLE_DAY_RECURRING'].includes(newConstraint.constraint_type) && (
                <div className="bg-yellow-50 p-3 rounded-md text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5"/>
                    <span>טופס הגדרה לסוג אילוץ זה יתווסף בקרוב.</span>
                </div>
              )}

              <div>
                <Label htmlFor="notes">הערות (אופציונלי)</Label>
                <Input id="notes" value={newConstraint.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="סיבת האילוץ, פרטים נוספים..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={resetNewConstraintForm} disabled={isSubmitting}>ביטול</Button>
              <Button onClick={handleSubmitConstraint} disabled={isSubmitting || !newConstraint.constraint_type}>
                {isSubmitting ? 'שומר...' : (editingConstraintId ? 'עדכן אילוץ' : 'הוסף אילוץ')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}