# دستورات Push به GitHub

## وضعیت فعلی:
- آخرین commit روی GitHub: `66dad43d` (فاز 7 گام 11)
- Commit های جدید در local:
  - فاز 8: اعتبارسنجی آدرس
  - فاز 9: بهبود گزارش‌های مقایسه‌ای و سیستم امتیازدهی
  - فاز 10: ویژگی‌های پیشرفته (بازگشت کالا، جستجوی پیشرفته، پیگیری پیشرفته)
  - فاز 11: تکمیل TODO های موجود در کد

## دستورات Push:

### روش 1: Push همه branch ها (توصیه می‌شود)

```bash
# Push فاز 8
git push origin phase-8-quality-improvements

# Push فاز 9
git push origin phase-9-additional-features

# Push فاز 11
git push origin phase-11-complete-todos

# Push فاز 10 (main)
git push origin main
```

### روش 2: Merge همه به main و سپس push

```bash
# اطمینان از اینکه در main هستید
git checkout main

# Merge فاز 8
git merge phase-8-quality-improvements

# Merge فاز 9
git merge phase-9-additional-features

# Merge فاز 11
git merge phase-11-complete-todos

# Push main به GitHub
git push origin main
```

### روش 3: Push همه branch ها و main (بهترین روش)

```bash
# Push همه branch ها به GitHub
git push origin phase-8-quality-improvements
git push origin phase-9-additional-features
git push origin phase-11-complete-todos
git push origin main
```

## خلاصه Commit ها:

### فاز 8:
- اعتبارسنجی آدرس (Address Validation)

### فاز 9:
- بهبود گزارش‌های مقایسه‌ای
- بهبود سیستم امتیازدهی

### فاز 10:
- سیستم بازگشت کالا
- جستجوی پیشرفته
- پیگیری پیشرفته

### فاز 11:
- تکمیل TODO های موجود در کد

---

**نکته:** اگر conflict وجود داشت، ابتدا resolve کنید و سپس push کنید.

