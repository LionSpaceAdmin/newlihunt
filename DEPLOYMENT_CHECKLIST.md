# ✅ Deployment Checklist - Vercel Blob Integration

## 🎯 מה צריך להגדיר בדשבורד Vercel

### 1. Vercel KV (Redis) ⚡

**מצב נוכחי:** ❌ לא מוגדר (שגיאות בלוגים)

**צעדים:**
1. לך ל: https://vercel.com/lionsteam/newlihunt/stores
2. לחץ **Create Database** > **KV**
3. שם: `newlihunt-kv`
4. Region: `iad1` (US East)
5. **Connect to Project** > בחר `newlihunt` > **All Environments**

**תוצאה:** 3 משתנים יתווספו אוטומטית:
- ✅ `KV_REST_API_URL`
- ✅ `KV_REST_API_TOKEN`
- ✅ `KV_REST_API_READ_ONLY_TOKEN`

---

### 2. Vercel Blob (File Storage) 📁

**מצב נוכחי:** ⚠️ קיים (`lionscamhunt-blob`) אבל אולי לא מחובר

**צעדים:**
1. לך ל: https://vercel.com/lionsteam/newlihunt/stores
2. אם `lionscamhunt-blob` קיים:
   - לחץ עליו
   - לחץ **Connect to Project**
   - בחר `newlihunt`
   - בחר **All Environments**
3. אם לא קיים:
   - **Create Database** > **Blob**
   - שם: `newlihunt-blob`
   - **Connect to Project**

**תוצאה:** משתנה יתווסף אוטומטית:
- ✅ `BLOB_READ_WRITE_TOKEN`

---

### 3. Environment Variables - אימות 🔐

לך ל: https://vercel.com/lionsteam/newlihunt/settings/environment-variables

**וודא שיש:**

#### Required (חובה):
- ✅ `GEMINI_API_KEY` - Google Gemini API key
- ✅ `KV_REST_API_URL` - Vercel KV URL
- ✅ `KV_REST_API_TOKEN` - Vercel KV token
- ✅ `BLOB_READ_WRITE_TOKEN` - Vercel Blob token

#### Optional (אופציונלי):
- ⚠️ `NEXT_PUBLIC_SITE_URL` - https://lionsofzion.io (מומלץ)
- ⚠️ `KV_REST_API_READ_ONLY_TOKEN` - Read-only token

---

## 🚀 Deploy

### אחרי הגדרת Storage:

```bash
# 1. Commit השינויים
git add .
git commit -m "Add Vercel Blob and KV integration"

# 2. Push ל-GitHub (auto-deploy)
git push origin main
```

**או Redeploy ידני:**
1. לך ל: https://vercel.com/lionsteam/newlihunt/deployments
2. בחר את ה-deployment האחרון
3. לחץ **⋯** (three dots) > **Redeploy**

---

## 🧪 בדיקה

### 1. בדוק Logs:
https://vercel.com/lionsteam/newlihunt/logs

**חפש:**
- ❌ "Missing required environment variables" - אם יש, Storage לא מחובר
- ✅ "Cached analysis result" - KV עובד!
- ✅ Upload מצליח - Blob עובד!

### 2. בדוק באתר:
https://lionsofzion.io

**נסה:**
1. ✅ העלה תמונה - צריך לעבוד
2. ✅ נתח תמונה - צריך לעבוד
3. ✅ נסה 6 uploads מהר - צריך לחסום ב-5 (rate limit)

---

## 💻 פיתוח מקומי

### אם רוצה לפתח מקומית עם Storage:

```bash
# 1. התקן Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. משוך environment variables
vercel env pull .env.local
```

**זה ימשוך:**
- `GEMINI_API_KEY`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- וכל שאר המשתנים

### בדיקה מקומית:

```bash
# בדוק משתני סביבה
npm run check-env

# הרץ dev server
npm run dev
```

---

## 🔧 פתרון בעיות

### שגיאה: "Rate limiter KV error, failing open"

**סיבה:** KV לא מוגדר או לא מחובר

**פתרון:**
1. צור KV Store (שלב 1 למעלה)
2. חבר לפרויקט
3. Redeploy

**זמני:** הקוד ממשיך לעבוד בלי rate limiting (fail-open mode)

---

### שגיאה: "Cache read/write error"

**סיבה:** KV לא מוגדר

**פתרון:** אותו כמו למעלה

**זמני:** הקוד ממשיך לעבוד בלי caching

---

### שגיאה: "Failed to upload file"

**סיבה:** Blob לא מוגדר או לא מחובר

**פתרון:**
1. וודא ש-Blob Store קיים
2. חבר לפרויקט (שלב 2 למעלה)
3. Redeploy

---

### Upload עובד אבל תמונה לא מוצגת

**בדוק:**
1. Blob URL נראה תקין? (צריך להתחיל ב-`https://`)
2. יש `BLOB_READ_WRITE_TOKEN`?
3. Blob מחובר ל-**All Environments**?

---

## 📊 Status Dashboard

### בדוק מצב ב-Vercel:

**Storage:**
- https://vercel.com/lionsteam/newlihunt/stores

**Environment Variables:**
- https://vercel.com/lionsteam/newlihunt/settings/environment-variables

**Deployments:**
- https://vercel.com/lionsteam/newlihunt/deployments

**Logs:**
- https://vercel.com/lionsteam/newlihunt/logs

---

## ✅ Success Criteria

הכל עובד כשאתה רואה:

1. ✅ אין שגיאות "Missing required environment variables" בלוגים
2. ✅ Upload תמונה עובד
3. ✅ ניתוח תמונה עובד
4. ✅ Rate limiting עובד (חוסם אחרי 5 uploads)
5. ✅ Caching עובד (בקשות זהות מהירות יותר)

---

**זמן משוער להגדרה:** 5-10 דקות

**עזרה נוספת:** ראה `SETUP_GUIDE.md` להוראות מפורטות
