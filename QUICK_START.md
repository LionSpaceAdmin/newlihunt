# 🚀 Quick Start - Vercel Blob Integration

## ⚡ TL;DR - מה צריך לעשות עכשיו

### בפרודקשן (Vercel):

1. **צור Vercel KV:**
   - https://vercel.com/lionsteam/newlihunt/stores
   - Create Database > KV > Connect to Project

2. **חבר Vercel Blob:**
   - אותו מקום
   - `lionscamhunt-blob` > Connect to Project

3. **Redeploy:**
   - https://vercel.com/lionsteam/newlihunt/deployments
   - Redeploy latest

4. **בדוק:**
   - https://lionsofzion.io
   - נסה להעלות תמונה

---

## 📋 מה השתנה?

### ✅ מה עובד עכשיו:
- Upload תמונות ל-Vercel Blob (במקום base64)
- Rate limiting עם Vercel KV (במקום in-memory)
- Caching עם Vercel KV
- Build עובר ✅
- Tests עוברים ✅ (22/22)

### ⚠️ מה צריך להגדיר:
- Vercel KV Store (לrate limiting וcaching)
- Vercel Blob Store (לתמונות) - כבר קיים, צריך לחבר

---

## 🔍 בדיקה מהירה

```bash
# בדוק אם הכל מוגדר
npm run check-env

# הרץ tests
npm test

# הרץ build
npm run build

# הרץ dev server
npm run dev
```

---

## 📚 מסמכים נוספים

- **DEPLOYMENT_CHECKLIST.md** - checklist מפורט להגדרה
- **SETUP_GUIDE.md** - הוראות צעד-אחר-צעד
- **.kiro/specs/vercel-blob-integration/** - spec מלא

---

## 🆘 בעיות?

### "Missing required environment variables KV_REST_API_URL"
→ צריך ליצור ולחבר Vercel KV Store

### "Failed to upload file"
→ צריך לחבר Vercel Blob Store לפרויקט

### Upload עובד אבל אין rate limiting
→ KV לא מחובר, הקוד עובד ב-fail-open mode

---

## ✅ Checklist

- [ ] יצרתי Vercel KV Store
- [ ] חיברתי KV לפרויקט (All Environments)
- [ ] חיברתי Blob לפרויקט (All Environments)
- [ ] Redeploy
- [ ] בדקתי שאין שגיאות בלוגים
- [ ] בדקתי upload תמונה באתר

---

**זמן הגדרה:** ~5 דקות

**עזרה:** ראה DEPLOYMENT_CHECKLIST.md
