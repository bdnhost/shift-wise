import React, { useState, useEffect } from 'react';
import { JobRole } from '@/api/entities';
import { Organization } from '@/api/entities'; // To get current org (eventually)
import { User } from '@/api/entities'; // To get current user for org_id
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, ListChecks, Copy, Filter, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const JobRoleForm = ({ role, onSubmit, onCancel, organizationId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry_category: '',
    hourly_rate_suggestion: '',
    organization_id: organizationId, // Set the org ID for new roles
    is_template: false, // Org-specific roles are not templates
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        industry_category: role.industry_category || '',
        hourly_rate_suggestion: role.hourly_rate_suggestion || '',
        organization_id: role.organization_id || organizationId,
        is_template: role.is_template || false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        industry_category: '',
        hourly_rate_suggestion: '',
        organization_id: organizationId,
        is_template: false,
      });
    }
  }, [role, organizationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        hourly_rate_suggestion: formData.hourly_rate_suggestion ? parseFloat(formData.hourly_rate_suggestion) : null,
      };
      await onSubmit(dataToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader>
        <CardTitle>{role ? 'עריכת תפקיד' : 'הוספת תפקיד חדש'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="role_name">שם התפקיד</Label>
            <Input id="role_name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role_description">תיאור</Label>
            <Textarea id="role_description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="role_industry">קטגוריית תעשייה</Label>
              <Select value={formData.industry_category} onValueChange={(value) => setFormData({ ...formData, industry_category: value })} required>
                <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="מסעדות">מסעדות</SelectItem>
                  <SelectItem value="קמעונאות">קמעונאות</SelectItem>
                  <SelectItem value="יופי ובריאות">יופי ובריאות</SelectItem>
                  <SelectItem value="מלונאות ואירוח">מלונאות ואירוח</SelectItem>
                  <SelectItem value="תחבורה ולוגיסטיקה">תחבורה ולוגיסטיקה</SelectItem>
                  <SelectItem value="שירותים">שירותים</SelectItem>
                  <SelectItem value="בריאות">בריאות</SelectItem>
                  <SelectItem value="חינוך">חינוך</SelectItem>
                  <SelectItem value="תעשייה וייצור">תעשייה וייצור</SelectItem>
                  <SelectItem value="בידור ואירועים">בידור ואירועים</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="role_hourly_rate">הצעת שכר לשעה (אופציונלי)</Label>
              <Input id="role_hourly_rate" type="number" min="0" step="0.01" value={formData.hourly_rate_suggestion} onChange={(e) => setFormData({ ...formData, hourly_rate_suggestion: e.target.value })} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>ביטול</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'שומר...' : (role ? 'שמור שינויים' : 'הוסף תפקיד')}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default function JobRoleManagement() {
  const [organizationRoles, setOrganizationRoles] = useState([]);
  const [templateRoles, setTemplateRoles] = useState([]);
  const [filteredTemplateRoles, setFilteredTemplateRoles] = useState([]); // New state for filtered templates
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [currentOrganization, setCurrentOrganization] = useState(null); // To store the current org's ID
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState(''); // New state for industry filter

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch current organization (assuming one org per user/app for now)
        // This logic might need adjustment for multi-tenancy or if user is not directly tied to one org
        const orgs = await Organization.list(); // Simplified: assumes user is part of an org or we fetch a default
        if (orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
          const orgId = orgs[0].id;
          const allRoles = await JobRole.list();
          setOrganizationRoles(allRoles.filter(role => role.organization_id === orgId && !role.is_template));
          
          // Get all template roles
          const allTemplateRoles = allRoles.filter(role => role.is_template || !role.organization_id);
          setTemplateRoles(allTemplateRoles);
          
          // Set default filter to organization's industry
          const orgIndustry = orgs[0].industry;
          setSelectedIndustryFilter(orgIndustry || 'all');
          
          // Filter template roles based on selected industry (initially org's industry)
          applyIndustryFilter(allTemplateRoles, orgIndustry || 'all');
        } else {
          // No organization found, perhaps load only global templates
           const allRoles = await JobRole.list();
           const allTemplateRoles = allRoles.filter(role => role.is_template || !role.organization_id);
           setTemplateRoles(allTemplateRoles);
           setSelectedIndustryFilter('all');
           setFilteredTemplateRoles(allTemplateRoles); // Show all if no organization
           setOrganizationRoles([]); // No org-specific roles
           console.warn("No organization found to associate roles with.");
        }
      } catch (error) {
        console.error("Error fetching job roles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Function to apply industry filter
  const applyIndustryFilter = (allTemplates, selectedIndustry) => {
    if (selectedIndustry === 'all') {
      setFilteredTemplateRoles(allTemplates);
    } else {
      const relevantTemplates = allTemplates.filter(role => 
        role.industry_category === selectedIndustry || 
        role.industry_category === "גלובלי" || // Keep global templates
        !role.industry_category // Fallback for roles without category defined
      );
      setFilteredTemplateRoles(relevantTemplates);
    }
  };

  // Handle industry filter change
  const handleIndustryFilterChange = (selectedIndustry) => {
    setSelectedIndustryFilter(selectedIndustry);
    applyIndustryFilter(templateRoles, selectedIndustry);
  };

  const refreshRoles = async () => {
    setIsLoading(true);
    try {
      const orgId = currentOrganization?.id;
      const allRoles = await JobRole.list();
      
      if (orgId) {
        setOrganizationRoles(allRoles.filter(role => role.organization_id === orgId && !role.is_template));
      }
      
      const allTemplateRoles = allRoles.filter(role => role.is_template || !role.organization_id);
      setTemplateRoles(allTemplateRoles);
      
      // Re-apply the current filter
      applyIndustryFilter(allTemplateRoles, selectedIndustryFilter);
    } catch (error) {
      console.error("Error refreshing job roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRole = async (roleData) => {
    try {
      if (editingRole) {
        await JobRole.update(editingRole.id, roleData);
      } else {
        await JobRole.create({ ...roleData, organization_id: currentOrganization?.id }); // Ensure org_id is set
      }
      setShowForm(false);
      setEditingRole(null);
      refreshRoles();
    } catch (error) {
      console.error("Error saving job role:", error);
      alert("שגיאה בשמירת התפקיד.");
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק תפקיד זה?")) {
      try {
        await JobRole.delete(roleId);
        refreshRoles();
      } catch (error) {
        console.error("Error deleting job role:", error);
        alert("שגיאה במחיקת התפקיד.");
      }
    }
  };

  const handleAddTemplateToOrg = async (templateRole) => {
     if (!currentOrganization) {
        alert("יש להגדיר ארגון תחילה.");
        return;
    }
    if (window.confirm(`האם להוסיף את תבנית התפקיד "${templateRole.name}" לתפקידי הארגון שלך?`)) {
      try {
        await JobRole.create({
          name: templateRole.name,
          description: templateRole.description,
          industry_category: templateRole.industry_category,
          hourly_rate_suggestion: templateRole.hourly_rate_suggestion,
          organization_id: currentOrganization.id, // Link to current org
          is_template: false, // Copied role is not a template itself
        });
        refreshRoles();
      } catch (error) {
        console.error("Error adding template role to organization:", error);
        alert("שגיאה בהוספת תבנית התפקיד לארגון.");
      }
    }
  };

  // Industry options for the filter
  const industryOptions = [
    { value: 'all', label: 'כל התחומים' },
    { value: 'מסעדות', label: 'מסעדות' },
    { value: 'קמעונאות', label: 'קמעונאות' },
    { value: 'יופי ובריאות', label: 'יופי ובריאות' },
    { value: 'מלונאות ואירוח', label: 'מלונאות ואירוח' },
    { value: 'תחבורה ולוגיסטיקה', label: 'תחבורה ולוגיסטיקה' },
    { value: 'שירותים', label: 'שירותים' },
    { value: 'בריאות', label: 'בריאות' },
    { value: 'חינוך', label: 'חינוך' },
    { value: 'תעשייה וייצור', label: 'תעשייה וייצור' },
    { value: 'בידור ואירועים', label: 'בידור ואירועים' },
    { value: 'אחר', label: 'אחר' }
  ];

  if (isLoading && !currentOrganization && organizationRoles.length === 0 && templateRoles.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-1/3 mt-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (!currentOrganization && !isLoading) {
     return (
        <Card className="bg-yellow-50 border-yellow-300">
            <CardHeader>
                <CardTitle>הגדרת ארגון נדרשת</CardTitle>
            </CardHeader>
            <CardContent>
                <p>עליך להגדיר תחילה את פרטי הארגון שלך לפני שתוכל לנהל תפקידים ספציפיים לארגון.</p>
                <p className="mt-2">בשלב זה, תוכל רק לצפות בתבניות תפקידים גלובליות.</p>
            </CardContent>
        </Card>
     )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">ניהול תפקידים בארגון</h3>
        {currentOrganization && (
            <Button onClick={() => { setEditingRole(null); setShowForm(true); }}>
            <PlusCircle className="w-4 h-4 ml-2" /> הוסף תפקיד חדש לארגון
            </Button>
        )}
      </div>

      {showForm && currentOrganization && (
        <JobRoleForm
          role={editingRole}
          onSubmit={handleSaveRole}
          onCancel={() => { setShowForm(false); setEditingRole(null); }}
          organizationId={currentOrganization.id}
        />
      )}

      {isLoading && currentOrganization && organizationRoles.length === 0 ? (
        <p>טוען תפקידים ארגוניים...</p>
      ) : !isLoading && currentOrganization && organizationRoles.length === 0 && !showForm ? (
        <p className="text-gray-500 text-center py-4">לא הוגדרו תפקידים ספציפיים לארגון זה עדיין.</p>
      ) : (
        currentOrganization && organizationRoles.map(role => (
          <Card key={role.id} className="bg-gray-50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}><Edit2 className="w-4 h-4 mr-1" /> ערוך</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteRole(role.id)}><Trash2 className="w-4 h-4 mr-1" /> מחק</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <p>{role.description || "אין תיאור"}</p>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span>קטגוריה: {role.industry_category}</span>
                {role.hourly_rate_suggestion && <span>שכר מוצע: ₪{role.hourly_rate_suggestion}/שעה</span>}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="mt-8 pt-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">תבניות תפקידים</h3>
          <div className="flex items-center gap-4">
            {/* Industry Filter Selector */}
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <Label htmlFor="industry-filter" className="text-sm text-gray-600">הצג תפקידים עבור:</Label>
              <Select value={selectedIndustryFilter} onValueChange={handleIndustryFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="בחר תחום" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Info message about current filter */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Filter className="w-4 h-4" />
            {selectedIndustryFilter === 'all' ? (
              <span>מוצגות כל תבניות התפקידים הזמינות</span>
            ) : (
              <span>
                מוצגות תבניות תפקידים עבור תחום: <strong>{industryOptions.find(opt => opt.value === selectedIndustryFilter)?.label}</strong>
                {currentOrganization?.industry === selectedIndustryFilter && (
                  <span className="mr-2 text-blue-600">(תחום הארגון שלך)</span>
                )}
              </span>
            )}
          </div>
          {selectedIndustryFilter !== 'all' && (
            <p className="text-xs text-blue-600 mt-1">
              ניתן לשנות את התצוגה כדי לחקור תפקידים מתחומים אחרים. תחום הפעילות הקבוע של הארגון נמצא בהגדרות הארגון.
            </p>
          )}
        </div>
        
        {isLoading && filteredTemplateRoles.length === 0 ? (
          <p>טוען תבניות תפקידים...</p>
        ) : !isLoading && filteredTemplateRoles.length === 0 ? (
           <div className="text-center py-8">
             <p className="text-gray-500 mb-4">
               לא נמצאו תבניות תפקידים עבור התחום הנבחר.
             </p>
             {selectedIndustryFilter !== 'all' && (
               <Button variant="outline" onClick={() => handleIndustryFilterChange('all')}>
                 הצג את כל התבניות הזמינות
               </Button>
             )}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplateRoles.map(role => (
              <Card key={role.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center gap-2">
                    {role.name}
                    {role.industry_category && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {role.industry_category}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-600 space-y-1">
                  <p className="min-h-[40px] text-sm">{role.description || "אין תיאור"}</p>
                  {role.hourly_rate_suggestion && (
                    <p className="font-medium text-green-600">שכר מוצע: ₪{role.hourly_rate_suggestion}/שעה</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleAddTemplateToOrg(role)}
                    disabled={!currentOrganization}
                  >
                    <Copy className="w-3 h-3 ml-2" /> הוסף לארגון שלי
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Show count of available vs displayed templates */}
        {selectedIndustryFilter !== 'all' && templateRoles.length > filteredTemplateRoles.length && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>מוצגים {filteredTemplateRoles.length} מתוך {templateRoles.length} תבניות זמינות</strong> - 
              תבניות שמותאמות לתחום הנבחר. 
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-700 underline ml-1"
                onClick={() => handleIndustryFilterChange('all')}
              >
                הצג את כל התבניות
              </Button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}