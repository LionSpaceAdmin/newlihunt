# מדריך הגדרה - Vercel Storage

## 1️⃣ הגדרת Vercel KV (Redis)

### למה צריך?
- Rate limiting (הגבלת קצב בקשות)
- Caching (שמירת תוצאות ניתוח במטמון)

### איך להגדיר:

1. **היכנס לדשבורד Vercel:**
   - לך ל: https://vercel.com/lionsteam/newlihunt
   - או: https://vercel.com/dashboard

2. **KV Store כבר קיים! ✅**
   - שם: `measured-werewolf-29393` (Upstash Redis)
   - URL: `https://measured-werewolf-29393.upstash.io`
   - Region: Upstash global
   
3. **חבר ל-Project (אם עדיין לא מחובר):**
   - לך ל: https://vercel.com/lionsteam/newlihunt/stores
   - מצא את `measured-werewolf-29393`
   - לחץ **Connect to Project**
   - בחר את הפרויקט `newlihunt`
   - בחר **All Environments** (Production, Preview, Development)
   - לחץ **Connect**

4. **אימות:**
   - לך ל: **Settings** > **Environment Variables**
   - וודא שיש:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

---

## 2️⃣ הגדרת Vercel Blob (File Storage)

### למה צריך?
- אחסון תמונות שמשתמשים מעלים
- CDN delivery מהיר

### איך להגדיר:

1. **צור Blob Store:**
   - באותו מקום (**Storage** בדשבורד)
   - לחץ **Create Database**
   - בחר **Blob**
   - תן שם: `lionscamhunt-blob` (כבר קיים אצלך!)
   - לחץ **Create** (או דלג אם כבר קיים)

2. **חבר ל-Project:**
   - לחץ **Connect to Project**
   - בחר `newlihunt`
   - בחר **All Environments**
   - לחץ **Connect**

3. **אימות:**
   - לך ל: **Settings** > **Environment Variables**
   - וודא שיש:
     - `BLOB_READ_WRITE_TOKEN`

---

## 3️⃣ פיתוח מקומי (Local Development)

### אם רוצה לפתח מקומית עם Vercel Storage:

1. **התקן Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **התחבר:**
   ```bash
   vercel login
   ```

3. **קשר את הפרויקט:**
   ```bash
   vercel link
   ```

4. **משוך משתני סביבה:**
   ```bash
   vercel env pull .env.local
   ```

   זה ימשוך את כל המשתנים מ-Vercel (כולל KV ו-Blob tokens)

---

## 4️⃣ בדיקה

### בדוק שהכל עובד:

1. **Deploy מחדש:**
   ```bash
   git add .
   git commit -m "Add Vercel KV and Blob integration"
   git push
   ```

2. **בדוק בפרודקשן:**
   - לך ל: https://lionsofzion.io
   - נסה להעלות תמונה
   - בדוק שאין שגיאות בלוגים

3. **בדוק לוגים:**
   - Vercel Dashboard > Project > Logs
   - חפש שגיאות של KV או Blob

---

## 🔍 פתרון בעיות

### שגיאה: "Missing required environment variables KV_REST_API_URL"

**פתרון:**
1. וודא ש-KV Store מחובר לפרויקט
2. Redeploy את הפרויקט (Vercel > Deployments > Redeploy)
3. בדוק ש-Environment Variables מוגדרים

### שגיאה: "BLOB_READ_WRITE_TOKEN not found"

**פתרון:**
1. וודא ש-Blob Store מחובר לפרויקט
2. Redeploy
3. בדוק Environment Variables

### Rate limiting לא עובד

**זמני (עד שמגדירים KV):**
הקוד עובד במצב "fail-open" - ממשיך לעבוד בלי rate limiting.
זה בסדר לפיתוח, אבל בפרודקשן כדאי להגדיר KV.

---

## ✅ Checklist

- [ ] יצרתי Vercel KV Store
- [ ] חיברתי KV ל-project
- [ ] וידאתי שיש `KV_REST_API_URL` ו-`KV_REST_API_TOKEN`
- [ ] וידאתי שיש Blob Store (lionscamhunt-blob)
- [ ] חיברתי Blob ל-project
- [ ] וידאתי שיש `BLOB_READ_WRITE_TOKEN`
- [ ] Deploy מחדש
- [ ] בדקתי שהאתר עובד
- [ ] בדקתי שאין שגיאות בלוגים

---

## 📞 עזרה נוספת

אם משהו לא עובד:
1. בדוק את הלוגים ב-Vercel Dashboard
2. וודא שכל ה-Environment Variables מוגדרים
3. נסה Redeploy
4. בדוק שה-Storage stores מחוברים לפרויקט הנכון

---

**הצלחה! 🚀**
