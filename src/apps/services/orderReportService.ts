import OrderRepository from "../../repositories/admin/order/repository";
import Order from "../../repositories/admin/order/model";
import AddressRepository from "../../repositories/admin/address/repository";
import PackageRepository from "../../repositories/admin/package/repository";

/**
 * توضیح فارسی: سرویس گزارش‌دهی سفارش
 * این سرویس گزارش‌های مختلفی از وضعیت سفارشات را تولید می‌کند.
 */

/**
 * توضیح فارسی: گزارش وضعیت سفارش
 */
export interface OrderStatusReport {
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  count: number;
  totalRevenue: number;
  percentage: number; // درصد از کل
}

/**
 * توضیح فارسی: گزارش وضعیت ارسال
 */
export interface DeliveryStatusReport {
  status: "pending" | "preparing" | "assigned" | "in_transit" | "delivered" | "failed";
  count: number;
  percentage: number;
}

/**
 * توضیح فارسی: گزارش سفارش بر اساس منطقه
 */
export interface RegionOrderReport {
  province: string;
  city: string;
  orderCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

/**
 * توضیح فارسی: گزارش زمان تحویل
 */
export interface DeliveryTimeReport {
  averageDeliveryTime: number; // روز
  fastestDelivery: number; // روز
  slowestDelivery: number; // روز
  onTimeDeliveryRate: number; // درصد
}

/**
 * توضیح فارسی: گزارش سفارش‌های مشکل‌دار
 */
export interface ProblematicOrdersReport {
  orderId: string;
  orderNumber: string;
  issue: string; // "delivery_failed" | "payment_failed" | "cancelled" | "returned"
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * توضیح فارسی: سرویس گزارش‌دهی سفارش
 */
export default class OrderReportService {
  private orderRepo: OrderRepository;
  private addressRepo: AddressRepository;
  private packageRepo: PackageRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.addressRepo = new AddressRepository();
    this.packageRepo = new PackageRepository();
  }

  /**
   * توضیح فارسی: دریافت گزارش وضعیت سفارش
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @returns گزارش وضعیت سفارش
   */
  async getOrderStatusReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<OrderStatusReport[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderRepo.find(filter);
    const totalOrders = orders.length;

    const statusMap = new Map<string, { count: number; totalRevenue: number }>();

    for (const order of orders) {
      const status = order.orderStatus || "pending";
      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, totalRevenue: 0 });
      }

