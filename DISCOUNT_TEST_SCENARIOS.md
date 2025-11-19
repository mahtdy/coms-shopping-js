# 📋 مستندات سناریوهای تست تخفیف پس از فاکتور

**تاریخ:** 2025  
**هدف:** تست کامل منطق تولید تخفیف پس از ثبت فاکتور

---

## 📚 فهرست مطالب

1. [معرفی](#معرفی)
2. [سناریوهای تست](#سناریوهای-تست)
3. [نحوه اجرای تست‌ها](#نحوه-اجرای-تستها)
4. [چک‌لیست تست](#چکلیست-تست)

---

## معرفی

سیستم تخفیف پس از فاکتور (`generateDiscountAfterInvoice`) در کنترلر `DiscountController` قرار دارد و پس از ثبت هر سفارش جدید، به صورت خودکار یا دستی فراخوانی می‌شود.

### جریان کار

```
1. کاربر سفارش ثبت می‌کند (Order Checkout)
   ↓
2. سفارش در دیتابیس ثبت می‌شود
   ↓
3. متد generateDiscountAfterInvoice فراخوانی می‌شود
   ↓
4. بررسی شرایط تخفیف:
   - وجود تخفیف فعال
   - بازه زمانی (disStart, disEnd)
   - firstInvoiceOnly (فقط اولین خرید)
   - بازه مبلغی (amountRange)
   ↓
5. محاسبه مقدار تخفیف:
   - Fixed: مبلغ ثابت
   - Random: مبلغ تصادفی در بازه
   - Percent: درصدی از قیمت کل
   ↓
6. بررسی maxProfitLimit (محدودیت سود)
   ↓
7. تولید کد تخفیف (در صورت نیاز)
   ↓
8. ثبت تخفیف در دیتابیس
```

---

## سناریوهای تست

### ✅ سناریو 1: تخفیف Fixed با موفقیت

**شرایط:**
- تخفیف فعال وجود دارد
- `disValue.type = "fixed"`
- `disValue.fixedAmount = 50000`
- `firstInvoiceOnly = false`
- `amountRange = {from: 100000, to: 10000000}`
- `maxProfitLimit = false`

**ورودی:**
```json
{
  "orderId": "ORDER_ID",
  "order": {
    "totalPriceProducts": 200000,
    "totalCost": 150000
  }
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 200,
  "message": "Discount code generated",
  "data": {
    "disValue": {
      "type": "fixed",
      "fixedAmount": 50000
    },
    "disCode": "DISCOUNT_CODE"
  }
}
```

**نکات:**
- مقدار تخفیف باید دقیقاً 50000 باشد
- کد تخفیف باید تولید شده باشد (اگر `generateCode = true`)

---

### ✅ سناریو 2: تخفیف Random با موفقیت

**شرایط:**
- تخفیف فعال وجود دارد
- `disValue.type = "random"`
- `disValue.randomRange = {from: 10000, to: 50000}`
- `firstInvoiceOnly = false`
- `amountRange = {from: 100000, to: 10000000}`
- `maxProfitLimit = false`

**ورودی:**
```json
{
  "orderId": "ORDER_ID",
  "order": {
    "totalPriceProducts": 200000,
    "totalCost": 150000
  }
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 200,
  "message": "Discount code generated",
  "data": {
    "disValue": {
      "type": "fixed",
      "fixedAmount": 10000-50000  // باید در این بازه باشد
    }
  }
}
```

**نکات:**
- مقدار تخفیف باید بین 10000 تا 50000 باشد
- هر بار که تست می‌کنید، مقدار ممکن است متفاوت باشد

---

### ✅ سناریو 3: تخفیف Percent با موفقیت

**شرایط:**
- تخفیف فعال وجود دارد
- `disValue.type = "percent"`
- `disValue.fixedAmount = 10` (10 درصد)
- `firstInvoiceOnly = false`
- `amountRange = {from: 100000, to: 10000000}`
- `maxProfitLimit = false`

**ورودی:**
```json
{
  "orderId": "ORDER_ID",
  "order": {
    "totalPriceProducts": 200000,
    "totalCost": 150000
  }
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 200,
  "message": "Discount code generated",
  "data": {
    "disValue": {
      "type": "fixed",
      "fixedAmount": 20000  // 10% از 200000
    }
  }
}
```

**نکات:**
- مقدار تخفیف باید 10% از `totalPriceProducts` باشد
- فرمول: `(fixedAmount / 100) * totalPriceProducts`

---

### ✅ سناریو 4: تخفیف با maxProfitLimit

**شرایط:**
- تخفیف فعال وجود دارد
- `disValue.type = "fixed"`
- `disValue.fixedAmount = 100000`
- `maxProfitLimit = true`
- سود سفارش = 50000 (totalPriceProducts - totalCost)

**ورودی:**
```json
{
  "orderId": "ORDER_ID",
  "order": {
    "totalPriceProducts": 200000,
    "totalCost": 150000
  }
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 200,
  "message": "Discount code generated",
  "data": {
    "disValue": {
      "type": "fixed",
      "fixedAmount": 50000  // نه 100000، چون سود فقط 50000 است
    }
  }
}
```

**نکات:**
- مقدار تخفیف نباید بیشتر از سود باشد
- سود = `totalPriceProducts - totalCost`
- اگر `discountValue > profit`، باید `discountValue = profit` شود

---

### ❌ سناریو 5: عدم وجود تخفیف فعال

**شرایط:**
- هیچ تخفیف فعالی وجود ندارد
- یا `isActive = false`
- یا خارج از بازه زمانی (`disStart`, `disEnd`)

**ورودی:**
```json
{
  "orderId": "ORDER_ID"
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 404,
  "message": "No active discount settings found"
}
```

---

### ❌ سناریو 6: تخفیف فقط برای اولین خرید (firstInvoiceOnly)

**شرایط:**
- تخفیف فعال وجود دارد
- `firstInvoiceOnly = true`
- کاربر قبلاً سفارش دیگری ثبت کرده است

**ورودی:**
```json
{
  "orderId": "ORDER_ID",
  "user": {
    "id": "USER_ID",
    "ordersCount": 2  // قبلاً یک سفارش داشته
  }
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 400,
  "message": "Discount only for first invoice"
}
```

**نکات:**
- باید تعداد سفارشات کاربر را بررسی کند
- اگر `userOrders > 1`، باید خطا برگرداند

---

### ❌ سناریو 7: مبلغ سفارش خارج از بازه (amountRange)

**شرایط:**
- تخفیف فعال وجود دارد
- `amountRange = {from: 100000, to: 500000}`
- مبلغ سفارش کمتر از 100000 یا بیشتر از 500000

**ورودی:**
```json
{
  "orderId": "ORDER_ID",
  "order": {
    "totalPriceProducts": 50000  // کمتر از 100000
  }
}
```

**خروجی مورد انتظار:**
```json
{
  "status": 400,
  "message": "Invoice amount out of range"
}
```

**نکات:**
- باید بررسی کند: `totalPriceProducts < amountRange.from` یا `totalPriceProducts > amountRange.to`

---

### ✅ سناریو 8: تولید کد تخفیف با تنظیمات مختلف

#### 8.1: کد با حروف (letters)

**شرایط:**
- `generateCode = true`
- `codeSettings.type = "letters"`
- `codeSettings.charCount = 8`
- `codeSettings.prefix = "DIS"`

**خروجی مورد انتظار:**
```json
{
  "data": {
    "disCode": "DISABCDEF"  // 8 کاراکتر حروف
  }
}
```

#### 8.2: کد با اعداد (numbers)

**شرایط:**
- `generateCode = true`
- `codeSettings.type = "numbers"`
- `codeSettings.charCount = 6`
- `codeSettings.prefix = "OFF"`

**خروجی مورد انتظار:**
```json
{
  "data": {
    "disCode": "OFF123456"  // 6 عدد
  }
}
```

#### 8.3: کد ثابت (fixed)

**شرایط:**
- `generateCode = true`
- `codeSettings.type = "fixed"`
- `codeSettings.fixedValue = "WELCOME2025"`

**خروجی مورد انتظار:**
```json
{
  "data": {
    "disCode": "WELCOME2025"  // کد ثابت
  }
}
```

---

### ✅ سناریو 9: یکپارچگی با Order Checkout

**شرایط:**
- کاربر از طریق `/admin/order/checkout` یا `/user/basket/checkout` سفارش ثبت می‌کند
- تخفیف باید به صورت خودکار تولید شود

**جریان:**
```
1. POST /admin/order/checkout
   Body: {
     "orderList": [...]
   }
   ↓
2. BasketOrderService.createOrderFromList() → Order ایجاد می‌شود
   ↓
3. DiscountController.generateDiscountAfterInvoice() → تخفیف تولید می‌شود
   ↓
4. Response شامل order, discount, payment, totals
```

**خروجی مورد انتظار:**
```json
{
  "status": 200,
  "message": "Order created and discount generated",
  "data": {
    "order": {...},
    "discount": {
      "disCode": "...",
      "disValue": {...}
    },
    "payment": {...},
    "totals": {...}
  }
}
```

---

## نحوه اجرای تست‌ها

### روش 1: تست دستی با Postman/Thunder Client

#### مرحله 1: ایجاد تخفیف فعال

```http
POST http://localhost:7000/admin/discount
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "disTitle": "تخفیف تست",
  "disType": "general",
  "applyOnInvoice": true,
  "autoApplyOnInvoice": true,
  "disStart": "2025-01-01T00:00:00.000Z",
  "disEnd": "2025-12-31T23:59:59.000Z",
  "firstInvoiceOnly": false,
  "amountRange": {
    "from": 100000,
    "to": 10000000
  },
  "disValue": {
    "type": "fixed",
    "fixedAmount": 50000
  },
  "maxProfitLimit": false,
  "usageCount": 100,
  "generateCode": true,
  "codeSettings": {
    "type": "letters",
    "charCount": 8,
    "prefix": "TEST"
  },
  "filters": {
    "userFilter": {
      "allUsers": true
    },
    "productFilter": {
      "allProducts": true
    }
  },
  "isActive": true
}
```

#### مرحله 2: ثبت سفارش و تولید تخفیف

```http
POST http://localhost:7000/admin/order/checkout
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "orderList": [
    {
      "productwarehouse": "PRODUCT_WAREHOUSE_ID",
      "quantity": 2
    }
  ]
}
```

#### مرحله 3: بررسی نتیجه

پاسخ باید شامل `order`, `discount`, `payment`, `totals` باشد.

---

### روش 2: تست خودکار با Jest

فایل تست در بخش بعدی ایجاد می‌شود.

---

## چک‌لیست تست

### تست‌های موفقیت‌آمیز

- [ ] سناریو 1: تخفیف Fixed با موفقیت
- [ ] سناریو 2: تخفیف Random با موفقیت
- [ ] سناریو 3: تخفیف Percent با موفقیت
- [ ] سناریو 4: تخفیف با maxProfitLimit
- [ ] سناریو 8: تولید کد تخفیف (letters)
- [ ] سناریو 8: تولید کد تخفیف (numbers)
- [ ] سناریو 8: تولید کد تخفیف (fixed)
- [ ] سناریو 9: یکپارچگی با Order Checkout

### تست‌های خطا

- [ ] سناریو 5: عدم وجود تخفیف فعال
- [ ] سناریو 6: تخفیف فقط برای اولین خرید
- [ ] سناریو 7: مبلغ سفارش خارج از بازه

### تست‌های Edge Case

- [ ] مبلغ سفارش دقیقاً برابر با `amountRange.from`
- [ ] مبلغ سفارش دقیقاً برابر با `amountRange.to`
- [ ] تخفیف بیشتر از سود (با maxProfitLimit)
- [ ] تخفیف صفر (profit = 0)
- [ ] تخفیف در آخرین روز (disEnd)
- [ ] تخفیف در اولین روز (disStart)

---

## نکات مهم

### 1. وابستگی Order → Discount

- هر سفارش می‌تواند یک تخفیف داشته باشد
- تخفیف پس از ثبت سفارش تولید می‌شود
- اگر تخفیف تولید نشود، سفارش همچنان ثبت می‌شود (خطا نمی‌دهد)

### 2. محاسبه سود

```typescript
const profit = totalPriceProducts - totalCost;
```

### 3. محدودیت سود

```typescript
if (maxProfitLimit && discountValue > profit) {
  discountValue = profit;
}
```

### 4. تولید کد تخفیف

- اگر `generateCode = false`، `disCode` خالی می‌ماند
- کد باید unique باشد (در schema تعریف شده)

---

## مشکلات احتمالی و راه‌حل

### مشکل 1: تخفیف تولید نمی‌شود

**علت:** ممکن است تخفیف فعال وجود نداشته باشد.

**راه‌حل:**
1. بررسی کنید که `isActive = true`
2. بررسی کنید که در بازه زمانی باشد
3. بررسی کنید که `applyOnInvoice = true`

### مشکل 2: مقدار تخفیف اشتباه است

**علت:** ممکن است محاسبه درصد یا random اشتباه باشد.

**راه‌حل:**
- برای percent: `(fixedAmount / 100) * totalPriceProducts`
- برای random: باید در بازه `randomRange` باشد

### مشکل 3: کد تخفیف تکراری است

**علت:** ممکن است کد قبلاً استفاده شده باشد.

**راه‌حل:**
- بررسی کنید که `disCode` unique است
- در صورت نیاز، منطق تولید کد را بهبود دهید

---

## بهبودهای پیشنهادی

1. **لاگ‌گذاری:** اضافه کردن لاگ برای هر مرحله از تولید تخفیف
2. **اعتبارسنجی:** بررسی صحت داده‌های ورودی
3. **Transaction:** استفاده از Transaction برای اطمینان از یکپارچگی داده
4. **Cache:** کش کردن تخفیف‌های فعال برای بهبود عملکرد
5. **تست خودکار:** ایجاد تست‌های Jest برای تمام سناریوها

---

**توسعه‌دهندگان:** Hasan Mohammadi, Mahtdy  
**نسخه:** 1.0.0

