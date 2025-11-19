# مستندات گزارش‌های سیستم

این فایل شامل مستندات کامل گزارش‌های موجود در سیستم است.

## 📊 انواع گزارش‌ها

### 1. گزارش‌های فروش (Sales Reports)

#### 1.1 خلاصه فروش
**Endpoint:** `GET /admin/report/sales/summary`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع (ISO format)
- `endDate` (optional): تاریخ پایان (ISO format)

**Response:**
```json
{
  "status": 200,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 50000000,
    "totalCost": 30000000,
    "totalProfit": 20000000,
    "totalProfitMargin": 40,
    "averageOrderValue": 333333,
    "totalDiscountAmount": 2000000,
    "totalShippingCost": 3000000,
    "totalTaxAmount": 4500000,
    "completedOrders": 120,
    "pendingOrders": 20,
    "cancelledOrders": 10
  }
}
```

#### 1.2 گزارش فروش دوره‌ای
**Endpoint:** `GET /admin/report/sales/period`

**Query Parameters:**
- `startDate` (required): تاریخ شروع
- `endDate` (required): تاریخ پایان
- `periodType` (optional): نوع دوره - `"daily"` | `"weekly"` | `"monthly"` (default: `"daily"`)

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "period": "2025-01-15",
      "totalOrders": 10,
      "totalRevenue": 5000000,
      "totalCost": 3000000,
      "totalProfit": 2000000,
      "averageOrderValue": 500000,
      "totalDiscountAmount": 200000,
      "totalShippingCost": 300000,
      "totalTaxAmount": 450000
    }
  ]
}
```

#### 1.3 گزارش فروش بر اساس محصول
**Endpoint:** `GET /admin/report/sales/products`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان
- `limit` (optional): تعداد محصولات برتر

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "productId": "product_id",
      "productName": "نام محصول",
      "totalQuantitySold": 50,
      "totalRevenue": 5000000,
      "totalCost": 3000000,
      "totalProfit": 2000000,
      "averagePrice": 100000,
      "orderCount": 30
    }
  ]
}
```

---

### 2. گزارش‌های سفارش (Order Reports)

#### 2.1 گزارش وضعیت سفارش
**Endpoint:** `GET /admin/report/orders/status`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "status": "completed",
      "count": 120,
      "totalRevenue": 40000000,
      "percentage": 80
    },
    {
      "status": "pending",
      "count": 20,
      "totalRevenue": 5000000,
      "percentage": 13.33
    }
  ]
}
```

#### 2.2 گزارش وضعیت ارسال
**Endpoint:** `GET /admin/report/orders/delivery-status`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "status": "delivered",
      "count": 100,
      "percentage": 66.67
    },
    {
      "status": "in_transit",
      "count": 30,
      "percentage": 20
    }
  ]
}
```

#### 2.3 گزارش سفارش بر اساس منطقه
**Endpoint:** `GET /admin/report/orders/regions`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "province": "تهران",
      "city": "تهران",
      "orderCount": 50,
      "totalRevenue": 15000000,
      "averageOrderValue": 300000
    }
  ]
}
```

#### 2.4 گزارش زمان تحویل
**Endpoint:** `GET /admin/report/orders/delivery-time`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان

**Response:**
```json
{
  "status": 200,
  "data": {
    "averageDeliveryTime": 2.5,
    "fastestDelivery": 1,
    "slowestDelivery": 5,
    "onTimeDeliveryRate": 85
  }
}
```

#### 2.5 گزارش سفارش‌های مشکل‌دار
**Endpoint:** `GET /admin/report/orders/problematic`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "orderId": "order_id",
      "orderNumber": "ORD-2025-0001",
      "issue": "cancelled",
      "createdAt": "2025-01-15T10:00:00Z",
      "lastUpdated": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### 3. گزارش‌های موجودی (Inventory Reports)

#### 3.1 خلاصه موجودی
**Endpoint:** `GET /admin/report/inventory/summary`

**Response:**
```json
{
  "status": 200,
  "data": {
    "totalWarehouses": 5,
    "totalProducts": 200,
    "totalQuantity": 10000,
    "totalValue": 500000000,
    "lowStockCount": 15,
    "recentMovements": [...]
  }
}
```

#### 3.2 گزارش موجودی کم
**Endpoint:** `GET /admin/report/inventory/low-stock`

**Query Parameters:**
- `warehouseId` (optional): شناسه انبار
- `threshold` (optional): آستانه موجودی کم (default: 10)

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "productWarehouse": {...},
      "currentQuantity": 5,
      "threshold": 10,
      "shortage": 5
    }
  ]
}
```

---

### 4. داشبورد کامل (Dashboard)

**Endpoint:** `GET /admin/report/dashboard`

**Query Parameters:**
- `startDate` (optional): تاریخ شروع
- `endDate` (optional): تاریخ پایان

**Response:**
```json
{
  "status": 200,
  "data": {
    "sales": {
      "totalOrders": 150,
      "totalRevenue": 50000000,
      ...
    },
    "orders": {
      "status": [...],
      "delivery": [...]
    },
    "inventory": {
      "summary": {...},
      "lowStock": [...]
    }
  }
}
```

---

## 📝 نکات مهم

1. **تاریخ‌ها:** همه تاریخ‌ها باید به فرمت ISO 8601 ارسال شوند (مثلاً `2025-01-15T00:00:00Z`)

2. **فیلترهای اختیاری:** اگر `startDate` و `endDate` مشخص نشوند، همه داده‌ها در نظر گرفته می‌شوند

3. **خطاها:** در صورت بروز خطا، پاسخ به شکل زیر خواهد بود:
```json
{
  "status": 500,
  "message": "پیام خطا"
}
```

4. **احراز هویت:** همه endpoint‌های گزارش نیاز به لاگین ادمین دارند (`loginRequired: true`)

---

## 🔄 گزارش‌های موجود در Warehouse Controller

علاوه بر ReportController، گزارش‌های موجودی نیز در Warehouse Controller موجود هستند:

- `GET /admin/warehouse/reports/low-stock` - گزارش موجودی کم
- `GET /admin/warehouse/reports/movements` - تاریخچه حرکت موجودی
- `GET /admin/warehouse/reports/warehouse-inventory` - گزارش موجودی انبارها
- `GET /admin/warehouse/reports/summary` - خلاصه موجودی
- `GET /admin/warehouse/reports/product/:productId` - گزارش موجودی یک محصول

---

## 📈 استفاده از گزارش‌ها

### مثال: دریافت خلاصه فروش هفته گذشته

```javascript
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);
const endDate = new Date();

const response = await fetch(
  `/admin/report/sales/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

### مثال: دریافت گزارش فروش روزانه

```javascript
const startDate = new Date('2025-01-01');
const endDate = new Date('2025-01-31');

const response = await fetch(
  `/admin/report/sales/period?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&periodType=daily`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

---

## 🚀 توسعه‌های آینده

- [ ] خروجی Excel برای گزارش‌ها
- [ ] خروجی PDF برای گزارش‌ها
- [ ] گزارش‌های مقایسه‌ای (مقایسه دوره‌ها)
- [ ] گزارش‌های پیش‌بینی (Forecasting)
- [ ] گزارش‌های تحلیلی پیشرفته (Advanced Analytics)

