import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import OrderStatusHistory, { OrderStatusHistoryModel } from "./model";

export default class OrderStatusHistoryRepository extends BaseRepositoryService<OrderStatusHistory> {
  constructor(options?: RepositoryConfigOptions) {
    super(OrderStatusHistoryModel, options);
  }

  /**
   * توضیح فارسی: دریافت تاریخچه یک سفارش
   */
  async getOrderHistory(orderId: string) {
    return this.find(
      { order: orderId },
      { sort: { timestamp: -1 } } // کامنت: جدیدترین اول
    );
  }

  /**
   * توضیح فارسی: دریافت آخرین تغییر وضعیت یک سفارش
   */
  async getLastStatusChange(orderId: string) {
    return this.findOne(
      { order: orderId },
      { sort: { timestamp: -1 } }
    );
  }

  /**
   * توضیح فارسی: دریافت تاریخچه تغییرات بر اساس وضعیت
   */
  async getHistoryByStatus(
    status: "pending" | "confirmed" | "processing" | "completed" | "cancelled",
    startDate?: Date,
    endDate?: Date
  ) {
    const filter: any = { newStatus: status };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }
    return this.find(filter, { sort: { timestamp: -1 } });
  }

  /**
   * توضیح فارسی: دریافت تاریخچه تغییرات توسط یک ادمین
   */
  async getHistoryByAdmin(adminId: string, startDate?: Date, endDate?: Date) {
    const filter: any = { changedBy: adminId };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }
    return this.find(filter, { sort: { timestamp: -1 } });
  }

  /**
   * توضیح فارسی: دریافت آمار تغییرات وضعیت
   */
  async getStatusChangeStats(startDate?: Date, endDate?: Date) {
    const filter: any = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    // کامنت: استفاده از aggregation برای آمار
    const stats = await this.collection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$newStatus",
          count: { $sum: 1 },
          avgDuration: { $avg: "$duration" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  }

  /**
   * توضیح فارسی: دریافت مدت زمان متوسط در هر وضعیت
   */
  async getAverageDurationByStatus() {
    const stats = await this.collection.aggregate([
      {
        $match: {
          duration: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$oldStatus",
          avgDuration: { $avg: "$duration" },
          minDuration: { $min: "$duration" },
          maxDuration: { $max: "$duration" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgDuration: -1 } },
    ]);

    return stats;
  }
}

