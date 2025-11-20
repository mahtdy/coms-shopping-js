import Product from "../../repositories/admin/product/model";
import ProductRepository from "../../repositories/admin/product/repository";
import Order from "../../repositories/admin/order/model";

/**
 * توضیح فارسی: نوع محصول برای محاسبه هزینه بسته‌بندی
 */
export type ProductPackagingType = "normal" | "fragile" | "large" | "electronic" | "liquid" | "food";

/**
 * توضیح فارسی: تنظیمات هزینه بسته‌بندی
 */
interface PackagingConfig {
  baseCost: number; // هزینه پایه برای هر بسته (تومان)
  costPerItem: number; // هزینه به ازای هر محصول (تومان)
  typeMultipliers: {
    [key in ProductPackagingType]: number;
  };
  bulkDiscountThreshold: number; // تعداد محصولات برای تخفیف عمده
  bulkDiscountRate: number; // درصد تخفیف عمده (مثلاً 0.1 برای 10%)
}

const DEFAULT_PACKAGING_CONFIG: PackagingConfig = {
  baseCost: 5000, // 5,000 تومان هزینه پایه
  costPerItem: 2000, // 2,000 تومان به ازای هر محصول
  typeMultipliers: {
    normal: 1.0, // ضریب عادی
    fragile: 1.5, // 50% افزایش برای محصولات شکننده
    large: 1.3, // 30% افزایش برای محصولات بزرگ
    electronic: 1.4, // 40% افزایش برای محصولات الکترونیکی
    liquid: 1.6, // 60% افزایش برای محصولات مایع
    food: 1.2, // 20% افزایش برای محصولات غذایی
  },
  bulkDiscountThreshold: 5, // اگر بیشتر از 5 محصول باشد
  bulkDiscountRate: 0.1, // 10% تخفیف
};

/**
 * توضیح فارسی: اطلاعات محصول برای محاسبه هزینه بسته‌بندی
 */
export interface ProductPackagingInfo {
  productId: string;
  quantity: number;
  packagingType?: ProductPackagingType;
  categoryId?: string;
}

/**
 * توضیح فارسی: سرویس محاسبه هزینه بسته‌بندی
 * این سرویس هزینه بسته‌بندی را بر اساس تعداد و نوع محصولات محاسبه می‌کند.
 */
export default class PackagingService {
  private productRepo: ProductRepository;
  private config: PackagingConfig;

  constructor(config?: Partial<PackagingConfig>) {
    this.productRepo = new ProductRepository();
    this.config = { ...DEFAULT_PACKAGING_CONFIG, ...config };
  }

  /**
   * توضیح فارسی: تعیین نوع بسته‌بندی محصول بر اساس category و features
   */
  private async determineProductType(productId: string): Promise<ProductPackagingType> {
    try {
      const product = await this.productRepo.findById(productId);
      if (!product) {
        return "normal";
      }

      // کامنت: بررسی category برای تعیین نوع محصول
      // می‌توان از نام category استفاده کرد (مثلاً "الکترونیک", "شکننده", ...)
      const categoryName = (product.category as any)?.title || "";
      const categoryNameLower = categoryName.toLowerCase();

      // کامنت: بررسی features برای تعیین نوع محصول
      const features = product.features || [];
      const featureValues = features.flatMap((f) => f.values || []).map((v) => String(v).toLowerCase());

      // کامنت: تشخیص نوع محصول بر اساس category و features
      if (
        categoryNameLower.includes("شکننده") ||
        categoryNameLower.includes("fragile") ||
        featureValues.some((v) => v.includes("شکننده") || v.includes("fragile"))
      ) {
        return "fragile";
      }

      if (
        categoryNameLower.includes("الکترونیک") ||
        categoryNameLower.includes("electronic") ||
        featureValues.some((v) => v.includes("الکترونیک") || v.includes("electronic"))
      ) {
        return "electronic";
      }

      if (
        categoryNameLower.includes("مایع") ||
        categoryNameLower.includes("liquid") ||
        featureValues.some((v) => v.includes("مایع") || v.includes("liquid"))
      ) {
        return "liquid";
      }

      if (
        categoryNameLower.includes("غذایی") ||
        categoryNameLower.includes("food") ||
        featureValues.some((v) => v.includes("غذایی") || v.includes("food"))
      ) {
        return "food";
      }

      if (
        categoryNameLower.includes("بزرگ") ||
        categoryNameLower.includes("large") ||
        featureValues.some((v) => v.includes("بزرگ") || v.includes("large"))
      ) {
        return "large";
      }

      return "normal";
    } catch (error: any) {
      console.error("خطا در تعیین نوع محصول:", error);
      return "normal"; // کامنت: در صورت خطا، نوع عادی در نظر گرفته می‌شود
    }
  }

