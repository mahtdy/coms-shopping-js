import Discount from "../../repositories/admin/discount/model";
import DiscountRepository from "../../repositories/admin/discount/repository";
import { UserInfo } from "../../core/mongoose-controller/auth/user/userAuthenticator";
import OrderRepository from "../../repositories/admin/order/repository";
import ProductRepository from "../../repositories/admin/product/repository";
import Product from "../../repositories/admin/product/model";

/**
 * توضیح فارسی: نتیجه اعمال تخفیف
 */
export interface DiscountResult {
  discount: Discount;
  discountAmount: number;      // مقدار تخفیف (به تومان)
  finalPrice: number;          // قیمت نهایی پس از تخفیف
  isValid: boolean;            // آیا تخفیف معتبر است
  message?: string;            // پیام خطا یا موفقیت
}

/**
 * توضیح فارسی: سرویس مدیریت و اعمال تخفیف‌ها
 */
/**
 * توضیح فارسی: اطلاعات محصول برای بررسی فیلترهای تخفیف
 */
export interface ProductInfo {
  productId: string;
  categoryId?: string;
  brandId?: string;
  variantFeatures?: { [key: string]: string }; // مثل { color: "red", size: "M" }
  price: number;
}

/**
 * توضیح فارسی: اطلاعات کاربر برای بررسی فیلترهای تخفیف
 */
export interface UserDiscountInfo {
  userId: string;
  gender?: "male" | "female";
  age?: number;
  isFirstOrder?: boolean;
}

export default class DiscountService {
  private discountRepo: DiscountRepository;
  private orderRepo: OrderRepository;
  private productRepo: ProductRepository;

  constructor() {
    this.discountRepo = new DiscountRepository();
    this.orderRepo = new OrderRepository();
    this.productRepo = new ProductRepository();
  }

  /**
   * توضیح فارسی: بررسی فیلترهای محصول
   */
  private checkProductFilters(
    discount: Discount,
    products: ProductInfo[]
  ): boolean {
    const filter = discount.filters?.productFilter;
    if (!filter) return true;

    // اگر allProducts فعال باشد، همه محصولات مجاز هستند
    if (filter.allProducts) return true;

    // بررسی category
    if (filter.category && filter.category.length > 0) {
      const hasMatchingCategory = products.some(
        (p) => p.categoryId && filter.category!.includes(p.categoryId)
      );
      if (!hasMatchingCategory) return false;
    }

    // بررسی brand
    if (filter.brand && filter.brand.length > 0) {
      const hasMatchingBrand = products.some(
        (p) => p.brandId && filter.brand!.includes(p.brandId)
      );
      if (!hasMatchingBrand) return false;
    }

    // بررسی applyOnProducts, applyOnCategories, applyOnBrands
    if (discount.applyOnProducts && discount.applyOnProducts.length > 0) {
      const hasMatchingProduct = products.some((p) =>
        discount.applyOnProducts!.includes(p.productId)
      );
      if (!hasMatchingProduct) return false;
    }

    if (discount.applyOnCategories && discount.applyOnCategories.length > 0) {
      const hasMatchingCategory = products.some(
        (p) => p.categoryId && discount.applyOnCategories!.includes(p.categoryId)
      );
      if (!hasMatchingCategory) return false;
    }

    if (discount.applyOnBrands && discount.applyOnBrands.length > 0) {
      const hasMatchingBrand = products.some(
        (p) => p.brandId && discount.applyOnBrands!.includes(p.brandId)
      );
      if (!hasMatchingBrand) return false;
    }

    // بررسی variantFilter
    if (discount.variantFilter && discount.variantFilter.length > 0) {
      for (const vf of discount.variantFilter) {
        const hasMatchingVariant = products.some((p) => {
          if (!p.variantFeatures) return false;
          const value = p.variantFeatures[vf.featureKey];
          if (!value) return false;
          if (!vf.featureValues || vf.featureValues.length === 0) return true;
          return vf.featureValues.includes(value);
        });
        if (!hasMatchingVariant) return false;
      }
    }

    return true;
  }

