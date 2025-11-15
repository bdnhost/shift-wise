# 🎉 מעבר ל-Backend מקומי - 100% חינמי!

## ✅ הושלם בהצלחה!

**ShiftWise MC** עכשיו פועל **לחלוטין מקומי** ללא צורך ב-Backend חיצוני!

---

## 📋 מה השתנה?

### ❌ הוסר:
- **Base44** - Backend מנוהל (שדרש חיבור לbase44.app)
- **Supabase** - Backend as a Service
- תלות בשרתים חיצוניים

### ✅ נוסף:
- **IndexedDB** - מסד נתונים מקומי בדפדפן (דרך localForage)
- **LocalStorage** - אחסון session ו-settings
- **100% Offline** - עובד בלי אינטרנט!
- **100% חינמי** - אין עלויות בכלל!

---

## 🚀 איך להתחיל

### 1. התקנת Dependencies
```bash
npm install
```

### 2. הרצת האפליקציה
```bash
npm run dev
```

### 3. כניסה למערכת
**משתמש Demo (אוטומטי):**
- **Email:** demo@shiftwise.local
- **Password:** demo123

המערכת תיצור אוטומטית:
- ✅ ארגון ברירת מחדל ("החברה שלי")
- ✅ תפקידים בסיסיים (מנהל, טבח, מלצר, קופאי, ניקיון)
- ✅ משתמש demo

---

## 🗄️ איפה הנתונים מאוחסנים?

כל הנתונים שלך נשמרים **מקומית בדפדפן**:

- **IndexedDB:** עובדים, משמרות, ארגונים, תפקידים וכו'
- **LocalStorage:** Sessions, הגדרות
- **מיקום:** `דפדפן > DevTools > Application > IndexedDB > ShiftWise`

### ⚠️ חשוב לדעת:
- הנתונים נשמרים **לכל דפדפן בנפרד**
- מחיקת cache/cookies תמחק את הנתונים
- אין סנכרון בין מכשירים (כרגע)

---

## 📁 מבנה הקבצים החדש

```
src/api/
├── localClient.js         ⭐ NEW - לקוח IndexedDB + ניהול נתונים
├── BaseEntity.js          🔧 UPDATED - CRUD operations מקומיות
├── entities.js            🔧 UPDATED - Entities + Auth מקומי
├── functions.js           🔧 UPDATED - SMS (mock) + PayPal (mock)
├── integrations.js        🔧 UPDATED - File upload (DataURL), CSV parsing
```

### קבצים שנמחקו:
- ~~base44Client.js~~ ❌
- ~~supabaseClient.js~~ ❌

---

## 🔌 תכונות שעובדות Offline

### ✅ עובד מקומית:
- ✅ ניהול עובדים
- ✅ ניהול משמרות
- ✅ לוח משמרות
- ✅ ייצוא CSV
- ✅ ייצוא HTML/PDF
- ✅ ייבוא CSV (parsing client-side!)
- ✅ זיהוי התנגשויות
- ✅ כל התכונות הקיימות

### 🔄 Mock (דורש API חיצוני בייצור):
- 📱 SMS - מצב Mock (מדפיס לקונסול)
- 💰 PayPal - מצב Mock
- 📧 Email - מצב Mock
- 🤖 AI/LLM - מצב Mock

---

## 🛠️ התאמה אישית

### 1. הוספת משתמש חדש

**בקוד (development):**
```javascript
import { User } from '@/api/entities';

// הרשמה
await User.signUp(
  'user@example.com',
  'password123',
  {
    full_name: 'שם המשתמש',
    role: 'admin' // או 'user'
  }
);

// כניסה
await User.signIn('user@example.com', 'password123');
```

**או בקונסול (DevTools):**
```javascript
// פתח DevTools > Console
import('@/api/entities').then(({ User }) => {
  User.signUp('myemail@example.com', 'mypassword', {
    full_name: 'השם שלי',
    role: 'admin'
  });
});
```

### 2. ניקוי נתונים (Reset)

```javascript
import { clearAllData } from '@/api/localClient';
await clearAllData(); // מוחק הכל!
```

### 3. שינוי ארגון ברירת מחדל