      const statusData = statusMap.get(status)!;
      statusData.count++;
      statusData.totalRevenue += order.finalTotal || order.totalPriceProducts || 0;
    }

    const reports: OrderStatusReport[] = [];
    for (const [status, data] of statusMap.entries()) {
      reports.push({
        status: status as any,
        count: data.count,
        totalRevenue: data.totalRevenue,
        percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0,
      });
    }

    return reports;
  }

  /**
   * توضیح فارسی: دریافت گزارش وضعیت ارسال
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @returns گزارش وضعیت ارسال
   */
  async getDeliveryStatusReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<DeliveryStatusReport[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderRepo.find(filter);
    const totalOrders = orders.length;

    const statusMap = new Map<string, number>();

    for (const order of orders) {
      const status = order.deliveryStatus || "pending";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }

    const reports: DeliveryStatusReport[] = [];
    for (const [status, count] of statusMap.entries()) {
      reports.push({
        status: status as any,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
      });
    }

    return reports;
  }

  /**
   * توضیح فارسی: دریافت گزارش سفارش بر اساس منطقه
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @returns گزارش سفارش بر اساس منطقه
   */
  async getRegionOrderReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<RegionOrderReport[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderRepo.find(filter);

    const regionMap = new Map<string, {
      province: string;
      city: string;
      orderCount: number;
      totalRevenue: number;
    }>();

    for (const order of orders) {
      if (!order.address) continue;

      const address = await this.addressRepo.findById(order.address as string);
      if (!address || address.addressList.length === 0) continue;

      const defaultAddress = address.addressList.find(addr => addr.isDefault) || address.addressList[0];
      const regionKey = `${defaultAddress.province}-${defaultAddress.city}`;

      if (!regionMap.has(regionKey)) {
        regionMap.set(regionKey, {
          province: defaultAddress.province,
          city: defaultAddress.city,
          orderCount: 0,
          totalRevenue: 0,
        });
      }

      const regionData = regionMap.get(regionKey)!;
      regionData.orderCount++;
      regionData.totalRevenue += order.finalTotal || order.totalPriceProducts || 0;
    }

    const reports: RegionOrderReport[] = [];
    for (const [regionKey, data] of regionMap.entries()) {
      reports.push({
        province: data.province,
        city: data.city,
        orderCount: data.orderCount,
        totalRevenue: data.totalRevenue,
        averageOrderValue: data.orderCount > 0 ? data.totalRevenue / data.orderCount : 0,
      });
    }

    // کامنت: مرتب‌سازی بر اساس تعداد سفارش
    reports.sort((a, b) => b.orderCount - a.orderCount);

    return reports;
  }

  /**
   * توضیح فارسی: دریافت گزارش زمان تحویل
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @returns گزارش زمان تحویل
   */
  async getDeliveryTimeReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<DeliveryTimeReport> {
    const filter: any = {
      deliveryStatus: "delivered",
    };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const orders = await this.orderRepo.find(filter);
    const packages = await this.packageRepo.find({ status: "delivered" });

    const deliveryTimes: number[] = [];
    let onTimeCount = 0;

    for (const pkg of packages) {
      if (!pkg.assignedAt || !pkg.deliveredAt) continue;

      const deliveryTime = Math.floor(
        (pkg.deliveredAt.getTime() - pkg.assignedAt.getTime()) / (1000 * 60 * 60 * 24)
      ); // روز

      deliveryTimes.push(deliveryTime);

      // فرض می‌کنیم تحویل در کمتر از 3 روز "به موقع" است
      if (deliveryTime <= 3) {
        onTimeCount++;
      }
    }

    const averageDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
      : 0;
    const fastestDelivery = deliveryTimes.length > 0 ? Math.min(...deliveryTimes) : 0;
    const slowestDelivery = deliveryTimes.length > 0 ? Math.max(...deliveryTimes) : 0;
    const onTimeDeliveryRate = deliveryTimes.length > 0
      ? (onTimeCount / deliveryTimes.length) * 100
      : 0;

    return {
      averageDeliveryTime,
      fastestDelivery,
      slowestDelivery,
      onTimeDeliveryRate,
    };
  }

  /**
   * توضیح فارسی: دریافت گزارش سفارش‌های مشکل‌دار
   * @param startDate تاریخ شروع (اختیاری)
   * @param endDate تاریخ پایان (اختیاری)
   * @returns گزارش سفارش‌های مشکل‌دار
   */
  async getProblematicOrdersReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<ProblematicOrdersReport[]> {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const problematicOrders: ProblematicOrdersReport[] = [];

    // کامنت: سفارش‌های لغو شده
    const cancelledOrders = await this.orderRepo.find({
      ...filter,
      orderStatus: "cancelled",
    });
    for (const order of cancelledOrders) {
      problematicOrders.push({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || order._id.toString(),
        issue: "cancelled",
        createdAt: order.createdAt,
        lastUpdated: order.updatedAt || order.createdAt,
      });
    }

    // کامنت: سفارش‌های با ارسال ناموفق
    const failedDeliveryOrders = await this.orderRepo.find({
      ...filter,
      deliveryStatus: "failed",
    });
    for (const order of failedDeliveryOrders) {
      problematicOrders.push({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || order._id.toString(),
        issue: "delivery_failed",
        createdAt: order.createdAt,
        lastUpdated: order.updatedAt || order.createdAt,
      });
    }

    // کامنت: مرتب‌سازی بر اساس تاریخ
    problematicOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return problematicOrders;
  }
}

