import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import Order, { OrderModel } from "../../../repositories/admin/order/model";
import user from "../../../apps/admin/controllers/user";

export default class OrderRepository extends BaseRepositoryService<Order> {
  constructor(options?: RepositoryConfigOptions) {
    super(OrderModel, options);
  }

  /**
   * توضیح فارسی: تولید شماره فاکتور خودکار
   * فرمت: ORD-YYYY-NNNN (مثلاً ORD-2025-0001)
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    // کامنت: یافتن آخرین شماره فاکتور در سال جاری
    const lastOrder = await OrderModel.findOne({
      orderNumber: { $regex: `^${prefix}` },
    })
      .sort({ orderNumber: -1 })
      .exec();

    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      // کامنت: استخراج شماره ترتیب از آخرین فاکتور
      const lastSequence = parseInt(
        lastOrder.orderNumber.replace(prefix, ""),
        10
      );
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // کامنت: فرمت کردن شماره با 4 رقم (0001, 0002, ...)
    const orderNumber = `${prefix}${sequence.toString().padStart(4, "0")}`;
    return orderNumber;
  }

  async insert(data: Order): Promise<Order> {
    // کامنت: اگر شماره فاکتور مشخص نشده باشد، تولید می‌کنیم
    if (!data.orderNumber) {
      data.orderNumber = await this.generateOrderNumber();
    }
    const order = new OrderModel(data);
    return await order.save();
  }

  async findAll(): Promise<Order[]> {
    return await OrderModel.find().exec();
  }

  async findByUser(userId: string): Promise<Order[]> {
    return await OrderModel.find({ user: user }).exec();
  }

  async findById(id: string): Promise<Order | null> {
    return await OrderModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    return await OrderModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}