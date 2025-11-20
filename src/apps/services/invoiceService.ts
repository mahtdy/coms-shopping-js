import Invoice, { InvoiceModel } from "../../core/mongoose-controller/repositories/invoice/model";
import InvoiceRepository from "../../core/mongoose-controller/repositories/invoice/repository";
import Order from "../../repositories/admin/order/model";
import { Types } from "mongoose";

/**
 * توضیح فارسی: سرویس ایجاد و مدیریت فاکتور
 * این سرویس فاکتور مالی را از اطلاعات سفارش ایجاد می‌کند.
 */
export default class InvoiceService {
  private invoiceRepo: InvoiceRepository<Invoice>;

  constructor() {
    this.invoiceRepo = new InvoiceRepository(InvoiceModel);
  }

  /**
   * توضیح فارسی: ایجاد فاکتور از سفارش
   * @param order سفارش ایجاد شده
   * @returns فاکتور ایجاد شده
   */
  async createInvoiceFromOrder(order: Order): Promise<Invoice> {
    // کامنت: محاسبه قیمت‌ها
    const netPrice = order.totalPriceProducts || 0; // قیمت خالص محصولات (قبل از تخفیف)
    const discountAmount = order.discountAmount || 0; // مقدار تخفیف
    const shippingCost = order.shippingCost || 0; // هزینه ارسال
    const taxAmount = order.taxAmount || 0; // مالیات
    const packagingCost = order.packagingCost || 0; // هزینه بسته‌بندی

    // کامنت: محاسبه قیمت کل (قبل از تخفیف)
    const totalPrice = netPrice + shippingCost + packagingCost;

    // کامنت: محاسبه قیمت نهایی (پس از تخفیف و قبل از مالیات)
    const priceAfterDiscount = totalPrice - discountAmount;

    // کامنت: محاسبه قیمت نهایی (شامل مالیات)
    const finalPrice = priceAfterDiscount + taxAmount;

    // کامنت: ایجاد فاکتور
    const invoiceData: Partial<Invoice> = {
      factorNumber: "", // کامنت: به صورت خودکار در insert تولید می‌شود
      netPrice, // قیمت خالص محصولات
      totalPrice, // قیمت کل (قبل از تخفیف)
      finalPrice, // قیمت نهایی (شامل همه هزینه‌ها و تخفیف‌ها)
      tax: taxAmount, // مالیات
      paidPrice: 0, // مبلغ پرداخت شده (در ابتدا صفر)
      totalPaidPrice: 0, // مجموع پرداخت‌ها
      totalRemainedPrice: finalPrice, // مبلغ باقیمانده (در ابتدا برابر با finalPrice)
      remainedPrice: finalPrice, // مبلغ باقیمانده
      waitForConfirmPrice: 0, // مبلغ در انتظار تایید
      unrefinedPrice: 0, // مبلغ پرداخت نشده
      interest: 0, // سود
      penalty: 0, // جریمه
      discount: discountAmount, // مقدار تخفیف
      status: "waiting", // وضعیت: در انتظار پرداخت
      paymentType: "simple", // نوع پرداخت: ساده
      ownerType: "Order", // نوع مالک: سفارش
      owner: order._id, // مالک: شناسه سفارش
      createdAt: new Date(),
    };

    // کامنت: ایجاد فاکتور (شماره فاکتور به صورت خودکار تولید می‌شود)
    const invoice = await this.invoiceRepo.insert(invoiceData as Invoice);

    return invoice;
  }

  /**
   * توضیح فارسی: به‌روزرسانی وضعیت فاکتور پس از پرداخت
   * @param invoiceId شناسه فاکتور
   * @param paidAmount مبلغ پرداخت شده
   * @returns فاکتور به‌روزرسانی شده
   */
  async updateInvoiceAfterPayment(
    invoiceId: string,
    paidAmount: number
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      throw {
        status: 404,
        message: "فاکتور یافت نشد.",
      };
    }

    // کامنت: به‌روزرسانی مبالغ پرداخت شده
    const updatedInvoice = await this.invoiceRepo.findByIdAndUpdate(
      invoiceId,
      {
        $inc: {
          paidPrice: paidAmount,
          totalPaidPrice: paidAmount,
          totalRemainedPrice: -paidAmount,
          remainedPrice: -paidAmount,
        },
        $set: {
          paidAt: new Date(),
          status: invoice.finalPrice <= invoice.totalPaidPrice + paidAmount ? "paid" : "paying",
        },
      }
    );

    return updatedInvoice;
  }

  /**
   * توضیح فارسی: دریافت فاکتور یک سفارش
   * @param orderId شناسه سفارش
   * @returns فاکتور مرتبط با سفارش
   */
  async getInvoiceByOrder(orderId: string): Promise<Invoice | null> {
    return this.invoiceRepo.findOne({
      owner: orderId,
      ownerType: "Order",
    });
  }

  /**
   * توضیح فارسی: لغو فاکتور
   * @param invoiceId شناسه فاکتور
   * @returns فاکتور لغو شده
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice | null> {
    return this.invoiceRepo.findByIdAndUpdate(
      invoiceId,
      {
        $set: {
          status: "canceled",
        },
      }
    );
  }
}

