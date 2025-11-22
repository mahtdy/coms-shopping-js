import SalesReportService from "./salesReportService";
import OrderReportService from "./orderReportService";
import InventoryReportService from "./inventoryReportService";
import OrderRepository from "../../repositories/admin/order/repository";

/**
 * توضیح فارسی: نوع دوره برای مقایسه
 */
export type PeriodType = "day" | "week" | "month" | "quarter" | "year";

/**
 * توضیح فارسی: نتیجه مقایسه
 */
export interface ComparisonResult {
  current: number; // مقدار دوره فعلی
  previous: number; // مقدار دوره قبلی
  change: number; // تغییر مطلق
  changePercent: number; // درصد تغییر
  trend: "up" | "down" | "stable"; // روند
}

/**
 * توضیح فارسی: گزارش مقایسه‌ای فروش
 */
export interface SalesComparisonReport {
  period: {
    current: { start: Date; end: Date; label: string };
    previous: { start: Date; end: Date; label: string };
  };
  totalOrders: ComparisonResult;
  totalRevenue: ComparisonResult;
  totalCost: ComparisonResult;
  totalProfit: ComparisonResult;
  averageOrderValue: ComparisonResult;
  totalDiscountAmount: ComparisonResult;
  completedOrders: ComparisonResult;
  cancelledOrders: ComparisonResult;
}

/**
 * توضیح فارسی: گزارش مقایسه‌ای سفارش
 */
export interface OrderComparisonReport {
  period: {
    current: { start: Date; end: Date; label: string };
    previous: { start: Date; end: Date; label: string };
  };
  totalOrders: ComparisonResult;
  pendingOrders: ComparisonResult;
  confirmedOrders: ComparisonResult;
  processingOrders: ComparisonResult;
  completedOrders: ComparisonResult;
  cancelledOrders: ComparisonResult;
  averageDeliveryTime: ComparisonResult;
}

/**
 * توضیح فارسی: گزارش مقایسه‌ای موجودی
 */
export interface InventoryComparisonReport {
  period: {
    current: { start: Date; end: Date; label: string };
    previous: { start: Date; end: Date; label: string };
  };
  totalProducts: ComparisonResult;
  totalQuantity: ComparisonResult;
  totalValue: ComparisonResult;
  lowStockCount: ComparisonResult;
  movementCount: ComparisonResult;
}

/**
 * توضیح فارسی: گزارش مقایسه‌ای کامل
 */
export interface FullComparisonReport {
  period: {
    current: { start: Date; end: Date; label: string };
    previous: { start: Date; end: Date; label: string };
  };
  sales: SalesComparisonReport;
  orders: OrderComparisonReport;
  inventory: InventoryComparisonReport;
}

/**
 * توضیح فارسی: سرویس گزارش‌های مقایسه‌ای
 * این سرویس مقایسه دوره‌های مختلف را انجام می‌دهد و درصد تغییرات را محاسبه می‌کند.
 */
export default class ComparisonReportService {
  private salesReportService: SalesReportService;
  private orderReportService: OrderReportService;
  private inventoryReportService: InventoryReportService;
  private orderRepo: OrderRepository;

  constructor() {
    this.salesReportService = new SalesReportService();
    this.orderReportService = new OrderReportService();
    this.inventoryReportService = new InventoryReportService();
    this.orderRepo = new OrderRepository();
  }

