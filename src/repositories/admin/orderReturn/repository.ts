import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import OrderReturn, { OrderReturnModel } from "./model";

export default class OrderReturnRepository extends BaseRepositoryService<OrderReturn> {
  constructor(options?: RepositoryConfigOptions) {
    super(OrderReturnModel, options);
  }

  /**
   * توضیح فارسی: دریافت درخواست‌های بازگشت یک کاربر
   */
  async getUserReturns(userId: string, filters?: { status?: string; limit?: number; skip?: number }) {
    const query: any = { user: userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    const options: any = { sort: { createdAt: -1 } };
    if (filters?.limit) {
      options.limit = filters.limit;
    }
    if (filters?.skip) {
      options.skip = filters.skip;
    }

    return this.find(query, options);
  }

  /**
   * توضیح فارسی: دریافت درخواست‌های بازگشت یک سفارش
   */
  async getOrderReturns(orderId: string) {
    return this.find({ order: orderId }, { sort: { createdAt: -1 } });
  }

  /**
   * توضیح فارسی: دریافت درخواست‌های بازگشت بر اساس وضعیت
   */
  async getReturnsByStatus(status: OrderReturn["status"], limit?: number, skip?: number) {
    const query: any = { status };
    const options: any = { sort: { createdAt: -1 } };

    if (limit) {
      options.limit = limit;
    }
    if (skip) {
      options.skip = skip;
    }

    return this.find(query, options);
  }
}

