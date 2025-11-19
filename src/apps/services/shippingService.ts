import Address from "../../repositories/admin/address/model";

/**
 * توضیح فارسی: سرویس محاسبه هزینه ارسال
 * این سرویس بر اساس نوع ارسال، زمان، وزن و فاصله هزینه ارسال را محاسبه می‌کند.
 */

/**
 * توضیح فارسی: نوع ارسال
 * 1: عادی (پست)
 * 2: پیک موتوری
 * 3: پیک خودرویی
 * 4: پست پیشتاز
 * 5: پست سفارشی
 */
export type SendType = 1 | 2 | 3 | 4 | 5;

/**
 * توضیح فارسی: زمان ارسال
 * 1: فوری (همین امروز)
 * 2: عادی (1-2 روز کاری)
 * 3: استاندارد (3-5 روز کاری)
 */
export type SendTime = 1 | 2 | 3;

/**
 * توضیح فارسی: تنظیمات هزینه ارسال
 */
export interface ShippingConfig {
  basePrice: number;        // قیمت پایه ارسال
  perKmPrice: number;       // قیمت به ازای هر کیلومتر
  urgentMultiplier: number; // ضریب برای ارسال فوری
  bigPackageMultiplier: number; // ضریب برای بسته بزرگ
  sendTypeMultipliers: {   // ضریب برای هر نوع ارسال
    [key in SendType]: number;
  };
}

/**
 * توضیح فارسی: تنظیمات پیش‌فرض هزینه ارسال
 */
const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  basePrice: 50000,         // 50,000 تومان قیمت پایه
  perKmPrice: 2000,        // 2,000 تومان به ازای هر کیلومتر
  urgentMultiplier: 1.5,    // 50% اضافه برای فوری
  bigPackageMultiplier: 1.3, // 30% اضافه برای بسته بزرگ
  sendTypeMultipliers: {
    1: 1.0,    // عادی (پست)
    2: 1.2,    // پیک موتوری
    3: 1.5,    // پیک خودرویی
    4: 1.8,    // پست پیشتاز
    5: 2.0,    // پست سفارشی
  },
};

/**
 * توضیح فارسی: سرویس محاسبه هزینه ارسال
 */
export default class ShippingService {
  private config: ShippingConfig;

  constructor(config?: Partial<ShippingConfig>) {
    this.config = { ...DEFAULT_SHIPPING_CONFIG, ...config };
  }

  /**
   * توضیح فارسی: محاسبه هزینه ارسال بر اساس پارامترهای مختلف
   * @param address آدرس مقصد
   * @param sendType نوع ارسال
   * @param sendTime زمان ارسال
   * @param isBig آیا بسته بزرگ است
   * @param weight وزن بسته (کیلوگرم) - اختیاری
   * @param originAddress آدرس مبدا (اختیاری - برای محاسبه فاصله)
   * @returns هزینه ارسال به تومان
   */
  calculateShippingCost(
    address: Address | any,
    sendType: SendType = 1,
    sendTime: SendTime = 2,
    isBig: boolean = false,
    weight?: number,
    originAddress?: { lat: number; lng: number }
  ): number {
    // کامنت: استخراج موقعیت جغرافیایی از آدرس
    let destinationLocation = { lat: 0, lng: 0 };
    if (address && address.addressList && address.addressList.length > 0) {
      const defaultAddress = address.addressList.find((addr: any) => addr.isDefault) || address.addressList[0];
      if (defaultAddress && defaultAddress.location) {
        destinationLocation = {
          lat: defaultAddress.location.lat || 0,
          lng: defaultAddress.location.lng || 0,
        };
      }
    }

    // کامنت: محاسبه فاصله (در حال حاضر ساده، می‌توان بهبود داد)
    const distance = this.calculateDistance(
      originAddress || { lat: 35.6892, lng: 51.3890 }, // تهران به عنوان مبدا پیش‌فرض
      destinationLocation
    );

    // کامنت: محاسبه هزینه پایه
    let cost = this.config.basePrice;

    // کامنت: اضافه کردن هزینه بر اساس فاصله
    cost += distance * this.config.perKmPrice;

    // کامنت: اعمال ضریب نوع ارسال
    const sendTypeMultiplier = this.config.sendTypeMultipliers[sendType] || 1.0;
    cost *= sendTypeMultiplier;

    // کامنت: اعمال ضریب زمان ارسال (فوری)
    if (sendTime === 1) {
      cost *= this.config.urgentMultiplier;
    }

    // کامنت: اعمال ضریب بسته بزرگ
    if (isBig) {
      cost *= this.config.bigPackageMultiplier;
    }

    // کامنت: اضافه کردن هزینه بر اساس وزن (اگر مشخص شده باشد)
    if (weight && weight > 1) {
      const weightExtra = (weight - 1) * 5000; // 5,000 تومان به ازای هر کیلوگرم اضافی
      cost += weightExtra;
    }

    // کامنت: گرد کردن به هزار تومان
    return Math.ceil(cost / 1000) * 1000;
  }

  /**
   * توضیح فارسی: محاسبه فاصله بین دو نقطه جغرافیایی (کیلومتر)
   * استفاده از فرمول Haversine
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // شعاع زمین به کیلومتر
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // کامنت: حداقل فاصله 5 کیلومتر در نظر گرفته می‌شود
    return Math.max(distance, 5);
  }

  /**
   * توضیح فارسی: تبدیل درجه به رادیان
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * توضیح فارسی: به‌روزرسانی تنظیمات هزینه ارسال
   */
  updateConfig(config: Partial<ShippingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * توضیح فارسی: دریافت تنظیمات فعلی
   */
  getConfig(): ShippingConfig {
    return { ...this.config };
  }
}

