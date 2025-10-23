# 🧹 תוכנית ניקוי הפרויקט

## ✅ קבצים למחיקה (בטוח 100%)

### קבצי Config כפולים
- [ ] `next.config.js` (להשאיר רק `next.config.ts`)
- [ ] `eslint.config.mjs` (להשאיר רק `.eslintrc.json`)

### קבצי תיעוד מיותרים בשורש
- [ ] `design.md` (כפול של `.kiro/specs/scam-hunt-platform/design.md`)
- [ ] `requirements.md` (כפול של `.kiro/specs/scam-hunt-platform/requirements.md`)
- [ ] `tasks.md` (כפול של `.kiro/specs/scam-hunt-platform/tasks.md`)
- [ ] `AWS_DEPLOYMENT.md`
- [ ] `COMPREHENSIVE_AUDIT_REPORT.md`
- [ ] `CURRENT_STATUS.md`
- [ ] `FINAL_STATUS.md`
- [ ] `GEMINI.md`
- [ ] `IMPROVEMENTS_SUMMARY.md`
- [ ] `PRODUCTION_READY_CHECKLIST.md`
- [ ] `PRODUCTION_READY_REPORT.md`
- [ ] `README-DEPLOYMENT.md`

### תמונות מיותרות
- [ ] ~~`public/globe.webp`~~ (נשאר - אמור להיות בשימוש)
- [ ] ~~`public/next.webp`~~ (נשאר - אמור להיות בשימוש)
- [ ] ~~`public/vercel.webp`~~ (נשאר - אמור להיות בשימוש)
- [ ] ~~`public/window.webp`~~ (נשאר - אמור להיות בשימוש)
- [ ] `public/9870A6AA-BD03-4F57-85C5-17BEE82A1A36.webp`
- [ ] `public/OpenAI Playground 2025-08-13 at 04.53.28.webp`
- [ ] `public/Untitled design.svg`
- [ ] `public/Untitled design.webp`

### תיקיות למחיקה
- [ ] `terraform/` (לא בשימוש - יש AWS SAM)
- [ ] `scripts/` (קבצי deploy ישנים)
- [ ] `.swc/` (cache)
- [ ] `.next/` (build artifacts - יבנה מחדש)

## ⚠️ תיקיות שאפשר למחוק (אבל לשמור ב-gitignore)
- `.vercel/` - config של Vercel (לא צריך ב-git)

## 📊 סטטיסטיקה

### לפני הניקוי:
- **קבצי תיעוד מיותרים:** 11 קבצים
- **קבצי config כפולים:** 2 קבצים
- **תמונות מיותרות:** 8 קבצים
- **תיקיות מיותרות:** 4 תיקיות

### חיסכון משוער:
- **מקום בדיסק:** ~50-100MB (בעיקר .next ו-terraform)
- **קבצים בגיט:** ~20 קבצים פחות
- **בהירות:** הרבה יותר נקי וברור!

## 🚀 פקודות ניקוי

```bash
# מחיקת קבצי config כפולים
rm next.config.js eslint.config.mjs

# מחיקת קבצי תיעוד מיותרים
rm design.md requirements.md tasks.md
rm AWS_DEPLOYMENT.md COMPREHENSIVE_AUDIT_REPORT.md CURRENT_STATUS.md
rm FINAL_STATUS.md GEMINI.md IMPROVEMENTS_SUMMARY.md
rm PRODUCTION_READY_CHECKLIST.md PRODUCTION_READY_REPORT.md README-DEPLOYMENT.md

# מחיקת תמונות מיותרות (שומרים globe, next, vercel, window)
rm "public/9870A6AA-BD03-4F57-85C5-17BEE82A1A36.webp"
rm "public/OpenAI Playground 2025-08-13 at 04.53.28.webp"
rm "public/Untitled design.svg" "public/Untitled design.webp"

# מחיקת תיקיות מיותרות
rm -rf terraform/ scripts/ .swc/ .next/

# הוספה ל-gitignore (אם עוד לא שם)
echo ".vercel/" >> .gitignore
echo ".swc/" >> .gitignore
echo ".next/" >> .gitignore
```

## ✨ תוצאה סופית

אחרי הניקוי הפרויקט יהיה:
- ✅ נקי יותר
- ✅ ברור יותר
- ✅ קל יותר לניווט
- ✅ פחות בלבול
- ✅ build מהיר יותר
