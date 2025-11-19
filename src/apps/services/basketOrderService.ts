import { Types } from "mongoose";
import { Response } from "../../../core/controller";
import BasketRepository from "../../../repositories/admin/basket/repository";
import OrderRepository from "../../../repositories/admin/order/repository";
import ProductWarehouseRepository from "../../../repositories/admin/productWarehouse/repository";
import AddressRepository from "../../../repositories/admin/address/repository";
import Basket, { BasketModel } from "../../../repositories/admin/basket/model";
import Order from "../../../repositories/admin/order/model";
import Productwarehouse from "../../../repositories/admin/productWarehouse/model";
import Address from "../../../repositories/admin/address/model";
import { UserInfo } from "../../../core/mongoose-controller/auth/user/userAuthenticator";
import PaymentService, { PaymentIntent } from "./paymentService";
import DeliveryService from "./deliveryService";
import Package from "../../../repositories/admin/package/model";
import ShippingService, { SendType, SendTime } from "./shippingService";
import DiscountService from "./discountService";
import TaxService from "./taxService";

/**
 * توضیح: ورودی‌های مربوط به جزئیات ارسال و پرداخت توسط این اینترفیس دریافت می‌شود.
 */
export interface CheckoutMeta {
  address?: string;
  offCode?: string;
  sendType?: number;
  sendTime?: number;
  sendDate?: number;
  isBig?: number;
  typePeyment?: number;
  totalPriceProducts?: number;
}

export interface OrderCreationResult {
  order: Order;
  totals: {
    totalPriceProducts: number;  // قیمت کل محصولات (قبل از تخفیف)
    totalCost: number;            // هزینه کل (خرید)
    discountAmount: number;       // مقدار تخفیف
    shippingCost: number;         // هزینه ارسال
    taxAmount: number;            // مالیات
    finalTotal: number;           // مبلغ نهایی قابل پرداخت
  };
  paymentIntent: PaymentIntent;
  package?: Package; // کامنت: بسته ارسالی (در صورت وجود آدرس)
}

/**
 * توضیح فارسی: سرویس اصلی تبدیل سبد به سفارش که در ادمین و یوزر مشترک است.
 */
export default class BasketOrderService {
  private basketRepo: BasketRepository;
  private orderRepo: OrderRepository;
  private productWarehouseRepo: ProductWarehouseRepository;
  private addressRepo: AddressRepository;
  private paymentService: PaymentService;
  private deliveryService: DeliveryService;
  private shippingService: ShippingService;
  private discountService: DiscountService;
  private taxService: TaxService;

  constructor() {
    this.basketRepo = new BasketRepository();
    this.orderRepo = new OrderRepository();
    this.productWarehouseRepo = new ProductWarehouseRepository();
    this.addressRepo = new AddressRepository();
    // کامنت: استفاده از سرویس پرداخت واقعی (در حال حاضر MockPaymentGateway)
    this.paymentService = new PaymentService();
    // کامنت: استفاده از سرویس ارسال برای مدیریت بسته‌ها
    this.deliveryService = new DeliveryService();
    // کامنت: استفاده از سرویس‌های جدید برای محاسبه هزینه‌ها
    this.shippingService = new ShippingService();
    this.discountService = new DiscountService();
    this.taxService = new TaxService();
  }

  /**
   * سناریوی اصلی: دریافت سبد کاربر و ایجاد سفارش به همراه پرداخت تستی.
   */
  async checkoutFromBasket(
    user: UserInfo,
    meta: CheckoutMeta = {}
  ): Promise<Response> {
    const basket = await this.basketRepo.findOne({ user: user.id as string });

    if (!basket || basket.basketList.length === 0) {
      return {
        status: 400,
        message: "سبد خرید شما خالی است.",
      };
    }

    const result = await this.createOrderTransaction({
      userId: user.id,
      items: basket.basketList,
      meta,
      basketDocument: basket,
      user, // کامنت: ارسال اطلاعات کاربر برای استفاده در پرداخت
    });

    return {
      status: 200,
      data: result,
    };
  }

  /**
   * این متد برای سناریوهای مدیریتی استفاده می‌شود که لیست سفارش مستقیما ارسال می‌شود.
   */
  async createOrderFromList(
    userId: string,
    orderList: Order["orderList"],
    meta: CheckoutMeta = {}
  ): Promise<OrderCreationResult> {
    return this.createOrderTransaction({
      userId,
      items: orderList,
      meta,
    });
  }

