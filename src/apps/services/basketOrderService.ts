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
    totalPriceProducts: number;
    totalCost: number;
  };
  paymentIntent: PaymentIntent;
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

  constructor() {
    this.basketRepo = new BasketRepository();
    this.orderRepo = new OrderRepository();
    this.productWarehouseRepo = new ProductWarehouseRepository();
    this.addressRepo = new AddressRepository();
    // کامنت: استفاده از سرویس پرداخت واقعی (در حال حاضر MockPaymentGateway)
    this.paymentService = new PaymentService();
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

    const orderPayload: Partial<Order> = {
      user: userId,
      orderList: preparedItems.items,
      totalCost: preparedItems.totals.totalCost,
      totalPriceProducts: preparedItems.totals.totalPriceProducts,
      address: addressId,
    };

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
    
    const paymentIntent = await this.paymentService.initiatePayment(
      order,
      preparedItems.totals.totalPriceProducts,
      userInfo,
      {
        description: `پرداخت سفارش ${order._id}`,
        callbackUrl: process.env.PAYMENT_CALLBACK_URL || `http://localhost:7000/user/payment/callback`,
      }
    );

    return {
      order,
      totals: preparedItems.totals,
      paymentIntent,
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

