/**
 * توضیح فارسی: سرویس محاسبه مالیات
 * این سرویس مالیات ارزش افزوده و سایر مالیات‌ها را محاسبه می‌کند.
 */

/**
 * توضیح فارسی: تنظیمات مالیات
 */
export interface TaxConfig {
  vatRate: number;        // نرخ مالیات ارزش افزوده (درصد) - پیش‌فرض 9%
  otherTaxRate?: number;  // سایر مالیات‌ها (درصد)
  exemptCategories?: string[]; // دسته‌بندی‌های معاف از مالیات
}

/**
 * توضیح فارسی: نتیجه محاسبه مالیات
 */
export interface TaxResult {
  vatAmount: number;      // مبلغ مالیات ارزش افزوده
  otherTaxAmount: number; // سایر مالیات‌ها
  totalTaxAmount: number; // مجموع مالیات
  priceBeforeTax: number; // قیمت قبل از مالیات
  priceAfterTax: number;  // قیمت پس از مالیات
}

/**
 * توضیح فارسی: سرویس محاسبه مالیات
 */
export default class TaxService {
  private config: TaxConfig;

  constructor(config?: Partial<TaxConfig>) {
    this.config = {
      vatRate: 9, // پیش‌فرض 9% برای مالیات ارزش افزوده
      otherTaxRate: 0,
      exemptCategories: [],
      ...config,
    };
  }

  /**
   * توضیح فارسی: محاسبه مالیات بر اساس قیمت
   * @param price قیمت قبل از مالیات
   * @param isExempt آیا معاف از مالیات است
   * @returns نتیجه محاسبه مالیات
   */
  calculateTax(price: number, isExempt: boolean = false): TaxResult {
    if (isExempt) {
      return {
        vatAmount: 0,
        otherTaxAmount: 0,
        totalTaxAmount: 0,
        priceBeforeTax: price,
        priceAfterTax: price,
      };
    }

    // کامنت: محاسبه مالیات ارزش افزوده
    const vatAmount = Math.floor((price * this.config.vatRate) / 100);

    // کامنت: محاسبه سایر مالیات‌ها
    const otherTaxAmount = this.config.otherTaxRate
      ? Math.floor((price * this.config.otherTaxRate) / 100)
      : 0;

    const totalTaxAmount = vatAmount + otherTaxAmount;
    const priceAfterTax = price + totalTaxAmount;

    return {
      vatAmount,
      otherTaxAmount,
      totalTaxAmount,
      priceBeforeTax: price,
      priceAfterTax,
    };
  }

  /**
   * توضیح فارسی: محاسبه مالیات برای لیست محصولات
   * @param items لیست محصولات با قیمت
   * @param exemptCategoryIds دسته‌بندی‌های معاف از مالیات
   * @returns نتیجه محاسبه مالیات
   */
  calculateTaxForItems(
    items: Array<{ price: number; quantity: number; categoryId?: string }>,
    exemptCategoryIds?: string[]
  ): TaxResult {
    let totalPriceBeforeTax = 0;
    let totalVatAmount = 0;
    let totalOtherTaxAmount = 0;

    for (const item of items) {
      const itemTotalPrice = item.price * item.quantity;
      const isExempt =
        exemptCategoryIds && item.categoryId
          ? exemptCategoryIds.includes(item.categoryId)
          : false;

      const taxResult = this.calculateTax(itemTotalPrice, isExempt);
      totalPriceBeforeTax += taxResult.priceBeforeTax;
      totalVatAmount += taxResult.vatAmount;
      totalOtherTaxAmount += taxResult.otherTaxAmount;
    }

    return {
      vatAmount: totalVatAmount,
      otherTaxAmount: totalOtherTaxAmount,
      totalTaxAmount: totalVatAmount + totalOtherTaxAmount,
      priceBeforeTax: totalPriceBeforeTax,
      priceAfterTax: totalPriceBeforeTax + totalVatAmount + totalOtherTaxAmount,
    };
  }

  /**
   * توضیح فارسی: به‌روزرسانی تنظیمات مالیات
   */
  updateConfig(config: Partial<TaxConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * توضیح فارسی: دریافت تنظیمات فعلی
   */
  getConfig(): TaxConfig {
    return { ...this.config };
  }
}