  /**
   * توضیح فارسی: بررسی فیلترهای کاربر
   */
  private checkUserFilters(
    discount: Discount,
    userInfo?: UserDiscountInfo
  ): boolean {
    const filter = discount.filters?.userFilter;
    if (!filter) return true;

    // اگر allUsers فعال باشد، همه کاربران مجاز هستند
    if (filter.allUsers) return true;

    // بررسی gender
    if (filter.gender && userInfo?.gender) {
      if (filter.gender !== userInfo.gender) return false;
    }

    // بررسی ageRange
    if (filter.ageRange && userInfo?.age) {
      const { from, to } = filter.ageRange;
      if (userInfo.age < from || userInfo.age > to) return false;
    }

    return true;
  }

  /**
   * توضیح فارسی: بررسی event-based discounts
   */
  private checkEventFilters(discount: Discount): boolean {
    if (!discount.eventStart || !discount.eventEnd) return true;

    const now = new Date();
    return discount.eventStart <= now && discount.eventEnd >= now;
  }

  /**
   * توضیح فارسی: اعتبارسنجی و اعمال کد تخفیف
   * @param discountCode کد تخفیف
   * @param totalPrice قیمت کل قبل از تخفیف
   * @param user اطلاعات کاربر (برای بررسی محدودیت‌ها)
   * @param orderList لیست محصولات سفارش (برای بررسی فیلترهای محصول)
   * @param products اطلاعات محصولات (برای بررسی فیلترهای دقیق‌تر)
   * @returns نتیجه اعمال تخفیف
   */
  async applyDiscountCode(
    discountCode: string,
    totalPrice: number,
    user?: UserInfo,
    orderList?: any[],
    products?: ProductInfo[]
  ): Promise<DiscountResult> {
    // کامنت: یافتن تخفیف با کد مشخص شده
    const discount = await this.discountRepo.findOne({
      disCode: discountCode,
      isActive: true,
    });

    if (!discount) {
      return {
        discount: null as any,
        discountAmount: 0,
        finalPrice: totalPrice,
        isValid: false,
        message: "کد تخفیف معتبر نیست.",
      };
    }

    // کامنت: بررسی بازه زمانی
    const now = new Date();
    if (discount.disStart > now || discount.disEnd < now) {
      return {
        discount,
        discountAmount: 0,
        finalPrice: totalPrice,
        isValid: false,
        message: "کد تخفیف منقضی شده است.",
      };
    }

    // کامنت: بررسی محدودیت اولین خرید
    if (discount.firstInvoiceOnly && user) {
      const userOrdersCount = await this.orderRepo.count({ user: user.id });
      if (userOrdersCount > 0) {
        return {
          discount,
          discountAmount: 0,
          finalPrice: totalPrice,
          isValid: false,
          message: "این کد تخفیف فقط برای اولین خرید معتبر است.",
        };
      }
    }

    // کامنت: بررسی بازه مبلغی
    if (
      totalPrice < discount.amountRange.from ||
      totalPrice > discount.amountRange.to
    ) {
      return {
        discount,
        discountAmount: 0,
        finalPrice: totalPrice,
        isValid: false,
        message: `مبلغ سفارش باید بین ${discount.amountRange.from.toLocaleString()} تا ${discount.amountRange.to.toLocaleString()} تومان باشد.`,
      };
    }

    // کامنت: بررسی تعداد استفاده
    if (discount.usageCount !== undefined && discount.usageCount <= 0) {
      return {
        discount,
        discountAmount: 0,
        finalPrice: totalPrice,
        isValid: false,
        message: "تعداد استفاده از این کد تخفیف به پایان رسیده است.",
      };
    }

    // کامنت: بررسی فیلترهای محصول
    if (products && products.length > 0) {
      if (!this.checkProductFilters(discount, products)) {
        return {
          discount,
          discountAmount: 0,
          finalPrice: totalPrice,
          isValid: false,
          message: "این کد تخفیف برای محصولات انتخاب شده معتبر نیست.",
        };
      }
    }

    // کامنت: بررسی فیلترهای کاربر
    if (user) {
      const userDiscountInfo: UserDiscountInfo = {
        userId: user.id,
        isFirstOrder: discount.firstInvoiceOnly,
        // TODO: باید از user model اطلاعات gender و age را بگیریم
      };
      if (!this.checkUserFilters(discount, userDiscountInfo)) {
        return {
          discount,
          discountAmount: 0,
          finalPrice: totalPrice,
          isValid: false,
          message: "این کد تخفیف برای شما معتبر نیست.",
        };
      }
    }

    // کامنت: بررسی event-based discounts
    if (discount.eventStart && discount.eventEnd) {
      if (!this.checkEventFilters(discount)) {
        return {
          discount,
          discountAmount: 0,
          finalPrice: totalPrice,
          isValid: false,
          message: "این کد تخفیف در حال حاضر فعال نیست.",
        };
      }
    }

    // کامنت: محاسبه مقدار تخفیف
    let discountAmount = 0;
    if (discount.disValue.type === "fixed") {
      discountAmount = discount.disValue.fixedAmount || 0;
    } else if (discount.disValue.type === "percent") {
      discountAmount = Math.floor(
        ((discount.disValue.fixedAmount || 0) / 100) * totalPrice
      );
    } else if (discount.disValue.type === "random") {
      const { from, to } = discount.disValue.randomRange || { from: 0, to: 0 };
      discountAmount = Math.floor(Math.random() * (to - from + 1)) + from;
    }

    // کامنت: بررسی محدودیت سود (اگر فعال باشد)
    // در اینجا نمی‌توانیم سود را محاسبه کنیم چون totalCost نداریم
    // این بررسی در checkout انجام می‌شود

    // کامنت: محاسبه قیمت نهایی
    const finalPrice = Math.max(0, totalPrice - discountAmount);

    return {
      discount,
      discountAmount,
      finalPrice,
      isValid: true,
      message: "کد تخفیف با موفقیت اعمال شد.",
    };
  }

