# הוראות דפלוי ל-Vercel

## דפלוי הפרונט-אנד ב-Vercel

### שלב 1: הכנת הפרויקט
הפרויקט מוכן לדפלוי עם הגדרות הבאות:
- ✅ GEMINI_API_KEY מוגדר ב-.env.production
- ✅ vercel.json מוגדר עם כל ההגדרות הנדרשות
- ✅ הפרויקט עובר build בהצלחה

### שלב 2: דפלוי ב-Vercel

#### אופציה 1: דרך Vercel CLI
```bash
# התקנת Vercel CLI (אם לא מותקן)
npm i -g vercel

# התחברות ל-Vercel
vercel login

# דפלוי הפרויקט
vercel --prod
```

#### אופציה 2: דרך Vercel Dashboard
1. היכנס ל-[vercel.com](https://vercel.com)
2. לחץ על "New Project"
3. חבר את הריפוזיטורי מ-GitHub/GitLab/Bitbucket
4. Vercel יזהה אוטומטית שזה פרויקט Next.js
5. הגדר את משתני הסביבה:
   - `GEMINI_API_KEY`: `AIzaSyDzGQQ-Nd1QZUbIAIOWHFyz9PT88cjjGtk`
   - `ENVIRONMENT`: `production`
6. לחץ על "Deploy"

### שלב 3: הגדרת משתני סביבה ב-Vercel Dashboard
אם אתה משתמש ב-Vercel Dashboard:
1. לך לפרויקט שלך ב-Vercel
2. לחץ על "Settings"
3. לחץ על "Environment Variables"
4. הוסף:
   - Name: `GEMINI_API_KEY`, Value: `AIzaSyDzGQQ-Nd1QZUbIAIOWHFyz9PT88cjjGtk`
   - Name: `ENVIRONMENT`, Value: `production`
5. לחץ על "Save"
6. עשה redeploy לפרויקט

### שלב 4: בדיקת הדפלוי
לאחר הדפלוי, בדוק:
- ✅ האתר נטען בהצלחה
- ✅ ניתוח הודעות עובד (API route: /api/history)
- ✅ בדיקת URLs עובדת (API route: /api/url-inspector)
- ✅ ה-GEMINI_API_KEY עובד (בדוק בקונסול שאין שגיאות authentication)

### קבצים חשובים שנוצרו:
- `.env.production` - משתני סביבה לפרודקשן
- `vercel.json` - הגדרות Vercel
- `.env.local.example` - דוגמה למשתני סביבה מקומיים

### פתרון בעיות נפוצות:
1. **שגיאת GEMINI_API_KEY**: ודא שהמפתח מוגדר נכון במשתני הסביבה של Vercel
2. **שגיאות build**: הרץ `npm run build` מקומית לבדיקה
3. **שגיאות API**: בדוק את הלוגים ב-Vercel Dashboard > Functions

### הערות חשובות:
- המפתח `AIzaSyDzGQQ-Nd1QZUbIAIOWHFyz9PT88cjjGtk` מוגדר בכל הקבצים הרלוונטיים
- הפרויקט מוכן לדפלוי מיידי ב-Vercel
- כל ה-API routes יעבדו אוטומטית כ-Vercel Functions