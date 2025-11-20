import Address from "../../repositories/admin/address/model";
import Order from "../../repositories/admin/order/model";
import ProductRepository from "../../repositories/admin/product/repository";
import ProductWarehouseRepository from "../../repositories/admin/productWarehouse/repository";

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
  private productRepo: ProductRepository;
  private productWarehouseRepo: ProductWarehouseRepository;

  constructor(config?: Partial<ShippingConfig>) {
    this.config = { ...DEFAULT_SHIPPING_CONFIG, ...config };
    this.productRepo = new ProductRepository();
    this.productWarehouseRepo = new ProductWarehouseRepository();
  }

  /**
   * توضیح فارسی: محاسبه وزن کل سفارش از لیست محصولات
   * @param orderList لیست محصولات سفارش
   * @returns وزن کل به کیلوگرم
   */
  async calculateOrderWeight(orderList: Order["orderList"]): Promise<number> {
    let totalWeight = 0; // وزن کل به کیلوگرم

    for (const item of orderList) {
      const productId =
        typeof item.product === "string"
          ? item.product
          : (item.product as any)?._id?.toString() || (item.product as any)?.toString();

      if (!productId) {
        continue;
      }

      try {
        const product = await this.productRepo.findById(productId);
        if (!product) {
          continue;
        }

        // کامنت: استخراج وزن از config یا features
        let itemWeight = 0.5; // وزن پیش‌فرض: 500 گرم

        // کامنت: بررسی config برای وزن
        if ((product as any).config && (product as any).config.weight) {
          itemWeight = parseFloat((product as any).config.weight) || 0.5;
        }

        // کامنت: بررسی features برای وزن
        if (product.features && product.features.length > 0) {
          for (const feature of product.features) {
            const featureValues = feature.values || [];
            for (const value of featureValues) {
              const valueStr = String(value).toLowerCase();
              if (valueStr.includes("وزن") || valueStr.includes("weight")) {
                // کامنت: استخراج عدد از مقدار
                const weightMatch = valueStr.match(/(\d+\.?\d*)/);
                if (weightMatch) {
                  itemWeight = parseFloat(weightMatch[1]) || 0.5;
                  // کامنت: اگر واحد کیلوگرم نباشد (مثلاً گرم)، تبدیل می‌کنیم
                  if (valueStr.includes("گرم") || valueStr.includes("gram") || valueStr.includes("g")) {
                    itemWeight = itemWeight / 1000; // تبدیل گرم به کیلوگرم
                  }
                }
              }
            }
          }
        }

        // کامنت: محاسبه وزن کل این محصول (وزن × تعداد)
        const quantity = item.quantity || 1;
        totalWeight += itemWeight * quantity;
      } catch (error: any) {
        console.error(`خطا در محاسبه وزن محصول ${productId}:`, error);
        // کامنت: در صورت خطا، وزن پیش‌فرض استفاده می‌شود
        totalWeight += 0.5 * (item.quantity || 1);
      }
    }

    // کامنت: حداقل وزن 0.5 کیلوگرم
    return Math.max(totalWeight, 0.5);
  }

  /**
   * توضیح فارسی: محاسبه حجم بسته از لیست محصولات
   * @param orderList لیست محصولات سفارش
   * @returns حجم بسته به متر مکعب
   */
  async calculatePackageVolume(orderList: Order["orderList"]): Promise<number> {
    let totalVolume = 0; // حجم کل به متر مکعب

    for (const item of orderList) {
      const productId =
        typeof item.product === "string"
          ? item.product
          : (item.product as any)?._id?.toString() || (item.product as any)?.toString();

      if (!productId) {
        continue;
      }

      try {
        const product = await this.productRepo.findById(productId);
        if (!product) {
          continue;
        }

        // کامنت: ابعاد پیش‌فرض (سانتی‌متر)
        let width = 10; // عرض
        let height = 10; // ارتفاع
        let depth = 10; // عمق

        // کامنت: بررسی config برای ابعاد
        if ((product as any).config) {
          if ((product as any).config.width) {
            width = parseFloat((product as any).config.width) || 10;
          }
          if ((product as any).config.height) {
            height = parseFloat((product as any).config.height) || 10;
          }
          if ((product as any).config.depth) {
            depth = parseFloat((product as any).config.depth) || 10;
          }
        }

        // کامنت: بررسی features برای ابعاد
        if (product.features && product.features.length > 0) {
          for (const feature of product.features) {
            const featureValues = feature.values || [];
            for (const value of featureValues) {
              const valueStr = String(value).toLowerCase();
              // کامنت: استخراج ابعاد از features (مثال: "20x30x15")
              const dimensionMatch = valueStr.match(/(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)/);
              if (dimensionMatch) {
                width = parseFloat(dimensionMatch[1]) || width;
                height = parseFloat(dimensionMatch[2]) || height;
                depth = parseFloat(dimensionMatch[3]) || depth;
              }
            }
          }
        }

        // کامنت: محاسبه حجم (سانتی‌متر مکعب) و تبدیل به متر مکعب
        const itemVolume = (width * height * depth) / 1000000; // تبدیل سانتی‌متر مکعب به متر مکعب
        const quantity = item.quantity || 1;
        totalVolume += itemVolume * quantity;
      } catch (error: any) {
        console.error(`خطا در محاسبه حجم محصول ${productId}:`, error);
        // کامنت: در صورت خطا، حجم پیش‌فرض استفاده می‌شود
        totalVolume += 0.001 * (item.quantity || 1); // 0.001 متر مکعب (10x10x10 سانتی‌متر)
      }
    }

    return totalVolume;
  }

  /**
   * توضیح فارسی: محاسبه هزینه ارسال بر اساس پارامترهای مختلف
   * @param address آدرس مقصد
   * @param sendType نوع ارسال
   * @param sendTime زمان ارسال
   * @param isBig آیا بسته بزرگ است
   * @param weight وزن بسته (کیلوگرم) - اختیاری (اگر مشخص نشود، از orderList محاسبه می‌شود)
   * @param orderList لیست محصولات سفارش (برای محاسبه وزن و حجم)
   * @param originAddress آدرس مبدا (اختیاری - برای محاسبه فاصله)
   * @returns هزینه ارسال به تومان
   */
  async calculateShippingCost(
    address: Address | any,
    sendType: SendType = 1,
    sendTime: SendTime = 2,
    isBig: boolean = false,
    weight?: number,
    orderList?: Order["orderList"],
    originAddress?: { lat: number; lng: number }
  ): Promise<number> {
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

    // کامنت: محاسبه وزن واقعی از orderList (اگر مشخص نشده باشد)
    let actualWeight = weight;
    if (!actualWeight && orderList && orderList.length > 0) {
      actualWeight = await this.calculateOrderWeight(orderList);
    } else if (!actualWeight) {
      actualWeight = 0.5; // وزن پیش‌فرض: 500 گرم
    }

    // کامنت: محاسبه حجم بسته (برای تشخیص بسته بزرگ)
    let packageVolume = 0;
    if (orderList && orderList.length > 0) {
      packageVolume = await this.calculatePackageVolume(orderList);
    }

    // کامنت: تشخیص خودکار بسته بزرگ بر اساس حجم (بیش از 0.1 متر مکعب)
    const isActuallyBig = isBig || packageVolume > 0.1;

    // کامنت: محاسبه فاصله دقیق با استفاده از فرمول Haversine
    const distance = this.calculateDistance(
      originAddress || { lat: 35.6892, lng: 51.3890 }, // تهران به عنوان مبدا پیش‌فرض
      destinationLocation
    );

    // کامنت: محاسبه هزینه پایه
    let cost = this.config.basePrice;

    // کامنت: اضافه کردن هزینه بر اساس فاصله (با دقت بیشتر)
    // برای فاصله‌های کوتاه (کمتر از 10 کیلومتر)، هزینه کمتر
    // برای فاصله‌های متوسط (10-50 کیلومتر)، هزینه استاندارد
    // برای فاصله‌های طولانی (بیش از 50 کیلومتر)، هزینه بیشتر
    let distanceCost = 0;
    if (distance < 10) {
      distanceCost = distance * this.config.perKmPrice * 0.8; // 20% تخفیف برای فاصله کوتاه
    } else if (distance <= 50) {
      distanceCost = distance * this.config.perKmPrice;
    } else {
      distanceCost = distance * this.config.perKmPrice * 1.2; // 20% اضافه برای فاصله طولانی
    }
    cost += distanceCost;

    // کامنت: اعمال ضریب نوع ارسال
    const sendTypeMultiplier = this.config.sendTypeMultipliers[sendType] || 1.0;
    cost *= sendTypeMultiplier;

    // کامنت: اعمال ضریب زمان ارسال (فوری)
    if (sendTime === 1) {
      cost *= this.config.urgentMultiplier;
    }

    // کامنت: اعمال ضریب بسته بزرگ (بر اساس حجم یا isBig)
    if (isActuallyBig) {
      cost *= this.config.bigPackageMultiplier;
    }

    // کامنت: اضافه کردن هزینه بر اساس وزن واقعی
    // برای وزن کمتر از 1 کیلوگرم: بدون هزینه اضافی
    // برای وزن 1-5 کیلوگرم: 5,000 تومان به ازای هر کیلوگرم اضافی
    // برای وزن 5-10 کیلوگرم: 7,000 تومان به ازای هر کیلوگرم اضافی
    // برای وزن بیشتر از 10 کیلوگرم: 10,000 تومان به ازای هر کیلوگرم اضافی
    if (actualWeight > 1) {
      let weightExtra = 0;
      if (actualWeight <= 5) {
        weightExtra = (actualWeight - 1) * 5000; // 5,000 تومان به ازای هر کیلوگرم
      } else if (actualWeight <= 10) {
        weightExtra = 4 * 5000 + (actualWeight - 5) * 7000; // 4 کیلوگرم اول + بقیه
      } else {
        weightExtra = 4 * 5000 + 5 * 7000 + (actualWeight - 10) * 10000; // 4 + 5 + بقیه
      }
      cost += weightExtra;
    }

    // کامنت: اضافه کردن هزینه بر اساس حجم (برای بسته‌های حجیم)
    if (packageVolume > 0.05) {
      // کامنت: برای حجم بیشتر از 0.05 متر مکعب، هزینه اضافی
      const volumeExtra = (packageVolume - 0.05) * 50000; // 50,000 تومان به ازای هر 0.01 متر مکعب اضافی
      cost += volumeExtra;
    }

    // کامنت: گرد کردن به هزار تومان
    return Math.ceil(cost / 1000) * 1000;
  }

  /**
   * توضیح فارسی: محاسبه فاصله بین دو نقطه جغرافیایی (کیلومتر)
   * استفاده از فرمول Haversine (دقیق‌تر از فرمول ساده)
   * این فرمول فاصله کروی بین دو نقطه روی کره زمین را محاسبه می‌کند.
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    // کامنت: بررسی اعتبار مختصات
    if (
      !point1 ||
      !point2 ||
      isNaN(point1.lat) ||
      isNaN(point1.lng) ||
      isNaN(point2.lat) ||
      isNaN(point2.lng)
    ) {
      return 10; // فاصله پیش‌فرض در صورت خطا
    }

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
    // کامنت: حداکثر فاصله 2000 کیلومتر (برای جلوگیری از خطا)
    return Math.max(Math.min(distance, 2000), 5);
  }

  /**
   * توضیح فارسی: محاسبه فاصله جاده‌ای (اختیاری - برای آینده)
   * این متد می‌تواند از API نقشه (مثل Google Maps, Mapbox) استفاده کند
   * برای محاسبه دقیق‌تر فاصله جاده‌ای.
   * @param point1 نقطه مبدا
   * @param point2 نقطه مقصد
   * @param useApi آیا از API استفاده شود (پیش‌فرض: false)
   * @returns فاصله جاده‌ای به کیلومتر
   */
  async calculateRoadDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
    useApi: boolean = false
  ): Promise<number> {
    // کامنت: در حال حاضر از Haversine استفاده می‌کنیم
    // در آینده می‌توان از API نقشه استفاده کرد:
    // - Google Maps Distance Matrix API
    // - Mapbox Directions API
    // - Neshan API (برای ایران)
    const haversineDistance = this.calculateDistance(point1, point2);

    if (useApi) {
      // TODO: پیاده‌سازی استفاده از API نقشه
      // کامنت: در حال حاضر از Haversine استفاده می‌کنیم
      // فاصله جاده‌ای معمولاً 1.2 تا 1.5 برابر فاصله مستقیم است
      return haversineDistance * 1.3;
    }

    return haversineDistance;
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

