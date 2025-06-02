import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LandingPage() {
  useEffect(() => {
    document.body.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    
    // Smooth scrolling for navigation links
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // CTA Button tracking
    const ctaButtons = document.querySelectorAll('.cta-button-hook');
    ctaButtons.forEach(button => {
      button.addEventListener('click', function() {
        if (this.textContent.includes("התחל חינם") || this.textContent.includes("התחל ניסיון חינם")) {
          window.location.href = createPageUrl("Dashboard");
        }
      });
    });
    
    const demoButtons = document.querySelectorAll('.demo-button-hook');
    demoButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('דמו יופעל כאן... 🎬');
        });
    });

    return () => {
      document.body.style.fontFamily = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style>{`
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .floating {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .pulse-ring {
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.33); }
          80%, 100% { opacity: 0; }
        }
        .testimonial {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }
        .pricing-card {
          transition: all 0.3s ease;
        }
        .pricing-card:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .cta-button-style {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          transition: all 0.3s ease;
        }
        .cta-button-style:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold gradient-bg bg-clip-text text-transparent">
                🚀 ShiftWise
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">תכונות</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">מחירים</a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">המלצות</a>
              <button className="cta-button-hook bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                התחל חינם
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-bg pt-20 pb-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              ניהול משמרות שלא ייגמר בכאב ראש
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              מערכת AI חכמה שמשבצת את העובדים שלך אוטומטית, שולחת התראות ברגע הנכון, 
              וחוסכת לך <strong>8 שעות שבוע</strong> של בלאגן ומתח
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
              <button className="cta-button-hook cta-button-style text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg">
                🔥 התחל חינם ל-30 יום
              </button>
              <button className="demo-button-hook bg-white bg-opacity-20 text-white px-8 py-4 rounded-xl text-lg font-semibold border border-white border-opacity-30 hover:bg-opacity-30 transition-all">
                📺 צפה בדמו (2 דק')
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <span className="text-yellow-300">⭐⭐⭐⭐⭐</span>
                <span>4.9/5 (127 ביקורות)</span>
              </div>
              <div>✅ 500+ עסקים משתמשים</div>
              <div>✅ חיסכון ממוצע: $3,200/חודש</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              האמת הקשה על ניהול משמרות
            </h2>
            <p className="text-xl text-gray-600">רוב המנהלים מבזבזים 8-12 שעות שבוע על התיאומים האלה...</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">😤</div>
              <h3 className="text-xl font-semibold mb-3">בזבוז זמן אינסופי</h3>
              <p className="text-gray-600">שעות של WhatsApp, טלפונים וקואורדינציה. במקום לנהל עסק, אתה מנהל לוח זמנים.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-6xl mb-4">💸</div>
              <h3 className="text-xl font-semibold mb-3">עלויות מיותרות</h3>
              <p className="text-gray-600">שיבוצים לא יעילים גורמים לכפילויות, שעות נוספות ובזבוז של אלפי שקלים חודשיים.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-6xl mb-4">😡</div>
              <h3 className="text-xl font-semibold mb-3">עובדים מתוסכלים</h3>
              <p className="text-gray-600">שינויים ברגע האחרון, אי-צדק בחלוקת שעות, ותקשורת לקויה יוצרים אווירה רעה.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Preview */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              הפתרון: אוטומציה מלאה ב-3 צעדים פשוטים
            </h2>
            <p className="text-xl text-gray-600">מעכשיו התהליך כולו לוקח פחות מ-30 דקות בשבוע</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">העובדים מעדכנים זמינות</h3>
              <p className="text-gray-600">דרך אפליקציה פשוטה, כל עובד מסמן מתי הוא זמין/לא זמין לשבוע הבא</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI מייצר שיבוץ מושלם</h3>
              <p className="text-gray-600">בלחיצה אחת, האלגוריתם שלנו יוצר שיבוץ שמתחשב בכל האילוצים וההעדפות</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">כולם מקבלים התראות</h3>
              <p className="text-gray-600">SMS, מייל, ואפליקציה - כל עובד יודע בדיוק מתי הוא עובד, עם תזכורות אוטומטיות</p>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-12 text-center text-white">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-semibold mb-4">צפה איך זה עובד במציאות</h3>
            <p className="text-lg opacity-80 mb-6">דמו של 90 שניות שמראה איך המערכת חוסכת שעות של עבודה</p>
            <button className="demo-button-hook bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              ▶️ הפעל דמו
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              כל מה שאתה צריך במקום אחד
            </h2>
            <p className="text-xl text-gray-600">לא עוד 10 אפליקציות שונות - הכל כאן</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card bg-white p-6 rounded-xl">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-3">שיבוץ AI חכם</h3>
              <p className="text-gray-600">אלגוריתם מתקדם שמתחשב בזמינות, כישורים, העדפות וחוקי עבודה</p>
            </div>
            
            <div className="feature-card bg-white p-6 rounded-xl">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3">אפליקציה לעובדים</h3>
              <p className="text-gray-600">ממשק פשוט לעדכון זמינות, צפייה במשמרות וקבלת התראות</p>
            </div>
            
            <div className="feature-card bg-white p-6 rounded-xl">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold mb-3">התראות חכמות</h3>
              <p className="text-gray-600">SMS, מייל, WhatsApp ופוש - כל עובד מקבל עדכונים בזמן הנכון</p>
            </div>
            
            <div className="feature-card bg-white p-6 rounded-xl">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-3">בורסת משמרות</h3>
              <p className="text-gray-600">עובדים יכולים להחליף משמרות ביניהם בלי להטריד אותך</p>
            </div>
            
            <div className="feature-card bg-white p-6 rounded-xl">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">דוחות ואנליטיקס</h3>
              <p className="text-gray-600">מעקב אחר עלויות, שעות עבודה, ותובנות לאופטימיזציה</p>
            </div>
            
            <div className="feature-card bg-white p-6 rounded-xl">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-3">אינטגרציות</h3>
              <p className="text-gray-600">התחברות לכל הכלים שאתה כבר משתמש בהם - לוח שנה, שכר ועוד</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              מה אומרים מנהלים אמיתיים
            </h2>
            <p className="text-xl text-gray-600">תוצאות אמיתיות מעסקים אמיתיים</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="testimonial p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  ש
                </div>
                <div className="mr-4">
                  <h4 className="font-semibold">שרה כהן</h4>
                  <p className="text-sm text-gray-600">מנהלת רשת בתי קפה (3 סניפים)</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic">
                "חסכתי 10 שעות שבוע! במקום לבלות כל יום שישי על התיאומים, אני מקדישה את הזמן לפיתוח העסק. החיסכון בעלויות: 4,500₪ חודשיים!"
              </p>
            </div>
            
            <div className="testimonial p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  ד
                </div>
                <div className="mr-4">
                  <h4 className="font-semibold">דני לוי</h4>
                  <p className="text-sm text-gray-600">בעל מסעדת שף</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic">
                "העובדים שלי הרבה יותר מרוצים מאז שהם יודעים את הלוח זמנים שבוע מראש. פחות ביטולים ברגע האחרון, פחות מתח, יותר פרודוקטיביות."
              </p>
            </div>
            
            <div className="testimonial p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  מ
                </div>
                <div className="mr-4">
                  <h4 className="font-semibold">מירי פרץ</h4>
                  <p className="text-sm text-gray-600">מנהלת חנות רשת (2 סניפים)</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic">
                "הרבה יותר מארגנת! המערכת מזהה אוטומטית קונפליקטים ונותנת הצעות פתרון. גם הוויצוט עם העובדים ירד ל-0 - הכל ברור ושקוף."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              תמחור פשוט ושקוף
            </h2>
            <p className="text-xl text-gray-600">בחר את התוכנית שמתאימה לגודל העסק שלך</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="pricing-card bg-white p-8 rounded-2xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">התחלתי</h3>
                <div className="text-4xl font-bold mb-2">חינם</div>
                <p className="text-gray-600">עד 5 עובדים</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  שיבוץ בסיסי
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  50 התראות חודשיות
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  אפליקציה לעובדים
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  תמיכה בצ'אט
                </li>
              </ul>
              <button className="cta-button-hook w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                התחל חינם
              </button>
            </div>
            
            <div className="pricing-card bg-white p-8 rounded-2xl border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">הכי פופולרי</span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">עסקי</h3>
                <div className="text-4xl font-bold mb-2">₪119<span className="text-lg text-gray-600">/חודש</span></div>
                <p className="text-gray-600">עד 15 עובדים</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  כל התכונות של התחלתי
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  שיבוץ AI אוטומטי
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  התראות ללא הגבלה
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  דוחות מתקדמים
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  אינטגרציה עם יומן
                </li>
              </ul>
              <button className="cta-button-hook w-full cta-button-style text-white py-3 rounded-lg font-semibold">
                התחל ניסיון חינם
              </button>
            </div>
            
            <div className="pricing-card bg-white p-8 rounded-2xl border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">מתקדם</h3>
                <div className="text-4xl font-bold mb-2">₪249<span className="text-lg text-gray-600">/חודש</span></div>
                <p className="text-gray-600">עד 50 עובדים</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  כל התכונות של עסקי
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  מספר מיקומים
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  בורסת משמרות
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  אנליטיקס מתקדם
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  תמיכה 24/7
                </li>
              </ul>
              <button className="cta-button-hook w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                התחל ניסיון חינם
              </button>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">💝 <strong>מבצע השקה:</strong> 50% הנחה לחודשיים הראשונים</p>
            <p className="text-sm text-gray-500">ללא התחייבות • ביטול בכל עת • תמיכה בעברית</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-bg text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            מוכן להפסיק לבזבז זמן על ניהול משמרות?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            הצטרף ל-500+ בעלי עסקים שכבר חוסכים שעות של עבודה כל שבוע
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <button className="cta-button-hook bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              🚀 התחל חינם ל-30 יום
            </button>
            <button className="cta-button-hook border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              📞 בקש ייעוץ חינם
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm opacity-80">
            <div>✅ בלי כרטיס אשראי</div>
            <div>✅ התקנה תוך 15 דקות</div>
            <div>✅ תמיכה בעברית 24/7</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold gradient-bg bg-clip-text text-transparent mb-4">
                🚀 ShiftWise
              </div>
              <p className="text-gray-400">ניהול משמרות חכם ואוטומטי לעסקים קטנים וגדולים</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">מוצר</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">תכונות</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">מחירים</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">אינטגרציות</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">תמיכה</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">מרכז עזרה</a></li>
                <li><a href="#" className="hover:text-white transition-colors">צור קשר</a></li>
                <li><a href="#" className="hover:text-white transition-colors">טוטוריאלים</a></li>
                <li><a href="#" className="hover:text-white transition-colors">סטטוס מערכת</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">חברה</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">אודות</a></li>
                <li><a href="#" className="hover:text-white transition-colors">קריירה</a></li>
                <li><a href="#" className="hover:text-white transition-colors">בלוג</a></li>
                <li><a href="#" className="hover:text-white transition-colors">תנאי שימוש</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 ShiftWise. כל הזכויות שמורות.
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="mailto:support@shiftwise.co.il" className="text-gray-400 hover:text-white transition-colors">📧 support@shiftwise.co.il</a>
              <a href="tel:03-1234567" className="text-gray-400 hover:text-white transition-colors">📱 03-1234567</a>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-6 right-6 z-50">
        <button className="cta-button-hook cta-button-style text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          🚀 התחל חינם
        </button>
      </div>
    </div>
  );
}