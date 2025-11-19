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
}

