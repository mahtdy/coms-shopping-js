import ProductWarehouseRepository from "../../repositories/admin/productWarehouse/repository";
import InventoryHistoryRepository from "../../repositories/admin/inventoryHistory/repository";
import WarehouseRepository from "../../repositories/admin/warehouse/repository";
import Productwarehouse from "../../repositories/admin/productWarehouse/model";
import InventoryHistory from "../../repositories/admin/inventoryHistory/model";

/**
 * توضیح فارسی: سرویس گزارش‌دهی موجودی
 * این سرویس گزارش‌های مختلفی از موجودی انبار را تولید می‌کند.
 */

/**
 * توضیح فارسی: گزارش موجودی کم
 */
export interface LowStockReport {
  productWarehouse: Productwarehouse;
  currentQuantity: number;
  threshold: number;
  shortage: number; // کمبود
}

/**
 * توضیح فارسی: گزارش حرکت موجودی
 */
export interface MovementReport {
  date: Date;
  changeType: "purchase" | "sale" | "transfer" | "adjustment";
  quantity: number;
  reason: string;
  inventoryId: string;
}

/**
 * توضیح فارسی: گزارش موجودی بر اساس انبار
 */
export interface WarehouseInventoryReport {
  warehouseId: string;
  warehouseName: string;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number; // ارزش کل موجودی
  lowStockItems: number;
}

/**
 * توضیح فارسی: سرویس گزارش‌دهی موجودی
 */
export default class InventoryReportService {
  private productWarehouseRepo: ProductWarehouseRepository;
  private historyRepo: InventoryHistoryRepository;
  private warehouseRepo: WarehouseRepository;

  constructor() {
    this.productWarehouseRepo = new ProductWarehouseRepository();
    this.historyRepo = new InventoryHistoryRepository();
    this.warehouseRepo = new WarehouseRepository();
  }

  /**
   * توضیح فارسی: دریافت گزارش موجودی کم
   * @param warehouseId شناسه انبار (اختیاری)
   * @param threshold آستانه موجودی کم (پیش‌فرض: 10)
   * @returns لیست محصولات با موجودی کم
   */
  async getLowStockReport(
    warehouseId?: string,
    threshold: number = 10
  ): Promise<LowStockReport[]> {
    const filter: any = {
      quantity: { $lte: threshold },
    };
    if (warehouseId) {
      filter.warehouse = warehouseId;
    }

    const lowStockItems = await this.productWarehouseRepo.find(filter);
    
    return lowStockItems.map((item) => ({
      productWarehouse: item,
      currentQuantity: item.quantity,
      threshold: item.minStockThreshold || threshold,
      shortage: Math.max(0, (item.minStockThreshold || threshold) - item.quantity),
    }));
  }

