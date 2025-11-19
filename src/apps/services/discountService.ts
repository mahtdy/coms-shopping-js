import Discount from "../../repositories/admin/discount/model";
import DiscountRepository from "../../repositories/admin/discount/repository";
import { UserInfo } from "../../core/mongoose-controller/auth/user/userAuthenticator";
import OrderRepository from "../../repositories/admin/order/repository";

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
export default class DiscountService {
  private discountRepo: DiscountRepository;
  private orderRepo: OrderRepository;

  constructor() {
    this.discountRepo = new DiscountRepository();
    this.orderRepo = new OrderRepository();
  }

  /**
   * توضیح فارسی: اعتبارسنجی و اعمال کد تخفیف
   * @param discountCode کد تخفیف
   * @param totalPrice قیمت کل قبل از تخفیف
   * @param user اطلاعات کاربر (برای بررسی محدودیت‌ها)
   * @param orderList لیست محصولات سفارش (برای بررسی فیلترهای محصول)
   * @returns نتیجه اعمال تخفیف
   */
  async applyDiscountCode(
    discountCode: string,
    totalPrice: number,
    user?: UserInfo,
    orderList?: any[]
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
}