  /**
   * توضیح فارسی: محاسبه نتیجه مقایسه
   */
  private calculateComparison(current: number, previous: number): ComparisonResult {
    const change = current - previous;
    const changePercent = previous === 0 ? (current > 0 ? 100 : 0) : (change / previous) * 100;
    
    let trend: "up" | "down" | "stable";
    if (Math.abs(changePercent) < 1) {
      trend = "stable"; // تغییر کمتر از 1% = پایدار
    } else if (changePercent > 0) {
      trend = "up";
    } else {
      trend = "down";
    }

    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 100) / 100, // گرد کردن به 2 رقم اعشار
      trend,
    };
  }

  /**
   * توضیح فارسی: محاسبه بازه زمانی دوره قبلی
   */
  private calculatePreviousPeriod(
    currentStart: Date,
    currentEnd: Date,
    periodType: PeriodType
  ): { start: Date; end: Date } {
    const currentDuration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime() - 1); // یک روز قبل از شروع دوره فعلی
    const previousStart = new Date(previousEnd.getTime() - currentDuration);

    return { start: previousStart, end: previousEnd };
  }

  /**
   * توضیح فارسی: تولید برچسب دوره
   */
  private getPeriodLabel(start: Date, end: Date, periodType: PeriodType): string {
    if (periodType === "day") {
      return start.toLocaleDateString("fa-IR");
    } else if (periodType === "week") {
      const weekNumber = this.getWeekNumber(start);
      return `${start.getFullYear()}-W${weekNumber}`;
    } else if (periodType === "month") {
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    } else if (periodType === "quarter") {
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `${start.getFullYear()}-Q${quarter}`;
    } else {
      return String(start.getFullYear());
    }
  }

  /**
   * توضیح فارسی: محاسبه شماره هفته
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای فروش
   * @param startDate تاریخ شروع دوره فعلی
   * @param endDate تاریخ پایان دوره فعلی
   * @param periodType نوع دوره (برای محاسبه دوره قبلی)
   */
  async getSalesComparison(
    startDate: Date,
    endDate: Date,
    periodType: PeriodType = "month"
  ): Promise<SalesComparisonReport> {
    // کامنت: محاسبه دوره قبلی
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate, periodType);

    // کامنت: دریافت گزارش‌های دوره فعلی و قبلی
    const [currentSummary, previousSummary] = await Promise.all([
      this.salesReportService.getSalesSummary(startDate, endDate),
      this.salesReportService.getSalesSummary(previousPeriod.start, previousPeriod.end),
    ]);

    return {
      period: {
        current: {
          start: startDate,
          end: endDate,
          label: this.getPeriodLabel(startDate, endDate, periodType),
        },
        previous: {
          start: previousPeriod.start,
          end: previousPeriod.end,
          label: this.getPeriodLabel(previousPeriod.start, previousPeriod.end, periodType),
        },
      },
      totalOrders: this.calculateComparison(currentSummary.totalOrders, previousSummary.totalOrders),
      totalRevenue: this.calculateComparison(currentSummary.totalRevenue, previousSummary.totalRevenue),
      totalCost: this.calculateComparison(currentSummary.totalCost, previousSummary.totalCost),
      totalProfit: this.calculateComparison(currentSummary.totalProfit, previousSummary.totalProfit),
      averageOrderValue: this.calculateComparison(
        currentSummary.averageOrderValue,
        previousSummary.averageOrderValue
      ),
      totalDiscountAmount: this.calculateComparison(
        currentSummary.totalDiscountAmount,
        previousSummary.totalDiscountAmount
      ),
      completedOrders: this.calculateComparison(
        currentSummary.completedOrders,
        previousSummary.completedOrders
      ),
      cancelledOrders: this.calculateComparison(
        currentSummary.cancelledOrders,
        previousSummary.cancelledOrders
      ),
    };
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای سفارش
   */
  async getOrderComparison(
    startDate: Date,
    endDate: Date,
    periodType: PeriodType = "month"
  ): Promise<OrderComparisonReport> {
    // کامنت: محاسبه دوره قبلی
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate, periodType);

    // کامنت: دریافت گزارش‌های دوره فعلی و قبلی
    const [currentStatusReport, previousStatusReport, currentDeliveryTime, previousDeliveryTime] =
      await Promise.all([
        this.orderReportService.getOrderStatusReport(startDate, endDate),
        this.orderReportService.getOrderStatusReport(previousPeriod.start, previousPeriod.end),
        this.orderReportService.getDeliveryTimeReport(startDate, endDate),
        this.orderReportService.getDeliveryTimeReport(previousPeriod.start, previousPeriod.end),
      ]);

    // کامنت: محاسبه تعداد کل سفارش‌ها
    const currentTotal = currentStatusReport.reduce((sum, item) => sum + item.count, 0);
    const previousTotal = previousStatusReport.reduce((sum, item) => sum + item.count, 0);

    // کامنت: استخراج تعداد سفارش‌ها بر اساس وضعیت
    const getStatusCount = (
      reports: any[],
      status: "pending" | "confirmed" | "processing" | "completed" | "cancelled"
    ) => {
      const found = reports.find((r) => r.status === status);
      return found ? found.count : 0;
    };

    return {
      period: {
        current: {
          start: startDate,
          end: endDate,
          label: this.getPeriodLabel(startDate, endDate, periodType),
        },
        previous: {
          start: previousPeriod.start,
          end: previousPeriod.end,
          label: this.getPeriodLabel(previousPeriod.start, previousPeriod.end, periodType),
        },
      },
      totalOrders: this.calculateComparison(currentTotal, previousTotal),
      pendingOrders: this.calculateComparison(
        getStatusCount(currentStatusReport, "pending"),
        getStatusCount(previousStatusReport, "pending")
      ),
      confirmedOrders: this.calculateComparison(
        getStatusCount(currentStatusReport, "confirmed"),
        getStatusCount(previousStatusReport, "confirmed")
      ),
      processingOrders: this.calculateComparison(
        getStatusCount(currentStatusReport, "processing"),
        getStatusCount(previousStatusReport, "processing")
      ),
      completedOrders: this.calculateComparison(
        getStatusCount(currentStatusReport, "completed"),
        getStatusCount(previousStatusReport, "completed")
      ),
      cancelledOrders: this.calculateComparison(
        getStatusCount(currentStatusReport, "cancelled"),
        getStatusCount(previousStatusReport, "cancelled")
      ),
      averageDeliveryTime: this.calculateComparison(
        currentDeliveryTime.averageDeliveryTime,
        previousDeliveryTime.averageDeliveryTime
      ),
    };
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای موجودی
   */
  async getInventoryComparison(
    startDate: Date,
    endDate: Date,
    periodType: PeriodType = "month"
  ): Promise<InventoryComparisonReport> {
    // کامنت: محاسبه دوره قبلی
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate, periodType);

    // کامنت: دریافت گزارش‌های دوره فعلی و قبلی
    const [currentSummary, previousSummary, currentLowStock, previousLowStock] = await Promise.all([
      this.inventoryReportService.getInventorySummary(),
      // کامنت: برای موجودی، از همان summary استفاده می‌کنیم (چون موجودی لحظه‌ای است)
      this.inventoryReportService.getInventorySummary(),
      this.inventoryReportService.getLowStockReport(),
      this.inventoryReportService.getLowStockReport(),
    ]);

    // کامنت: دریافت تعداد حرکات موجودی در هر دوره
    const [currentMovements, previousMovements] = await Promise.all([
      this.inventoryReportService.getMovementHistory(startDate, endDate),
      this.inventoryReportService.getMovementHistory(previousPeriod.start, previousPeriod.end),
    ]);

    return {
      period: {
        current: {
          start: startDate,
          end: endDate,
          label: this.getPeriodLabel(startDate, endDate, periodType),
        },
        previous: {
          start: previousPeriod.start,
          end: previousPeriod.end,
          label: this.getPeriodLabel(previousPeriod.start, previousPeriod.end, periodType),
        },
      },
      totalProducts: this.calculateComparison(
        currentSummary.totalProducts,
        previousSummary.totalProducts
      ),
      totalQuantity: this.calculateComparison(
        currentSummary.totalQuantity,
        previousSummary.totalQuantity
      ),
      totalValue: this.calculateComparison(currentSummary.totalValue, previousSummary.totalValue),
      lowStockCount: this.calculateComparison(
        currentLowStock.length,
        previousLowStock.length
      ),
      movementCount: this.calculateComparison(
        currentMovements.length,
        previousMovements.length
      ),
    };
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای کامل (همه بخش‌ها)
   */
  async getFullComparison(
    startDate: Date,
    endDate: Date,
    periodType: PeriodType = "month"
  ): Promise<FullComparisonReport> {
    const [sales, orders, inventory] = await Promise.all([
      this.getSalesComparison(startDate, endDate, periodType),
      this.getOrderComparison(startDate, endDate, periodType),
      this.getInventoryComparison(startDate, endDate, periodType),
    ]);

    return {
      period: sales.period, // کامنت: همه دوره‌ها یکسان هستند
      sales,
      orders,
      inventory,
    };
  }

  /**
   * توضیح فارسی: مقایسه چند دوره (برای نمودار روند)
   * @param startDate تاریخ شروع اولین دوره
   * @param endDate تاریخ پایان آخرین دوره
   * @param periodType نوع دوره
   * @param count تعداد دوره‌ها
   */
  async getTrendComparison(
    startDate: Date,
    endDate: Date,
    periodType: PeriodType,
    count: number = 6
  ): Promise<{
    periods: Array<{ start: Date; end: Date; label: string }>;
    sales: Array<{ period: string; totalRevenue: number; totalOrders: number; totalProfit: number }>;
    orders: Array<{ period: string; totalOrders: number; completedOrders: number }>;
  }> {
    const periods: Array<{ start: Date; end: Date; label: string }> = [];
    const salesData: Array<{
      period: string;
      totalRevenue: number;
      totalOrders: number;
      totalProfit: number;
    }> = [];
    const ordersData: Array<{ period: string; totalOrders: number; completedOrders: number }> = [];

    // کامنت: محاسبه مدت زمان هر دوره
    const periodDuration = endDate.getTime() - startDate.getTime();

    // کامنت: تولید دوره‌ها
    for (let i = count - 1; i >= 0; i--) {
      const periodEnd = new Date(endDate.getTime() - i * periodDuration);
      const periodStart = new Date(periodEnd.getTime() - periodDuration);
      const label = this.getPeriodLabel(periodStart, periodEnd, periodType);

      periods.push({ start: periodStart, end: periodEnd, label });

      // کامنت: دریافت گزارش‌های این دوره
      const [salesSummary, orderStatusReport] = await Promise.all([
        this.salesReportService.getSalesSummary(periodStart, periodEnd),
        this.orderReportService.getOrderStatusReport(periodStart, periodEnd),
      ]);

      salesData.push({
        period: label,
        totalRevenue: salesSummary.totalRevenue,
        totalOrders: salesSummary.totalOrders,
        totalProfit: salesSummary.totalProfit,
      });

      const totalOrders = orderStatusReport.reduce((sum, item) => sum + item.count, 0);
      const completedOrders = orderStatusReport.find((r) => r.status === "completed")?.count || 0;

      ordersData.push({
        period: label,
        totalOrders,
        completedOrders,
      });
    }

    return {
      periods,
      sales: salesData,
      orders: ordersData,
    };
  }

  /**
   * توضیح فارسی: مقایسه چند دوره (برای نمودارهای پیشرفته)
   * @param periods آرایه دوره‌ها برای مقایسه
   */
  async getMultiPeriodComparison(periods: Array<{ start: Date; end: Date; label: string }>): Promise<{
    periods: Array<{ start: Date; end: Date; label: string }>;
    sales: Array<{
      period: string;
      totalRevenue: number;
      totalOrders: number;
      totalProfit: number;
      averageOrderValue: number;
    }>;
    orders: Array<{
      period: string;
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
    }>;
  }> {
    const salesData: Array<{
      period: string;
      totalRevenue: number;
      totalOrders: number;
      totalProfit: number;
      averageOrderValue: number;
    }> = [];
    const ordersData: Array<{
      period: string;
      totalOrders: number;
      completedOrders: number;
      cancelledOrders: number;
    }> = [];

    // کامنت: دریافت گزارش‌های همه دوره‌ها
    for (const period of periods) {
      const [salesSummary, orderStatusReport] = await Promise.all([
        this.salesReportService.getSalesSummary(period.start, period.end),
        this.orderReportService.getOrderStatusReport(period.start, period.end),
      ]);

      salesData.push({
        period: period.label,
        totalRevenue: salesSummary.totalRevenue,
        totalOrders: salesSummary.totalOrders,
        totalProfit: salesSummary.totalProfit,
        averageOrderValue: salesSummary.averageOrderValue,
      });

      const totalOrders = orderStatusReport.reduce((sum, item) => sum + item.count, 0);
      const completedOrders = orderStatusReport.find((r) => r.status === "completed")?.count || 0;
      const cancelledOrders = orderStatusReport.find((r) => r.status === "cancelled")?.count || 0;

      ordersData.push({
        period: period.label,
        totalOrders,
        completedOrders,
        cancelledOrders,
      });
    }

    return {
      periods,
      sales: salesData,
      orders: ordersData,
    };
  }

  /**
   * توضیح فارسی: دریافت گزارش مقایسه‌ای بر اساس محصول
   */
  async getProductComparison(
    productId: string,
    startDate: Date,
    endDate: Date,
    periodType: PeriodType = "month"
  ): Promise<{
    period: {
      current: { start: Date; end: Date; label: string };
      previous: { start: Date; end: Date; label: string };
    };
    totalQuantitySold: ComparisonResult;
    totalRevenue: ComparisonResult;
    totalProfit: ComparisonResult;
    averagePrice: ComparisonResult;
    orderCount: ComparisonResult;
  }> {
    // کامنت: محاسبه دوره قبلی
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate, periodType);

    // کامنت: دریافت گزارش فروش محصول
    const [currentProductReport, previousProductReport] = await Promise.all([
      this.salesReportService.getProductSalesReport(startDate, endDate),
      this.salesReportService.getProductSalesReport(previousPeriod.start, previousPeriod.end),
    ]);

    // کامنت: پیدا کردن محصول در گزارش‌ها
    const currentProduct = currentProductReport.find((p) => p.productId === productId);
    const previousProduct = previousProductReport.find((p) => p.productId === productId);

    const currentData = currentProduct || {
      totalQuantitySold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averagePrice: 0,
      orderCount: 0,
    };

    const previousData = previousProduct || {
      totalQuantitySold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averagePrice: 0,
      orderCount: 0,
    };

    return {
      period: {
        current: {
          start: startDate,
          end: endDate,
          label: this.getPeriodLabel(startDate, endDate, periodType),
        },
        previous: {
          start: previousPeriod.start,
          end: previousPeriod.end,
          label: this.getPeriodLabel(previousPeriod.start, previousPeriod.end, periodType),
        },
      },
      totalQuantitySold: this.calculateComparison(
        currentData.totalQuantitySold,
        previousData.totalQuantitySold
      ),
      totalRevenue: this.calculateComparison(currentData.totalRevenue, previousData.totalRevenue),
      totalProfit: this.calculateComparison(currentData.totalProfit, previousData.totalProfit),
      averagePrice: this.calculateComparison(currentData.averagePrice, previousData.averagePrice),
      orderCount: this.calculateComparison(currentData.orderCount, previousData.orderCount),
    };
  }
}

