# 🚀 ShiftWise MC - מערכת ניהול משמרות

> **Local-First Edition** - עובד לחלוטין מקומי, ללא צורך בשרת!

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/bdnhost/shift-wise)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-success.svg)](https://github.com/bdnhost/shift-wise)

---

## ✨ תכונות עיקריות

- ✅ **ניהול עובדים** - הוספה, עריכה, מחיקה, ייבוא מCSV
- ✅ **ניהול משמרות** - 3 תצוגות (נהר הזמן, כרטיסים, לוח שעות)
- ✅ **לוח משמרות** - תצוגה שבועית/חודשית
- ✅ **זיהוי התנגשויות** - מזהה אוטומטית משמרות מתנגשות
- ✅ **ייצוא מתקדם** - CSV, HTML/PDF להדפסה
- ✅ **תפקידים דינמיים** - הוספת תפקידים מותאמים אישית
- ✅ **אילוצי עובדים** - ניהול זמינות ואי-זמינות
- ✅ **SMS (Mock)** - שליחת הודעות (מצב הדגמה)
- ✅ **100% Offline** - עובד בלי אינטרנט!

---

## 🚀 התקנה מהירה

### דרישות מקדימות
- Node.js 18+
- npm או yarn

### צעדים:

```bash
# 1. Clone the repository
git clone https://github.com/bdnhost/shift-wise.git
cd shift-wise

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### 🔐 כניסה ראשונית
- **Email:** demo@shiftwise.local
- **Password:** demo123

---

## 📦 טכנולוגיות

### Frontend:
- **React 18** - ספריית UI
- **Vite** - Build tool מהיר
- **Tailwind CSS** - עיצוב
- **Radix UI** - קומפוננטות נגישות
- **React Router** - ניווט
- **date-fns** - ניהול תאריכים
- **Framer Motion** - אנימציות

### Storage:
- **localForage** - IndexedDB wrapper
- **IndexedDB** - מסד נתונים מקומי
- **LocalStorage** - Sessions & Settings

### Tools:
- **Sonner** - Toast notifications
- **React Hook Form** - טפסים
- **Zod** - Validation
- **Lucide React** - אייקונים

---

## 🗂️ מבנה הפרויקט

```
shift-wise/
├── src/
│   ├── api/                  # Backend layer (Local)
│   │   ├── localClient.js    # IndexedDB client
│   │   ├── BaseEntity.js     # CRUD operations
│   │   ├── entities.js       # Entity definitions
│   │   ├── functions.js      # SMS, PayPal (mock)
│   │   └── integrations.js   # File upload, etc.
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components
│   │   ├── employees/        # Employee components
│   │   ├── shifts/           # Shift components
│   │   └── ErrorBoundary.jsx # Error handling
│   ├── pages/                # Page components
│   ├── utils/                # Utilities
│   │   ├── shiftUtils.js     # Shift helpers
│   │   └── exportUtils.js    # Export functions
│   └── App.jsx               # Main app component
├── public/                   # Static assets
├── IMPROVEMENTS.md           # v2.0 improvements
├── MIGRATION_TO_LOCAL.md     # Migration guide
└── README.md                 # This file
```

---

## 📖 תיעוד נוסף

- **[IMPROVEMENTS.md](IMPROVEMENTS.md)** - תיעוד שיפורים v2.0
- **[MIGRATION_TO_LOCAL.md](MIGRATION_TO_LOCAL.md)** - מדריך מעבר ל-Local Backend

---

## 🛠️ פקודות npm

```bash
# Development
npm run dev        # הרצת dev server

# Production
npm run build      # בנייה לפרודקשן
npm run preview    # תצוגה מקדימה של build

# Linting
npm run lint       # בדיקת קוד
```

---

## 🌐 פרסום (Deployment)

האפליקציה היא **Static Site** ועובדת על כל שירות hosting:

### Netlify:
```bash
npm run build
# העלה את תיקיית dist/
```

### Vercel:
```bash
npm i -g vercel
vercel
```

### GitHub Pages:
```bash
# vite.config.js: base: '/shift-wise/'
npm run build
git subtree push --prefix dist origin gh-pages
```

---

## 🔒 אבטחה

### Development (עכשיו):
- סיסמאות בטקסט פשוט
- אחסון מקומי בלבד
- ללא הצפנה

### Production (המלצות):
1. השתמש ב-`bcrypt.js` ל-hash passwords
2. הוסף session timeout
3. הצפן נתונים רגישים
4. שקול backend אמיתי (PocketBase/Firebase)

---

## 💾 גיבוי ושחזור

### ייצוא נתונים:
```javascript
// בקונסול הדפדפן
import('@/api/localClient').then(({ clearAllData }) => {
  // Export data here
});
```

### ייבוא נתונים:
ראה [MIGRATION_TO_LOCAL.md](MIGRATION_TO_LOCAL.md#-גיבוי-ושחזור)

---

## 🐛 דיווח באגים

מצאת באג? [פתח Issue](https://github.com/bdnhost/shift-wise/issues)

---

## 🤝 תרומה

Pull Requests מתקבלים בברכה!

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📜 רישיון

MIT License - ראה [LICENSE](LICENSE)

---

## 👏 תודות

- **Base44** - הפלטפורמה הראשונית (הוחלפה ב-Local Storage)
- **Radix UI** - קומפוננטות נגישות מעולות
- **Tailwind** - מערכת עיצוב מהירה
- **Community** - תודה לכל התורמים!

---

## 📧 צור קשר

- **GitHub:** [bdnhost/shift-wise](https://github.com/bdnhost/shift-wise)
- **Issues:** [Report bugs](https://github.com/bdnhost/shift-wise/issues)

---

**גרסה:** 3.0.0 - Local-First Edition
**עדכון אחרון:** נובמבר 2025

---

<div align="center">

**🎉 נוצר עם ❤️ למען ניהול משמרות קל ופשוט**

[⭐ Star us on GitHub](https://github.com/bdnhost/shift-wise)

</div>
