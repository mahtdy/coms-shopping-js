import OrderRepository from "../../repositories/admin/order/repository";
import Order from "../../repositories/admin/order/model";
import ProductRepository from "../../repositories/admin/product/repository";
import DiscountRepository from "../../repositories/admin/discount/repository";
import ProductWarehouseRepository from "../../repositories/admin/productWarehouse/repository";

/**
 * توضیح فارسی: سرویس گزارش‌دهی فروش
 * این سرویس گزارش‌های مختلفی از فروش را تولید می‌کند.
 */

/**
 * توضیح فارسی: گزارش فروش روزانه/هفتگی/ماهانه
 */
export interface SalesPeriodReport {
  period: string; // "2025-01-15" یا "2025-W03" یا "2025-01"
  totalOrders: number;
  totalRevenue: number; // درآمد کل
  totalCost: number; // هزینه کل
  totalProfit: number; // سود کل
  averageOrderValue: number; // میانگین ارزش سفارش
  totalDiscountAmount: number; // مجموع تخفیف‌ها
  totalShippingCost: number; // مجموع هزینه ارسال
  totalTaxAmount: number; // مجموع مالیات
}

/**
 * توضیح فارسی: گزارش فروش بر اساس محصول
 */
export interface ProductSalesReport {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averagePrice: number;
  orderCount: number;
}

/**
 * توضیح فارسی: گزارش فروش بر اساس دسته‌بندی
 */
export interface CategorySalesReport {
  categoryId: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  productCount: number;
  orderCount: number;
}

/**
 * توضیح فارسی: گزارش فروش بر اساس برند
 */
export interface BrandSalesReport {
  brandId: string;
  brandName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  productCount: number;
  orderCount: number;
}

/**
 * توضیح فارسی: خلاصه فروش
 */
export interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalProfitMargin: number; // درصد سود
  averageOrderValue: number;
  totalDiscountAmount: number;
  totalShippingCost: number;
  totalTaxAmount: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

/**
 * توضیح فارسی: سرویس گزارش‌دهی فروش
 */