  /**
   * توضیح فارسی: در این متد تمام عملیات (اعتبارسنجی، ثبت سفارش، پرداخت واقعی) انجام می‌شود.
   */
  private async createOrderTransaction(params: {
    userId: string;
    items: Order["orderList"];
    meta: CheckoutMeta;
    basketDocument?: Basket;
    user?: UserInfo;
  }): Promise<OrderCreationResult> {
    const { userId, items, meta, basketDocument, user } = params;

    if (!items || items.length === 0) {
      throw {
        status: 400,
        message: "لیست سفارش خالی است.",
      };
    }

    // بررسی و اعتبارسنجی آدرس در صورت وجود
    let addressId: string | undefined;
    if (meta.address) {
      const userAddress = await this.addressRepo.findOne({ user: userId });
      if (!userAddress) {
        throw {
          status: 400,
          message: "آدرس کاربر یافت نشد. لطفا ابتدا آدرس خود را ثبت کنید.",
        };
      }
      
      // اگر آدرس به صورت ObjectId ارسال شده، مستقیما استفاده می‌کنیم
      // در غیر این صورت، باید از addressList استفاده کنیم
      if (Types.ObjectId.isValid(meta.address)) {
        addressId = meta.address;
      } else {
        // اگر آدرس به صورت index ارسال شده، آدرس پیش‌فرض یا اولین آدرس را استفاده می‌کنیم
        const defaultAddress = userAddress.addressList.find(addr => addr.isDefault) || userAddress.addressList[0];
        if (!defaultAddress) {
          throw {
            status: 400,
            message: "هیچ آدرس معتبری برای کاربر یافت نشد.",
          };
        }
        // در این حالت، از _id رکورد Address استفاده می‌کنیم
        addressId = userAddress._id.toString();
      }
    }

    const preparedItems = await this.prepareItems(items);
    let totalPriceProducts = preparedItems.totals.totalPriceProducts;

    // کامنت: محاسبه هزینه ارسال
    let shippingCost = 0;
    let userAddress: Address | null = null;
    if (addressId && meta.sendType) {
      try {
        userAddress = await this.addressRepo.findById(addressId);
        if (userAddress) {
          const sendType = (meta.sendType as SendType) || 1;
          const sendTime = (meta.sendTime as SendTime) || 2;
          const isBig = meta.isBig === 1 || meta.isBig === true;
          
          shippingCost = this.shippingService.calculateShippingCost(
            userAddress,
            sendType,
            sendTime,
            isBig
          );
        }
      } catch (error: any) {
        console.error("خطا در محاسبه هزینه ارسال:", error);
        // در صورت خطا، هزینه ارسال صفر می‌ماند
      }
    }

    // کامنت: اعمال کد تخفیف
    let discountAmount = 0;
    let discountCode: string | undefined;
    if (meta.offCode && user) {
      try {
        const discountResult = await this.discountService.applyDiscountCode(
          meta.offCode,
          totalPriceProducts,
          user,
          preparedItems.items
        );

        if (discountResult.isValid) {
          discountAmount = discountResult.discountAmount;
          discountCode = discountResult.discount.disCode || meta.offCode;
          totalPriceProducts = discountResult.finalPrice;

          // کامنت: کاهش تعداد استفاده از کد تخفیف
          if (discountResult.discount._id) {
            await this.discountService.decreaseUsageCount(
              discountResult.discount._id as string
            );
          }
        }
      } catch (error: any) {
        console.error("خطا در اعمال کد تخفیف:", error);
        // در صورت خطا، تخفیف اعمال نمی‌شود
      }
    }

    // کامنت: محاسبه مالیات (بر اساس قیمت پس از تخفیف)
    const taxResult = this.taxService.calculateTax(totalPriceProducts);
    const taxAmount = taxResult.totalTaxAmount;

    // کامنت: محاسبه مبلغ نهایی
    // finalTotal = totalPriceProducts (پس از تخفیف) + shippingCost + taxAmount
    const finalTotal = totalPriceProducts + shippingCost + taxAmount;

    // کامنت: آماده‌سازی payload سفارش با همه محاسبات
    const orderPayload: Partial<Order> = {
      user: userId,
      orderList: preparedItems.items,
      totalCost: preparedItems.totals.totalCost,
      totalPriceProducts: preparedItems.totals.totalPriceProducts, // قیمت قبل از تخفیف
      address: addressId,
      orderStatus: "pending", // وضعیت اولیه
      
      // کامنت: محاسبات مالی
      discountAmount,
      discountCode,
      shippingCost,
      taxAmount,
      finalTotal,
      
      // کامنت: جزئیات ارسال
      sendType: meta.sendType,
      sendTime: meta.sendTime,
      sendDate: meta.sendDate,
      isBig: meta.isBig === 1 || meta.isBig === true,
    };

    // کامنت: شماره فاکتور به صورت خودکار در OrderRepository.generateOrderNumber() تولید می‌شود
    const order = await this.orderRepo.insert(orderPayload as Order);

    // بعد از ثبت سفارش، سبد خالی می‌شود تا داده تکراری نباشد.
    if (basketDocument?._id) {
      await BasketModel.findByIdAndUpdate(basketDocument._id, {
        $set: { basketList: [] },
      });
    }

    // کامنت: استفاده از سرویس پرداخت واقعی برای ایجاد پرداخت
    // در حال حاضر از MockPaymentGateway استفاده می‌کند، اما می‌تواند به درگاه واقعی تغییر کند
    const userInfo: UserInfo = user || {
      id: userId,
      name: "",
      family: "",
      phoneNumber: "",
      email: "",
    };
    
    // کامنت: استفاده از مبلغ نهایی (finalTotal) برای پرداخت
    const paymentIntent = await this.paymentService.initiatePayment(
      order,
      finalTotal, // مبلغ نهایی شامل همه هزینه‌ها
      userInfo,
      {
        description: `پرداخت سفارش ${order.orderNumber || order._id}`,
        callbackUrl: process.env.PAYMENT_CALLBACK_URL || `http://localhost:7000/user/payment/callback`,
      }
    );

    // کامنت: ایجاد بسته ارسالی در صورت وجود آدرس
    let packageDoc: Package | undefined;
    if (addressId) {
      try {
        packageDoc = await this.deliveryService.createPackageFromOrder(order);
      } catch (error: any) {
        // کامنت: اگر ایجاد بسته با خطا مواجه شد، لاگ می‌کنیم اما خطا نمی‌دهیم
        // چون سفارش و پرداخت قبلاً انجام شده است
        console.error("خطا در ایجاد بسته ارسالی:", error);
      }
    }

    return {
      order,
      totals: {
        totalPriceProducts: preparedItems.totals.totalPriceProducts, // قیمت قبل از تخفیف
        totalCost: preparedItems.totals.totalCost,
        discountAmount,
        shippingCost,
        taxAmount,
        finalTotal,
      },
      paymentIntent,
      package: packageDoc, // کامنت: بسته ارسالی (در صورت وجود)
    };
  }