  /**
   * توضیح فارسی: دریافت تاریخچه حرکت موجودی
   * @param inventoryId شناسه موجودی (اختیاری)
   * @param warehouseId شناسه انبار (اختیاری)
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @param changeType نوع تغییر (اختیاری)
   * @param page شماره صفحه
   * @param limit تعداد در هر صفحه
   * @returns تاریخچه حرکت موجودی
   */
  async getMovementHistory(
    inventoryId?: string,
    warehouseId?: string,
    startDate?: Date,
    endDate?: Date,
    changeType?: "purchase" | "sale" | "transfer" | "adjustment",
    page: number = 1,
    limit: number = 50
  ): Promise<{ history: MovementReport[]; total: number }> {
    const filter: any = {};

    if (inventoryId) {
      filter.inventory_id = inventoryId;
    }

    if (changeType) {
      filter.change_type = changeType;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    // اگر warehouseId مشخص شده باشد، باید از طریق inventory_id فیلتر کنیم
    if (warehouseId) {
      const inventories = await this.productWarehouseRepo.find({ warehouse: warehouseId });
      const inventoryIds = inventories.map((inv) => inv._id);
      filter.inventory_id = { $in: inventoryIds };
    }

    const history = await this.historyRepo.find(filter, {
      skip: (page - 1) * limit,
      limit,
      sort: { timestamp: -1 },
    });

    const total = await this.historyRepo.count(filter);

    return {
      history: history.map((item) => ({
        date: item.timestamp,
        changeType: item.change_type,
        quantity: item.quantity_changed,
        reason: item.reason,
        inventoryId: item.inventory_id.toString(),
      })),
      total,
    };
  }

  /**
   * توضیح فارسی: دریافت گزارش موجودی بر اساس انبار
   * @param warehouseId شناسه انبار (اختیاری - اگر مشخص نشود، همه انبارها)
   * @returns گزارش موجودی انبارها
   */
  async getWarehouseInventoryReport(
    warehouseId?: string
  ): Promise<WarehouseInventoryReport[]> {
    const warehouses = warehouseId
      ? [await this.warehouseRepo.findById(warehouseId)]
      : await this.warehouseRepo.find({ is_active: true });

    const reports: WarehouseInventoryReport[] = [];

    for (const warehouse of warehouses) {
      if (!warehouse) continue;

      const inventories = await this.productWarehouseRepo.find({
        warehouse: warehouse._id,
      });

      const totalProducts = inventories.length;
      const totalQuantity = inventories.reduce(
        (sum, inv) => sum + (inv.quantity || 0),
        0
      );
      const totalValue = inventories.reduce(
        (sum, inv) => sum + (inv.quantity || 0) * (inv.purchasePrice || 0),
        0
      );
      const lowStockItems = inventories.filter(
        (inv) => (inv.quantity || 0) <= (inv.minStockThreshold || 10)
      ).length;

      reports.push({
        warehouseId: warehouse._id.toString(),
        warehouseName: warehouse.title,
        totalProducts,
        totalQuantity,
        totalValue,
        lowStockItems,
      });
    }

    return reports;
  }

  /**
   * توضیح فارسی: دریافت خلاصه موجودی (برای داشبورد)
   * @returns خلاصه موجودی
   */
  async getInventorySummary(): Promise<{
    totalWarehouses: number;
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    recentMovements: MovementReport[];
  }> {
    const warehouses = await this.warehouseRepo.find({ is_active: true });
    const allInventories = await this.productWarehouseRepo.find({});

    const totalWarehouses = warehouses.length;
    const totalProducts = allInventories.length;
    const totalQuantity = allInventories.reduce(
      (sum, inv) => sum + (inv.quantity || 0),
      0
    );
    const totalValue = allInventories.reduce(
      (sum, inv) => sum + (inv.quantity || 0) * (inv.purchasePrice || 0),
      0
    );
    const lowStockCount = allInventories.filter(
      (inv) => (inv.quantity || 0) <= (inv.minStockThreshold || 10)
    ).length;

    // کامنت: دریافت آخرین حرکات موجودی
    const recentHistory = await this.historyRepo.find(
      {},
      { limit: 10, sort: { timestamp: -1 } }
    );

    const recentMovements: MovementReport[] = recentHistory.map((item) => ({
      date: item.timestamp,
      changeType: item.change_type,
      quantity: item.quantity_changed,
      reason: item.reason,
      inventoryId: item.inventory_id.toString(),
    }));

    return {
      totalWarehouses,
      totalProducts,
      totalQuantity,
      totalValue,
      lowStockCount,
      recentMovements,
    };
  }

  /**
   * توضیح فارسی: دریافت گزارش موجودی یک محصول خاص
   * @param productId شناسه محصول
   * @returns لیست موجودی محصول در همه انبارها
   */
  async getProductInventoryReport(productId: string): Promise<{
    productId: string;
    inventories: Array<{
      warehouseId: string;
      warehouseName: string;
      quantity: number;
      variantPrice: number;
      purchasePrice: number;
      batchNumber: string;
    }>;
    totalQuantity: number;
  }> {
    const inventories = await this.productWarehouseRepo.find({
      product: productId,
    });

    const inventoriesWithWarehouse = await Promise.all(
      inventories.map(async (inv) => {
        const warehouse = await this.warehouseRepo.findById(
          inv.warehouse as string
        );
        return {
          warehouseId: inv.warehouse.toString(),
          warehouseName: warehouse?.title || "Unknown",
          quantity: inv.quantity,
          variantPrice: inv.variantPrice || inv.price,
          purchasePrice: inv.purchasePrice,
          batchNumber: inv.batchNumber,
        };
      })
    );

    const totalQuantity = inventories.reduce(
      (sum, inv) => sum + (inv.quantity || 0),
      0
    );

    return {
      productId,
      inventories: inventoriesWithWarehouse,
      totalQuantity,
    };
  }
}