  /**
   * توضیح فارسی: اعتبارسنجی کد تخفیف بدون اعمال
   */
  async validateDiscountCode(
    discountCode: string,
    totalPrice: number,
    user?: UserInfo
  ): Promise<{ isValid: boolean; message: string; discount?: Discount }> {
    const result = await this.applyDiscountCode(discountCode, totalPrice, user);
    return {
      isValid: result.isValid,
      message: result.message || "",
      discount: result.isValid ? result.discount : undefined,
    };
  }

  /**
   * توضیح فارسی: کاهش تعداد استفاده از کد تخفیف
   */
  async decreaseUsageCount(discountId: string): Promise<void> {
    await this.discountRepo.collection.findByIdAndUpdate(discountId, {
      $inc: { usageCount: -1 },
    });
  }

  /**
   * توضیح فارسی: یافتن و اعمال تخفیف‌های خودکار روی محصولات
   * این متد تخفیف‌های فعال که autoApplyOnInvoice یا autoApplyOnEvent دارند را پیدا می‌کند
   */
  async findAutoApplyDiscounts(
    products: ProductInfo[],
    totalPrice: number,
    userInfo?: UserDiscountInfo
  ): Promise<Discount[]> {
    const now = new Date();
    const activeDiscounts = await this.discountRepo.find({
      isActive: true,
      $or: [
        { autoApplyOnInvoice: true },
        { autoApplyOnEvent: true },
      ],
      disStart: { $lte: now },
      disEnd: { $gte: now },
    });

    // کامنت: فیلتر کردن تخفیف‌ها بر اساس شرایط
    const applicableDiscounts: Discount[] = [];

    for (const discount of activeDiscounts) {
      // بررسی بازه مبلغی
      if (
        totalPrice < discount.amountRange.from ||
        totalPrice > discount.amountRange.to
      ) {
        continue;
      }

      // بررسی فیلترهای محصول
      if (!this.checkProductFilters(discount, products)) {
        continue;
      }

      // بررسی فیلترهای کاربر
      if (userInfo && !this.checkUserFilters(discount, userInfo)) {
        continue;
      }

      // بررسی event-based
      if (discount.eventStart && discount.eventEnd) {
        if (!this.checkEventFilters(discount)) {
          continue;
        }
      }

      // بررسی تعداد استفاده
      if (discount.usageCount !== undefined && discount.usageCount <= 0) {
        continue;
      }

      applicableDiscounts.push(discount);
    }

    // کامنت: مرتب‌سازی بر اساس اولویت (اگر وجود داشته باشد)
    // در حال حاضر همه تخفیف‌ها را برمی‌گردانیم
    return applicableDiscounts;
  }

