import BaseController, { ControllerOptions } from "../../../core/mongoose-controller/controller";
import { Response } from "../../../core/controller";
import { Get } from "../../../core/decorators/method";
import { Query } from "../../../core/decorators/parameters";
import { z } from "zod";
import SalesReportService from "../../services/salesReportService";
import OrderReportService from "../../services/orderReportService";
import InventoryReportService from "../../services/inventoryReportService";
import ComparisonReportService from "../../services/comparisonReportService";

/**
 * توضیح فارسی: کنترلر گزارش‌ها
 * این کنترلر همه گزارش‌های سیستم را جمع‌آوری و ارائه می‌دهد.
 */
export class ReportController extends BaseController<any> {
  private salesReportService: SalesReportService;
  private orderReportService: OrderReportService;
  private inventoryReportService: InventoryReportService;
  private comparisonReportService: ComparisonReportService;

  constructor(baseRoute: string, options?: ControllerOptions) {
    super(baseRoute, {} as any, options);
    this.salesReportService = new SalesReportService();
    this.orderReportService = new OrderReportService();
    this.inventoryReportService = new InventoryReportService();
    this.comparisonReportService = new ComparisonReportService();
  }

  initApis() {
    super.initApis();
  }

  /**
   * توضیح فارسی: دریافت خلاصه فروش
   */
  @Get("/sales/summary")
  async getSalesSummary(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const summary = await this.salesReportService.getSalesSummary(startDate, endDate);

      return {
        status: 200,
        data: summary,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت خلاصه فروش",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش فروش دوره‌ای
   */
  @Get("/sales/period")
  async getPeriodSalesReport(
    @Query({
      schema: z.object({
        startDate: z.string(),
        endDate: z.string(),
        periodType: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      }),
    })
    query: { startDate: string; endDate: string; periodType: "daily" | "weekly" | "monthly" }
  ): Promise<Response> {
    try {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      const report = await this.salesReportService.getPeriodSalesReport(
        startDate,
        endDate,
        query.periodType
      );

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش فروش دوره‌ای",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش فروش بر اساس محصول
   */
  @Get("/sales/products")
  async getProductSalesReport(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string; limit?: number }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const report = await this.salesReportService.getProductSalesReport(
        startDate,
        endDate,
        query.limit
      );

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش فروش محصولات",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش وضعیت سفارش
   */
  @Get("/orders/status")
  async getOrderStatusReport(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const report = await this.orderReportService.getOrderStatusReport(startDate, endDate);

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش وضعیت سفارش",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش وضعیت ارسال
   */
  @Get("/orders/delivery-status")
  async getDeliveryStatusReport(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const report = await this.orderReportService.getDeliveryStatusReport(startDate, endDate);

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش وضعیت ارسال",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش سفارش بر اساس منطقه
   */
  @Get("/orders/regions")
  async getRegionOrderReport(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const report = await this.orderReportService.getRegionOrderReport(startDate, endDate);

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش سفارش بر اساس منطقه",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش زمان تحویل
   */
  @Get("/orders/delivery-time")
  async getDeliveryTimeReport(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const report = await this.orderReportService.getDeliveryTimeReport(startDate, endDate);

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش زمان تحویل",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش سفارش‌های مشکل‌دار
   */
  @Get("/orders/problematic")
  async getProblematicOrdersReport(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      const report = await this.orderReportService.getProblematicOrdersReport(startDate, endDate);

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش سفارش‌های مشکل‌دار",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت خلاصه موجودی
   */
  @Get("/inventory/summary")
  async getInventorySummary(): Promise<Response> {
    try {
      const summary = await this.inventoryReportService.getInventorySummary();

      return {
        status: 200,
        data: summary,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت خلاصه موجودی",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت گزارش موجودی کم
   */
  @Get("/inventory/low-stock")
  async getLowStockReport(
    @Query({
      schema: z.object({
        warehouseId: z.string().optional(),
        threshold: z.number().default(10),
      }),
    })
    query: { warehouseId?: string; threshold: number }
  ): Promise<Response> {
    try {
      const report = await this.inventoryReportService.getLowStockReport(
        query.warehouseId,
        query.threshold
      );

      return {
        status: 200,
        data: report,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش موجودی کم",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت داشبورد کامل (همه گزارش‌ها)
   */
  @Get("/dashboard")
  async getDashboard(
    @Query({
      schema: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    })
    query: { startDate?: string; endDate?: string }
  ): Promise<Response> {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : undefined;
      const endDate = query.endDate ? new Date(query.endDate) : undefined;

      // کامنت: دریافت همه گزارش‌های اصلی
      const [
        salesSummary,
        orderStatusReport,
        deliveryStatusReport,
        inventorySummary,
        lowStockReport,
      ] = await Promise.all([
        this.salesReportService.getSalesSummary(startDate, endDate),
        this.orderReportService.getOrderStatusReport(startDate, endDate),
        this.orderReportService.getDeliveryStatusReport(startDate, endDate),
        this.inventoryReportService.getInventorySummary(),
        this.inventoryReportService.getLowStockReport(),
      ]);

      return {
        status: 200,
        data: {
          sales: salesSummary,
          orders: {
            status: orderStatusReport,
            delivery: deliveryStatusReport,
          },
          inventory: {
            summary: inventorySummary,
            lowStock: lowStockReport,
          },
        },
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت داشبورد",
      };
    }
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای فروش
   */
  @Get("/comparison/sales")
  async getSalesComparison(
    @Query({
      schema: z.object({
        startDate: z.string(),
        endDate: z.string(),
        periodType: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      }),
    })
    query: { startDate: string; endDate: string; periodType?: "day" | "week" | "month" | "quarter" | "year" }
  ): Promise<Response> {
    try {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const periodType = query.periodType || "month";

      const comparison = await this.comparisonReportService.getSalesComparison(
        startDate,
        endDate,
        periodType
      );

      return {
        status: 200,
        data: comparison,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش مقایسه‌ای فروش",
      };
    }
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای سفارش
   */
  @Get("/comparison/orders")
  async getOrderComparison(
    @Query({
      schema: z.object({
        startDate: z.string(),
        endDate: z.string(),
        periodType: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      }),
    })
    query: { startDate: string; endDate: string; periodType?: "day" | "week" | "month" | "quarter" | "year" }
  ): Promise<Response> {
    try {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const periodType = query.periodType || "month";

      const comparison = await this.comparisonReportService.getOrderComparison(
        startDate,
        endDate,
        periodType
      );

      return {
        status: 200,
        data: comparison,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش مقایسه‌ای سفارش",
      };
    }
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای موجودی
   */
  @Get("/comparison/inventory")
  async getInventoryComparison(
    @Query({
      schema: z.object({
        startDate: z.string(),
        endDate: z.string(),
        periodType: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      }),
    })
    query: { startDate: string; endDate: string; periodType?: "day" | "week" | "month" | "quarter" | "year" }
  ): Promise<Response> {
    try {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const periodType = query.periodType || "month";

      const comparison = await this.comparisonReportService.getInventoryComparison(
        startDate,
        endDate,
        periodType
      );

      return {
        status: 200,
        data: comparison,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش مقایسه‌ای موجودی",
      };
    }
  }

  /**
   * توضیح فارسی: گزارش مقایسه‌ای کامل (همه بخش‌ها)
   */
  @Get("/comparison/full")
  async getFullComparison(
    @Query({
      schema: z.object({
        startDate: z.string(),
        endDate: z.string(),
        periodType: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      }),
    })
    query: { startDate: string; endDate: string; periodType?: "day" | "week" | "month" | "quarter" | "year" }
  ): Promise<Response> {
    try {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const periodType = query.periodType || "month";

      const comparison = await this.comparisonReportService.getFullComparison(
        startDate,
        endDate,
        periodType
      );

      return {
        status: 200,
        data: comparison,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش مقایسه‌ای کامل",
      };
    }
  }

  /**
   * توضیح فارسی: گزارش روند (چند دوره)
   */
  @Get("/comparison/trend")
  async getTrendComparison(
    @Query({
      schema: z.object({
        startDate: z.string(),
        endDate: z.string(),
        periodType: z.enum(["day", "week", "month", "quarter", "year"]),
        count: z.number().default(6),
      }),
    })
    query: {
      startDate: string;
      endDate: string;
      periodType: "day" | "week" | "month" | "quarter" | "year";
      count?: number;
    }
  ): Promise<Response> {
    try {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const periodType = query.periodType;
      const count = query.count || 6;

      const trend = await this.comparisonReportService.getTrendComparison(
        startDate,
        endDate,
        periodType,
        count
      );

      return {
        status: 200,
        data: trend,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت گزارش روند",
      };
    }
  }
}

const report = new ReportController("/admin/report", {});
export default report;