  /**
   * توضیح فارسی: محاسبه هزینه بسته‌بندی برای یک سفارش
   * @param orderList لیست محصولات سفارش
   * @returns هزینه بسته‌بندی (تومان)
   */
  async calculatePackagingCost(orderList: Order["orderList"]): Promise<number> {
    if (!orderList || orderList.length === 0) {
      return 0;
    }

    let totalCost = this.config.baseCost; // کامنت: هزینه پایه
    let totalItems = 0;
    const typeCosts: { [key in ProductPackagingType]?: number } = {};

    // کامنت: محاسبه هزینه برای هر محصول
    for (const item of orderList) {
      const productId =
        typeof item.product === "string"
          ? item.product
          : (item.product as any)?._id?.toString() || (item.product as any)?.toString();

      if (!productId) {
        continue;
      }

      const packagingType = await this.determineProductType(productId);
      const quantity = item.quantity || 1;
      totalItems += quantity;

      // کامنت: محاسبه هزینه برای این محصول
      const itemCost = this.config.costPerItem * quantity;
      const multiplier = this.config.typeMultipliers[packagingType] || 1.0;
      const adjustedCost = itemCost * multiplier;

      // کامنت: جمع‌آوری هزینه‌ها بر اساس نوع
      if (!typeCosts[packagingType]) {
        typeCosts[packagingType] = 0;
      }
      typeCosts[packagingType]! += adjustedCost;
    }

    // کامنت: اضافه کردن هزینه‌های هر نوع به هزینه پایه
    for (const type in typeCosts) {
      totalCost += typeCosts[type as ProductPackagingType] || 0;
    }

    // کامنت: اعمال تخفیف عمده (اگر تعداد محصولات بیشتر از threshold باشد)
    if (totalItems >= this.config.bulkDiscountThreshold) {
      const discount = totalCost * this.config.bulkDiscountRate;
      totalCost -= discount;
    }

    // کامنت: گرد کردن به هزار تومان
    return Math.ceil(totalCost / 1000) * 1000;
  }

  /**
   * توضیح فارسی: محاسبه سریع هزینه بسته‌بندی (بدون بررسی نوع محصول)
   * این متد برای محاسبات سریع استفاده می‌شود و همه محصولات را عادی در نظر می‌گیرد.
   * @param itemCount تعداد محصولات
   * @returns هزینه بسته‌بندی (تومان)
   */
  calculateQuickPackagingCost(itemCount: number): number {
    if (itemCount === 0) {
      return 0;
    }

    let totalCost = this.config.baseCost + this.config.costPerItem * itemCount;

    // کامنت: اعمال تخفیف عمده
    if (itemCount >= this.config.bulkDiscountThreshold) {
      const discount = totalCost * this.config.bulkDiscountRate;
      totalCost -= discount;
    }

    // کامنت: گرد کردن به هزار تومان
    return Math.ceil(totalCost / 1000) * 1000;
  }

  /**
   * توضیح فارسی: دریافت جزئیات هزینه بسته‌بندی
   * این متد جزئیات کامل محاسبه را برمی‌گرداند.
   */
  async getPackagingDetails(orderList: Order["orderList"]): Promise<{
    baseCost: number;
    itemsCost: number;
    typeBreakdown: { type: ProductPackagingType; cost: number; count: number }[];
    bulkDiscount: number;
    totalCost: number;
  }> {
    if (!orderList || orderList.length === 0) {
      return {
        baseCost: 0,
        itemsCost: 0,
        typeBreakdown: [],
        bulkDiscount: 0,
        totalCost: 0,
      };
    }

    const baseCost = this.config.baseCost;
    let itemsCost = 0;
    let totalItems = 0;
    const typeBreakdown: { [key in ProductPackagingType]?: { cost: number; count: number } } = {};

    // کامنت: محاسبه هزینه برای هر محصول
    for (const item of orderList) {
      const productId =
        typeof item.product === "string"
          ? item.product
          : (item.product as any)?._id?.toString() || (item.product as any)?.toString();

      if (!productId) {
        continue;
      }

      const packagingType = await this.determineProductType(productId);
      const quantity = item.quantity || 1;
      totalItems += quantity;

      const itemCost = this.config.costPerItem * quantity;
      const multiplier = this.config.typeMultipliers[packagingType] || 1.0;
      const adjustedCost = itemCost * multiplier;
      itemsCost += adjustedCost;

      if (!typeBreakdown[packagingType]) {
        typeBreakdown[packagingType] = { cost: 0, count: 0 };
      }
      typeBreakdown[packagingType]!.cost += adjustedCost;
      typeBreakdown[packagingType]!.count += quantity;
    }

    const totalBeforeDiscount = baseCost + itemsCost;
    let bulkDiscount = 0;

    if (totalItems >= this.config.bulkDiscountThreshold) {
      bulkDiscount = totalBeforeDiscount * this.config.bulkDiscountRate;
    }

    const totalCost = Math.ceil((totalBeforeDiscount - bulkDiscount) / 1000) * 1000;

    return {
      baseCost,
      itemsCost,
      typeBreakdown: Object.entries(typeBreakdown).map(([type, data]) => ({
        type: type as ProductPackagingType,
        cost: data!.cost,
        count: data!.count,
      })),
      bulkDiscount,
      totalCost,
    };
  }
}