  /**
   * توضیح فارسی: محاسبه مجموع تخفیف‌های خودکار
   * این متد تخفیف‌های خودکار را پیدا کرده و مجموع تخفیف را محاسبه می‌کند
   */
  async calculateAutoDiscounts(
    products: ProductInfo[],
    totalPrice: number,
    totalCost: number,
    userInfo?: UserDiscountInfo
  ): Promise<{
    discounts: Discount[];
    totalDiscountAmount: number;
    finalPrice: number;
  }> {
    const applicableDiscounts = await this.findAutoApplyDiscounts(
      products,
      totalPrice,
      userInfo
    );

    let totalDiscountAmount = 0;
    const appliedDiscounts: Discount[] = [];

    for (const discount of applicableDiscounts) {
      let discountAmount = 0;

      // محاسبه مقدار تخفیف
      if (discount.disValue.type === "fixed") {
        discountAmount = discount.disValue.fixedAmount || 0;
      } else if (discount.disValue.type === "percent") {
        discountAmount = Math.floor(
          ((discount.disValue.fixedAmount || 0) / 100) * totalPrice
        );
      } else if (discount.disValue.type === "random") {
        const { from, to } = discount.disValue.randomRange || { from: 0, to: 0 };
        discountAmount = Math.floor(Math.random() * (to - from + 1)) + from;
      }

      // بررسی محدودیت سود
      if (discount.maxProfitLimit) {
        const profit = totalPrice - totalCost;
        if (discountAmount > profit) {
          discountAmount = profit;
        }
      }

      totalDiscountAmount += discountAmount;
      appliedDiscounts.push(discount);
    }

    const finalPrice = Math.max(0, totalPrice - totalDiscountAmount);

    return {
      discounts: appliedDiscounts,
      totalDiscountAmount,
      finalPrice,
    };
  }

  /**
   * توضیح فارسی: دریافت تخفیف‌های فعال برای یک محصول خاص
   */
  async getProductDiscounts(
    productId: string,
    categoryId?: string,
    brandId?: string,
    variantFeatures?: { [key: string]: string }
  ): Promise<Discount[]> {
    return this.discountRepo.findActiveForProductAndVariant(
      productId,
      categoryId,
      brandId,
      variantFeatures
    );
  }

  /**
   * توضیح فارسی: محاسبه قیمت نهایی محصول با در نظر گیری تخفیف‌های فعال
   */
  async calculateProductFinalPrice(
    productId: string,
    basePrice: number,
    categoryId?: string,
    brandId?: string,
    variantFeatures?: { [key: string]: string }
  ): Promise<{
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    discounts: Discount[];
  }> {
    const discounts = await this.getProductDiscounts(
      productId,
      categoryId,
      brandId,
      variantFeatures
    );

    let discountAmount = 0;
    let currentPrice = basePrice;

    for (const discount of discounts) {
      if (discount.disValue.type === "fixed") {
        discountAmount += discount.disValue.fixedAmount || 0;
        currentPrice -= discount.disValue.fixedAmount || 0;
      } else if (discount.disValue.type === "percent") {
        const discountValue = Math.floor(
          ((discount.disValue.fixedAmount || 0) / 100) * currentPrice
        );
        discountAmount += discountValue;
        currentPrice -= discountValue;
      }
    }

    return {
      originalPrice: basePrice,
      discountAmount,
      finalPrice: Math.max(0, currentPrice),
      discounts,
    };
  }
}