  /**
   * توضیح فارسی: برای هر آیتم سبد، موجودی انبار و قیمت نهایی محاسبه و رزرو می‌شود.
   */
  private async prepareItems(items: Order["orderList"]) {
    const prepared: Order["orderList"] = [];
    let totalPriceProducts = 0;
    let totalCost = 0;

    for (const item of items) {
      const productWarehouse = await this.loadWarehouse(item.productwarehouse);
      const quantity = item.quantity || 0;

      if (!productWarehouse) {
        throw {
          status: 400,
          message: "محصول انتخاب‌شده در انبار یافت نشد.",
        };
      }

      if (productWarehouse.quantity < quantity) {
        throw {
          status: 400,
          message: "موجودی کافی برای محصول وجود ندارد.",
        };
      }

      const salesPrice =
        productWarehouse.price || productWarehouse.variantPrice || item.price;
      const purchasePrice = productWarehouse.purchasePrice || 0;

      prepared.push({
        product: productWarehouse.product,
        productwarehouse: productWarehouse._id as unknown as Types.ObjectId,
        quantity,
        price: salesPrice,
      });

      totalPriceProducts += salesPrice * quantity;
      totalCost += purchasePrice * quantity;

      await this.productWarehouseRepo.collection.findByIdAndUpdate(
        productWarehouse._id,
        {
          $inc: { quantity: -quantity },
          $set: { lastUpdated: new Date() },
        }
      );
    }

    return {
      items: prepared,
      totals: {
        totalPriceProducts,
        totalCost,
      },
    };
  }

  private async loadWarehouse(
    id: string | Productwarehouse
  ): Promise<Productwarehouse | null> {
    const warehouseId =
      typeof id === "string"
        ? id
        : id instanceof Types.ObjectId
        ? id.toString()
        : id?._id;

    if (!warehouseId) {
      return null;
    }

    const normalizedId =
      typeof warehouseId === "string" ? warehouseId : warehouseId.toString();

    return this.productWarehouseRepo.findById(normalizedId);
  }
}