export default class SalesReportService {
  private orderRepo: OrderRepository;
  private productWarehouseRepo: ProductWarehouseRepository;
  private productRepo: ProductRepository;
  private discountRepo: DiscountRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.productWarehouseRepo = new ProductWarehouseRepository();
    this.productRepo = new ProductRepository();
    this.discountRepo = new DiscountRepository();
  }

  /**
   * توضیح فارسی: دریافت خلاصه فروش
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @returns خلاصه فروش
   */
  async getSalesSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<SalesSummary> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderRepo.find(filter);

    let totalOrders = orders.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscountAmount = 0;
    let totalShippingCost = 0;
    let totalTaxAmount = 0;
    let completedOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;

    for (const order of orders) {
      totalRevenue += order.finalTotal || order.totalPriceProducts || 0;
      totalCost += order.totalCost || 0;
      totalDiscountAmount += order.discountAmount || 0;
      totalShippingCost += order.shippingCost || 0;
      totalTaxAmount += order.taxAmount || 0;

      if (order.orderStatus === "completed") completedOrders++;
      else if (order.orderStatus === "pending") pendingOrders++;
      else if (order.orderStatus === "cancelled") cancelledOrders++;
    }

    const totalProfit = totalRevenue - totalCost;
    const totalProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      totalProfitMargin,
      averageOrderValue,
      totalDiscountAmount,
      totalShippingCost,
      totalTaxAmount,
      completedOrders,
      pendingOrders,
      cancelledOrders,
    };
  }

  /**
   * توضیح فارسی: دریافت گزارش فروش دوره‌ای (روزانه/هفتگی/ماهانه)
   * @param startDate تاریخ شروع
   * @param endDate تاریخ پایان
   * @param periodType نوع دوره ("daily" | "weekly" | "monthly")
   * @returns گزارش فروش دوره‌ای
   */
  async getPeriodSalesReport(
    startDate: Date,
    endDate: Date,
    periodType: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<SalesPeriodReport[]> {
    const filter: any = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const orders = await this.orderRepo.find(filter);

    // کامنت: گروه‌بندی سفارش‌ها بر اساس دوره
    const periodMap = new Map<string, {
      orders: Order[];
      totalRevenue: number;
      totalCost: number;
      totalDiscountAmount: number;
      totalShippingCost: number;
      totalTaxAmount: number;
    }>();

    for (const order of orders) {
      let periodKey = "";
      const orderDate = new Date(order.createdAt);

      if (periodType === "daily") {
        periodKey = orderDate.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (periodType === "weekly") {
        const year = orderDate.getFullYear();
        const week = this.getWeekNumber(orderDate);
        periodKey = `${year}-W${week.toString().padStart(2, "0")}`;
      } else if (periodType === "monthly") {
        periodKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, "0")}`;
      }

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          orders: [],
          totalRevenue: 0,
          totalCost: 0,
          totalDiscountAmount: 0,
          totalShippingCost: 0,
          totalTaxAmount: 0,
        });
      }

      const periodData = periodMap.get(periodKey)!;
      periodData.orders.push(order);
      periodData.totalRevenue += order.finalTotal || order.totalPriceProducts || 0;
      periodData.totalCost += order.totalCost || 0;
      periodData.totalDiscountAmount += order.discountAmount || 0;
      periodData.totalShippingCost += order.shippingCost || 0;
      periodData.totalTaxAmount += order.taxAmount || 0;
    }

    // کامنت: تبدیل به آرایه گزارش
    const reports: SalesPeriodReport[] = [];
    for (const [period, data] of periodMap.entries()) {
      const totalOrders = data.orders.length;
      const totalProfit = data.totalRevenue - data.totalCost;
      const averageOrderValue = totalOrders > 0 ? data.totalRevenue / totalOrders : 0;

      reports.push({
        period,
        totalOrders,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit,
        averageOrderValue,
        totalDiscountAmount: data.totalDiscountAmount,
        totalShippingCost: data.totalShippingCost,
        totalTaxAmount: data.totalTaxAmount,
      });
    }

    // کامنت: مرتب‌سازی بر اساس دوره
    reports.sort((a, b) => a.period.localeCompare(b.period));

    return reports;
  }

  /**
   * توضیح فارسی: دریافت گزارش فروش بر اساس محصول
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @param limit تعداد محصولات برتر (اختیاری)
   * @returns گزارش فروش محصولات
   */
  async getProductSalesReport(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<ProductSalesReport[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderRepo.find(filter);

    // کامنت: جمع‌آوری اطلاعات فروش هر محصول
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      totalQuantitySold: number;
      totalRevenue: number;
      totalCost: number;
      orderCount: number;
      prices: number[];
    }>();

    for (const order of orders) {
      for (const item of order.orderList) {
        const productId = typeof item.product === "string"
          ? item.product
          : (item.product as any)?._id?.toString() || (item.product as any)?.toString();

        if (!productMap.has(productId)) {
          const product = await this.productRepo.findById(productId);
          productMap.set(productId, {
            productId,
            productName: product?.title || "Unknown",
            totalQuantitySold: 0,
            totalRevenue: 0,
            totalCost: 0,
            orderCount: 0,
            prices: [],
          });
        }

        const productData = productMap.get(productId)!;
        productData.totalQuantitySold += item.quantity;
        productData.totalRevenue += item.price * item.quantity;
        
        // کامنت: محاسبه totalCost از productwarehouse
        try {
          const productWarehouse = await this.productWarehouseRepo.findOne({
            product: productId,
          });
          if (productWarehouse && productWarehouse.purchasePrice) {
            productData.totalCost += productWarehouse.purchasePrice * item.quantity;
          }
        } catch (error) {
          // کامنت: در صورت خطا، totalCost را 0 می‌گذاریم
          console.warn(`خطا در دریافت purchasePrice برای محصول ${productId}:`, error);
        }
        
        productData.orderCount++;
        productData.prices.push(item.price);
      }
    }

    // کامنت: تبدیل به آرایه گزارش
    const reports: ProductSalesReport[] = [];
    for (const [productId, data] of productMap.entries()) {
      const averagePrice = data.prices.length > 0
        ? data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length
        : 0;
      const totalProfit = data.totalRevenue - data.totalCost;

      reports.push({
        productId: data.productId,
        productName: data.productName,
        totalQuantitySold: data.totalQuantitySold,
        totalRevenue: data.totalRevenue,
        totalCost: data.totalCost,
        totalProfit,
        averagePrice,
        orderCount: data.orderCount,
      });
    }

    // کامنت: مرتب‌سازی بر اساس درآمد
    reports.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // کامنت: محدود کردن تعداد در صورت نیاز
    if (limit && limit > 0) {
      return reports.slice(0, limit);
    }

    return reports;
  }

  /**
   * توضیح فارسی: محاسبه شماره هفته
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

