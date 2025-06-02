
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { sendSms } from '@/api/functions';
import * as User from '@/api/functions/User'; // Assuming User utility path

export default function TestSms() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    recipient: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("TestSms - user not authenticated:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/'; // Redirect to Index page
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear previous response/error when user types
    if (response || error) {
      setResponse(null);
      setError(null);
    }
  };

  const handleSendTest = async () => {
    if (!formData.recipient.trim() || !formData.message.trim()) {
      setError('יש למלא גם מספר נמען וגם תוכן הודעה.');
      return;
    }

    setIsSending(true);
    setError(null);
    setResponse(null);

    try {
      const result = await sendSms({ 
        recipient: formData.recipient.trim(), 
        msg: formData.message.trim() 
      });
      
      setResponse(result.data);
      
      if (result.data && result.data.status > 0) {
        console.log(`SMS נשלח בהצלחה ל-${result.data.status} נמענים.`);
      } else {
        console.warn(`שגיאה בשליחת SMS:`, result.data);
      }
    } catch (err) {
      console.error('Error calling sendSms function:', err);
      setError(`שגיאה בקריאה לפונקציית SMS: ${err.message || 'שגיאה לא ידועה'}`);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusColor = (status) => {
    if (status > 0) return 'text-green-700 bg-green-50 border-green-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status) => {
    if (status > 0) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const interpretStatusCode = (status) => {
    switch (status) {
      case 0: return 'שגיאה כללית';
      case -1: return 'מפתח, שם משתמש או סיסמה שגויים';
      case -2: return 'שם או מספר שולח ההודעה שגוי';
      case -3: return 'לא נמצאו נמענים';
      case -4: return 'לא ניתן לשלוח הודעה, יתרת הודעות פנויות נמוכה';
      case -5: return 'הודעה לא מתאימה';
      case -6: return 'צריך לאמת מספר שולח';
      default: return status > 0 ? `הודעה נשלחה בהצלחה ל-${status} נמענים` : 'קוד שגיאה לא ידוע';
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען דף בדיקת SMS...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render content
  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          בדיקת מערכת SMS
        </h1>
        <p className="text-gray-600">שלח הודעת בדיקה כדי לוודא שמערכת ה-SMS פועלת כראוי</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            שליחת הודעת בדיקה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="recipient">מספר נמען</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="למשל: 0501234567 (או מספרים מופרדים ב-;)"
              value={formData.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              className="text-left font-mono"
              dir="ltr"
            />
            <p className="text-xs text-gray-500">
              ניתן לשלוח למספר נמענים על ידי הפרדה בסימן ; (למשל: 0501234567;0509876543)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">תוכן ההודעה</Label>
            <Textarea
              id="message"
              placeholder="כתוב כאן את הודעת הבדיקה..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {formData.message.length} תווים (מומלץ עד 160 תווים לעברית)
            </p>
          </div>

          <Button
            onClick={handleSendTest}
            disabled={isSending || !formData.recipient.trim() || !formData.message.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                שולח הודעה...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                שלח הודעת בדיקה
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Response Display */}
      {response && (
        <Card className={`border-2 ${getStatusColor(response.status)}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {getStatusIcon(response.status)}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">תגובת שרת SMS</h3>
                <div className="space-y-2">
                  <div>
                    <strong>סטטוס:</strong> {response.status}
                  </div>
                  <div>
                    <strong>הודעה:</strong> {response.message}
                  </div>
                  <div className="text-sm bg-white/50 p-2 rounded border">
                    <strong>פירוש:</strong> {interpretStatusCode(response.status)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            <strong>שגיאה:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            הוראות בדיקה
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• ודא שמספר הטלפון שאליו אתה שולח הוא מספר תקין (בפורמט 10 ספרות החל ב-05)</li>
            <li>• אם אתה בחשבון חינמי (10 הודעות ראשונות), השולח חייב להיות המספר איתו נרשמת</li>
            <li>• אם קיבלת קוד שגיאה שלילי, בדוק את פירוש הקוד למעלה</li>
            <li>• הודעה מוצלחת תחזיר מספר חיובי (כמות הנמענים שקיבלו את ההודעה)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