ערוך את `src/api/localClient.js`:
```javascript
const defaultOrg = {
  id: generateId(),
  name: 'שם החברה שלך כאן', // <<<< שנה כאן
  created_at: new Date().toISOString(),
  timezone: 'Asia/Jerusalem',
  currency: 'ILS'
};
```

---

## 🔐 אבטחה

### במצב Development (עכשיו):
- ✅ סיסמאות מאוחסנות בטקסט פשוט (LocalStorage)
- ⚠️ **לא מומלץ לייצור!**

### לייצור (המלצות):
1. **הוסף Hashing:** השתמש ב-`bcrypt.js` או `crypto-js`
2. **Session Management:** הוסף timeout לsessions
3. **Encryption:** הצפן נתונים רגישים ב-IndexedDB
4. **Backend:** שקול PocketBase או Firebase לייצור

---

## 📱 SMS - איך להפעיל?

### מצב Mock (ברירת מחדל):
```javascript
// ב-.env
VITE_SMS_PROVIDER=mock
```
הודעות מודפסות לקונסול בלבד.

### מצב Twilio (דורש חשבון):
```javascript
// ב-.env
VITE_SMS_PROVIDER=twilio
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=your_phone_number
```

**⚠️ שים לב:** Twilio credentials לא צריכים להיחשף ב-frontend!
**פתרון:** צור backend endpoint (Netlify Functions, Vercel, Railway) שקורא ל-Twilio.

---

## 💾 גיבוי ושחזור

### ייצוא כל הנתונים:
```javascript
// בקונסול
import localforage from 'localforage';

// יצוא
const backup = {};
const stores = ['employees', 'shifts', 'organizations', /* ... */];
for (const storeName of stores) {
  const store = localforage.createInstance({ storeName });
  const keys = await store.keys();
  backup[storeName] = {};
  for (const key of keys) {
    backup[storeName][key] = await store.getItem(key);
  }
}
console.log(JSON.stringify(backup));
// העתק את ה-JSON ושמור בקובץ
```

### ייבוא מגיבוי:
```javascript
// טען את ה-JSON
const backup = { /* ... */ };

for (const [storeName, items] of Object.entries(backup)) {
  const store = localforage.createInstance({ storeName });
  for (const [key, value] of Object.entries(items)) {
    await store.setItem(key, value);
  }
}
```

---

## 🌐 העלאה לאינטרנט

האפליקציה עובדת ב-Static Hosting!

### Netlify (חינם):
```bash
npm run build
# גרור את תיקיית dist/ ל-Netlify
```

### Vercel (חינם):
```bash
npm i -g vercel
vercel
```

### GitHub Pages (חינם):
1. הוסף ב-`vite.config.js`:
   ```javascript
   base: '/shift-wise/'
   ```
2. Build והעלה:
   ```bash
   npm run build
   git subtree push --prefix dist origin gh-pages
   ```

---

## ❓ שאלות נפוצות

### ש: הנתונים שלי נעלמו!
**ת:** בדוק אם לא מחקת cache. הנתונים נשמרים בדפדפן.

### ש: איך אני עובר בין מחשבים?
**ת:** כרגע - צריך לייצא/ייבא ידנית. בעתיד אפשר להוסיף sync דרך PocketBase.

### ש: האם זה בטוח?
**ת:** למצב פיתוח - כן. לייצור - צריך לשדרג את האבטחה (hash passwords, etc).

### ש: איך מוסיפים backend אמיתי?
**ת:** אפשר להחליף ל-PocketBase (חינמי, self-hosted) או Firebase.

---

## 🎯 מה הלאה?

### שדרוגים אפשריים:
1. **PocketBase Backend** - self-hosted, חינמי לחלוטין
2. **Firebase** - sync בין מכשירים
3. **PWA** - התקנה כאפליקציה
4. **Export/Import UI** - ממשק גרפי לגיבויים
5. **Encryption** - הצפנת נתונים רגישים

---

## 📞 תמיכה

יש בעיות? פתח issue ב-GitHub!

---

**גרסה:** 3.0.0 - Local-First Edition
**תאריך:** נובמבר 2025
**רישיון:** Open Source

🎉 **כעת ShiftWise MC הוא 100% חינמי וללא תלות בשירותים חיצוניים!**
