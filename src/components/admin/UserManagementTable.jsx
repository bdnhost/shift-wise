import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ShieldCheck, ShieldAlert, Users } from 'lucide-react'; // Added Users import
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function UserManagementTable() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const userList = await User.list('-created_date'); // Sort by most recent
        setUsers(userList);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("שגיאה בטעינת רשימת המשתמשים.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    // Placeholder for role change logic.
    // IMPORTANT: Direct user data modification from client-side SDK for other users is usually restricted.
    // This would typically involve a backend API call that verifies admin privileges.
    // For now, this is a UI placeholder.
    if (window.confirm(`האם אתה בטוח שברצונך לשנות את תפקיד המשתמש ל-${newRole}?`)) {
      try {
        // This is illustrative. `User.update` might not allow changing other users' roles directly from client.
        // await User.update(userId, { role: newRole });
        // await fetchUsers(); // Re-fetch to reflect changes
        alert(`תפקיד משתמש ${userId} שונה ל-${newRole} (סימולציה). יש לממש זאת דרך API מאובטח.`);
        // To simulate change in UI:
        setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));

      } catch (err) {
        console.error("Error changing user role:", err);
        alert("שגיאה בשינוי תפקיד המשתמש.");
      }
    }
  };
  
  const handleDeleteUser = async (userId) => {
    // Placeholder for delete logic.
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${userId}? פעולה זו אינה הפיכה.`)) {
      try {
        // This is illustrative. `User.delete` might be restricted.
        // await User.delete(userId);
        // await fetchUsers(); // Re-fetch to reflect changes
        alert(`משתמש ${userId} נמחק (סימולציה). יש לממש זאת דרך API מאובטח.`);
         // To simulate change in UI:
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("שגיאה במחיקת המשתמש.");
      }
    }
  };


  if (isLoading) {
    return <p>טוען רשימת משתמשים...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שם מלא</TableHead>
            <TableHead>אימייל</TableHead>
            <TableHead>תפקיד</TableHead>
            <TableHead>תאריך הרשמה</TableHead>
            <TableHead className="text-left">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}
                  className={user.role === 'admin' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}
                >
                  {user.role === 'admin' ? 
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> : 
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                  }
                  {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(user.created_date), 'd MMMM yyyy, HH:mm', { locale: he })}</TableCell>
              <TableCell className="text-left">
                <div className="flex gap-2">
                  {user.role !== 'admin' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRoleChange(user.id, 'admin')}
                      className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      <ShieldAlert className="w-4 h-4 ml-1" />
                      הפוך למנהל
                    </Button>
                  )}
                  {user.role === 'admin' && (
                     <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRoleChange(user.id, 'user')}
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                    >
                      <Users className="w-4 h-4 ml-1" />
                      הפוך למשתמש
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    מחק
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && (
        <p className="p-4 text-center text-gray-500">לא נמצאו משתמשים.</p>
      )}
    </div>
  );
}