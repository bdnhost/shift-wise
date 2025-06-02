
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Organization } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, User as UserIcon, Building, Bell, Shield, CreditCard, Briefcase, MessageSquare } from "lucide-react";
import JobRoleManagement from "../components/settings/JobRoleManagement";
import SmsAutomationManagement from "../components/settings/SmsAutomationManagement";
import PayPalCheckout from "../components/billing/PayPalCheckout"; // Add this import

// Utility function to create page URLs
const createPageUrl = (pageName) => {
  switch (pageName) {
    case "Index":
      return "/"; // Assuming the landing page is at the root
    default:
      return "/"; // Fallback
  }
};

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null); // To store the current org ID

  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: ""
  });
  
  const [orgForm, setOrgForm] = useState({
    name: "",
    description: "",
    industry: "",
    size: "",
    address: "",
    phone: "",
    subscription_plan: "free",
    settings: {
      timezone: "Asia/Jerusalem",
      currency: "ILS",
      work_week: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
      notifications_enabled: true
    }
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // Add this state
  const [selectedPlan, setSelectedPlan] = useState(null); // Add this state

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      setUserForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "", // Assuming user entity might have phone
        role: user.role || ""
      });

      // Try to load organization data
      // For RLS, we assume a user is primarily associated with ONE organization for now.
      // Or, if multiple, they select one. Here, we take the first one found.
      const orgs = await Organization.filter({}); // Fetch all, then potentially filter by user link if exists
      if (orgs.length > 0) {
        // TODO: Implement logic if user can be part of multiple orgs.
        // For now, take the first organization associated with the app/user.
        // A simple way for a single-org-per-app setup is to just fetch the first (or only) one.
        const currentOrg = orgs[0]; // This is a simplification.
        setOrganization(currentOrg);
        setCurrentOrganizationId(currentOrg.id); // Set the current organization ID
        setOrgForm({
          name: currentOrg.name || "",
          description: currentOrg.description || "",
          industry: currentOrg.industry || "",
          size: currentOrg.size || "",
          address: currentOrg.address || "",
          phone: currentOrg.phone || "",
          subscription_plan: currentOrg.subscription_plan || "free",
          settings: currentOrg.settings || {
            timezone: "Asia/Jerusalem",
            currency: "ILS",
            work_week: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
            notifications_enabled: true
          }
        });
      } else {
        console.log("No organization found. User can create one.");
        setCurrentOrganizationId(null); // No org, so no ID
      }
    } catch (error) {
      console.error("Error loading user/organization data:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/';
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData(userForm);
      alert("פרטי המשתמש נשמרו בהצלחה");
      await loadData();
    } catch (error) {
      console.error("Error saving user data:", error);
      alert("שגיאה בשמירת הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrgSave = async () => {
    setIsSaving(true);
    try {
      let savedOrg;
      if (organization) {
        savedOrg = await Organization.update(organization.id, orgForm);
      } else {
        // When creating a new org, it's implicitly for the current context/user.
        // The organization_id itself is not set on the Organization entity.
        savedOrg = await Organization.create(orgForm);
      }
      setOrganization(savedOrg);
      setCurrentOrganizationId(savedOrg.id); // Update current org ID after save/create
      alert("פרטי הארגון נשמרו בהצלחה");
      // No need to call loadData() again unless other dependent data needs refresh
    } catch (error) {
      console.error("Error saving organization data:", error);
      alert("שגיאה בשמירת הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      // Redirect to the landing page (Index page)
      window.location.href = createPageUrl("Index"); 
    } catch (error) {
      console.error("Logout error:", error);
      alert("שגיאה במהלך ההתנתקות. נסה שוב.");
    }
  };

  const handleUpgradeSuccess = async (paymentData) => {
    try {
      alert(`התשלום בוצע בהצלחה! מנוי ${paymentData.planId} הופעל.`);
      setShowUpgradeModal(false);
      setSelectedPlan(null);
      await loadData(); // Reload to get updated subscription info
    } catch (error) {
      console.error('Error handling upgrade success:', error);
    }
  };

  const handleUpgradeError = (error) => {
    console.error('Upgrade error:', error);
    alert('אירעה שגיאה בתהליך התשלום. אנא נסה שוב.');
  };

  const planPrices = {
    starter: { amount: 29, currency: 'ILS', name: 'בסיסי' },
    pro: { amount: 99, currency: 'ILS', name: 'מתקדם' },
    enterprise: { amount: 249, currency: 'ILS', name: 'ארגוני' }
  };

  // PayPal Client ID - replace with your actual production client ID
  const PAYPAL_CLIENT_ID = 'AS1_VuRCX3D9fR4WUbmp6rnf2P15qPDpbGEeSwcc55PcTvw-WRGhPMoBaYULhzFnDsrO2GqErX66lRWD';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render content (this should only happen if `loadData` didn't redirect due to 401, but the user is indeed null for some other reason)
  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">מפנה לדף הכניסה...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
        <p className="text-gray-600 mt-1">נהל את ההגדרות שלך ושל הארגון</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            פרופיל
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            ארגון
          </TabsTrigger>
          <TabsTrigger value="job_roles" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            תפקידים
          </TabsTrigger>
          <TabsTrigger value="sms_automations" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            אוטומציות SMS
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            התראות
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            אבטחה
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            חיוב
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                פרטים אישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">שם מלא</Label>
                  <Input
                    id="full_name"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    placeholder="הכנס שם מלא"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">כתובת מייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="example@email.com"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="050-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">תפקיד במערכת</Label>
                  <Input
                    id="role"
                    value={userForm.role}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={handleLogout} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                  התנתק
                </Button>
                <Button onClick={handleUserSave} disabled={isSaving}>
                  <Save className="w-4 h-4 ml-2" />
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                פרטי הארגון
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">שם הארגון</Label>
                  <Input
                    id="org_name"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                    placeholder="הכנס שם הארגון"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">תחום פעילות</Label>
                  <Select
                    value={orgForm.industry}
                    onValueChange={(value) => setOrgForm({...orgForm, industry: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר תחום פעילות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="מסעדות">מסעדות</SelectItem>
                      <SelectItem value="קמעונאות">קמעונאות</SelectItem>
                      <SelectItem value="שירותים">שירותים</SelectItem>
                      <SelectItem value="בריאות">בריאות</SelectItem>
                      <SelectItem value="חינוך">חינוך</SelectItem>
                      <SelectItem value="אחר">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">גודל הארגון</Label>
                  <Select
                    value={orgForm.size}
                    onValueChange={(value) => setOrgForm({...orgForm, size: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר גודל ארגון" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 עובדים</SelectItem>
                      <SelectItem value="6-15">6-15 עובדים</SelectItem>
                      <SelectItem value="16-50">16-50 עובדים</SelectItem>
                      <SelectItem value="51+">51+ עובדים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_phone">טלפון</Label>
                  <Input
                    id="org_phone"
                    value={orgForm.phone}
                    onChange={(e) => setOrgForm({...orgForm, phone: e.target.value})}
                    placeholder="03-1234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({...orgForm, address: e.target.value})}
                  placeholder="הכנס כתובת מלאה"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור הארגון</Label>
                <Input
                  id="description"
                  value={orgForm.description}
                  onChange={(e) => setOrgForm({...orgForm, description: e.target.value})}
                  placeholder="תיאור קצר על הארגון"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleOrgSave} disabled={isSaving}>
                  <Save className="w-4 h-4 ml-2" />
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Roles Tab */}
        <TabsContent value="job_roles">
          <JobRoleManagement />
        </TabsContent>

        {/* SMS Automations Tab */}
        <TabsContent value="sms_automations">
          <SmsAutomationManagement />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                הגדרות התראות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications_enabled">התראות מופעלות</Label>
                  <p className="text-sm text-gray-600">קבל התראות על שינויים במשמרות</p>
                </div>
                <Switch
                  id="notifications_enabled"
                  checked={orgForm.settings.notifications_enabled}
                  onCheckedChange={(checked) => 
                    setOrgForm({
                      ...orgForm, 
                      settings: {...orgForm.settings, notifications_enabled: checked}
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>ימי עבודה</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {key: "sunday", label: "ראשון"},
                    {key: "monday", label: "שני"},
                    {key: "tuesday", label: "שלישי"},
                    {key: "wednesday", label: "רביעי"},
                    {key: "thursday", label: "חמישי"},
                    {key: "friday", label: "שישי"},
                    {key: "saturday", label: "שבת"}
                  ].map(day => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day.key}
                        checked={orgForm.settings.work_week.includes(day.key)}
                        onChange={(e) => {
                          const updatedWorkWeek = e.target.checked
                            ? [...orgForm.settings.work_week, day.key]
                            : orgForm.settings.work_week.filter(d => d !== day.key);
                          setOrgForm({
                            ...orgForm,
                            settings: {...orgForm.settings, work_week: updatedWorkWeek}
                          });
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={day.key} className="text-sm">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleOrgSave} disabled={isSaving}>
                  <Save className="w-4 h-4 ml-2" />
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                אבטחה ופרטיות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">אימות משתמש</h3>
                <p className="text-blue-700 text-sm">
                  המערכת משתמשת באימות Google OAuth לאבטחה מקסימלית.
                  לא נשמרים סיסמאות במערכת שלנו.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">היסטוריית התחברויות</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">התחברות נוכחית</p>
                      <p className="text-sm text-gray-600">IP: 192.168.1.1 • {new Date().toLocaleString('he-IL')}</p>
                    </div>
                    <span className="text-green-600 text-sm font-medium">פעיל</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleLogout} variant="destructive">
                  התנתק מכל המכשירים
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                חיוב ומנוי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">תוכנית נוכחית</h3>
                    <p className="text-gray-600">
                      {orgForm.subscription_plan === 'free' ? 'חינם' : 
                       orgForm.subscription_plan === 'starter' ? 'בסיסי' :
                       orgForm.subscription_plan === 'pro' ? 'מתקדם' : 'ארגוני'}
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900">
                      {orgForm.subscription_plan === 'free' ? '₪0' : 
                       orgForm.subscription_plan === 'starter' ? '₪29' :
                       orgForm.subscription_plan === 'pro' ? '₪99' : '₪249'}
                    </div>
                    <p className="text-gray-600">לחודש</p>
                  </div>
                </div>
                
                {orgForm.subscription_plan === 'free' && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      אתה משתמש בתוכנית החינמית. שדרג כדי לגשת לתכונות מתקדמות.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedPlan('starter');
                          setShowUpgradeModal(true);
                        }}
                      >
                        שדרג לבסיסי (₪29/חודש)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan('pro');
                          setShowUpgradeModal(true);
                        }}
                      >
                        שדרג למתקדם (₪99/חודש)
                      </Button>
                    </div>
                  </div>
                )}

                {orgForm.subscription_plan !== 'free' && orgForm.subscription_plan !== 'enterprise' && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      המנוי שלך פעיל. רוצה לשדרג לתוכנית גבוהה יותר?
                    </p>
                    {orgForm.subscription_plan === 'starter' && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan('pro');
                          setShowUpgradeModal(true);
                        }}
                      >
                        שדרג למתקדם (₪99/חודש)
                      </Button>
                    )}
                    {(orgForm.subscription_plan === 'starter' || orgForm.subscription_plan === 'pro') && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedPlan('enterprise');
                          setShowUpgradeModal(true);
                        }}
                      >
                        שדרג לארגוני (₪249/חודש)
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">היסטוריית חיובים</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  אין היסטוריית חיובים עדיין
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">שיטת תשלום</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  לא הוגדרה שיטת תשלום
                </div>
                <Button variant="outline">
                  הוסף כרטיס אשראי
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              שדרוג לתוכנית {planPrices[selectedPlan].name}
            </h3>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                אתה עומד לשדרג לתוכנית {planPrices[selectedPlan].name}
              </p>
              <div className="text-2xl font-bold text-blue-600">
                ₪{planPrices[selectedPlan].amount} לחודש
              </div>
            </div>
            
            {organization && currentOrganizationId && ( // Ensure currentOrganizationId is also available
              <PayPalCheckout
                planId={selectedPlan}
                amount={planPrices[selectedPlan].amount}
                currency={planPrices[selectedPlan].currency}
                organizationId={currentOrganizationId} // Use currentOrganizationId
                paypalClientId={PAYPAL_CLIENT_ID}
                onSuccess={handleUpgradeSuccess}
                onError={handleUpgradeError}
              />
            )}
            
            <div className="mt-4 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPlan(null);
                }}
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
