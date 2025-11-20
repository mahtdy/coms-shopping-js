import { Types, startSession, ClientSession } from "mongoose";
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
import Invoice from "../../core/mongoose-controller/repositories/invoice/model";
import ShippingService, { SendType, SendTime } from "./shippingService";
import DiscountService from "./discountService";
import TaxService from "./taxService";
import InventoryService from "./inventoryService";
import OrderStatusService from "./orderStatusService";
import InvoiceService from "./invoiceService";
import PackagingService from "./packagingService";
import { UserModel } from "../../core/mongoose-controller/repositories/user/model";

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
    packagingCost: number;        // هزینه بسته‌بندی
    finalTotal: number;           // مبلغ نهایی قابل پرداخت
  };
  paymentIntent: PaymentIntent;
  package?: Package; // کامنت: بسته ارسالی (در صورت وجود آدرس)
  invoice?: Invoice; // کامنت: فاکتور مالی (در صورت ایجاد موفق)
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
  private inventoryService: InventoryService;
  private orderStatusService: OrderStatusService;
  private invoiceService: InvoiceService;
  private packagingService: PackagingService;

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
    // کامنت: استفاده از سرویس موجودی برای مدیریت ورود/خروج و تاریخچه
    this.inventoryService = new InventoryService();
    // کامنت: استفاده از سرویس مدیریت وضعیت سفارش
    this.orderStatusService = new OrderStatusService();
    // کامنت: استفاده از سرویس فاکتور
    this.invoiceService = new InvoiceService();
    // کامنت: استفاده از سرویس بسته‌بندی
    this.packagingService = new PackagingService();
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
   * این متد از MongoDB Transaction استفاده می‌کند تا اطمینان حاصل شود که تمام عملیات به صورت اتمیک انجام می‌شوند.
   */
  private async createOrderTransaction(params: {
    userId: string;
    items: Order["orderList"];
    meta: CheckoutMeta;
    basketDocument?: Basket;
    user?: UserInfo;
  }): Promise<OrderCreationResult> {
    const { userId, items, meta, basketDocument, user } = params;
    
    // کامنت: شروع MongoDB Transaction
    const session = await startSession();
    session.startTransaction();

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

    // کامنت: محاسبات اولیه (خارج از Transaction)
    // کامنت: این محاسبات فقط برای محاسبه قیمت هستند و تغییر دیتابیس نمی‌دهند
    const priceCalculation = await this.calculatePrices(items);
    let totalPriceProducts = priceCalculation.totalPriceProducts;

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
          
          // کامنت: محاسبه هزینه ارسال با وزن و حجم واقعی
          shippingCost = await this.shippingService.calculateShippingCost(
            userAddress,
            sendType,
            sendTime,
            isBig,
            undefined, // وزن (از orderList محاسبه می‌شود)
            priceCalculation.items, // لیست محصولات برای محاسبه وزن و حجم
            undefined // آدرس مبدا (از تنظیمات استفاده می‌شود)
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
          priceCalculation.items
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

    // کامنت: محاسبه هزینه بسته‌بندی (بر اساس تعداد و نوع محصولات)
    let packagingCost = 0;
    try {
      // کامنت: استفاده از لیست محصولات برای محاسبه دقیق هزینه بسته‌بندی
      packagingCost = await this.packagingService.calculatePackagingCost(priceCalculation.items);
    } catch (error: any) {
      console.error("خطا در محاسبه هزینه بسته‌بندی:", error);
      // کامنت: در صورت خطا، از محاسبه سریع استفاده می‌کنیم
      packagingCost = this.packagingService.calculateQuickPackagingCost(items.length);
    }

    // کامنت: محاسبه مبلغ نهایی
    // finalTotal = totalPriceProducts (پس از تخفیف) + shippingCost + taxAmount + packagingCost
    const finalTotal = totalPriceProducts + shippingCost + taxAmount + packagingCost;

    // کامنت: شروع MongoDB Transaction برای عملیات حساس
    const session = await startSession();
    session.startTransaction();
    
    let order: Order;
    let invoice: Invoice | undefined;
    
    try {
      // کامنت: کاهش موجودی و آماده‌سازی آیتم‌ها (در Transaction)
      const preparedItems = await this.prepareItems(items, undefined, session);
      
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
        packagingCost,
        finalTotal,
      
      // کامنت: جزئیات ارسال
      sendType: meta.sendType,
      sendTime: meta.sendTime,
      sendDate: meta.sendDate,
      isBig: meta.isBig === 1 || meta.isBig === true,
    };

        // کامنت: شماره فاکتور به صورت خودکار تولید می‌شود
        const orderNumber = await this.orderRepo.generateOrderNumber();
        orderPayload.orderNumber = orderNumber;
        
        // کامنت: ایجاد Order در Transaction
        order = (await this.orderRepo.collection.create([orderPayload as Order], { session }))[0];

      // کامنت: ایجاد فاکتور مالی از سفارش (در Transaction)
      invoice = await this.invoiceService.createInvoiceFromOrder(order, session);
      
      // کامنت: اتصال فاکتور به سفارش (در Transaction)
      await this.orderRepo.collection.findByIdAndUpdate(
        order._id,
        { $set: { invoice: invoice._id } },
        { session }
      );

      // کامنت: ثبت تاریخچه وضعیت "pending" (در Transaction)
      await this.orderStatusService.recordInitialStatus(
        order._id.toString(),
        "pending",
        "ثبت سفارش جدید",
        session
      );

      // کامنت: خالی کردن سبد (در Transaction)
      if (basketDocument?._id) {
        await BasketModel.findByIdAndUpdate(
          basketDocument._id,
          { $set: { basketList: [] } },
          { session }
        );
      }

      // کامنت: Commit Transaction در صورت موفقیت
      await session.commitTransaction();
    } catch (error: any) {
      // کامنت: Rollback Transaction در صورت خطا
      await session.abortTransaction();
      console.error("خطا در ایجاد سفارش (Transaction Rollback):", error);
      throw {
        status: error?.status || 500,
        message: error?.message || "خطا در ایجاد سفارش. تمام تغییرات برگردانده شد.",
        originalError: error,
      };
    } finally {
      // کامنت: بستن Session
      await session.endSession();
    }

    // کامنت: عملیات خارج از Transaction (بعد از commit موفق)
    // کامنت: ارسال اعلان (خارج از Transaction)
    try {
      const userDoc = await UserModel.findById(userId);
      if (userDoc) {
        await this.orderStatusService.sendStatusChangeNotification(
          order,
          undefined as any,
          "pending"
        );
      }
    } catch (error: any) {
      // کامنت: خطای اعلان نباید باعث شکست checkout شود
      console.error("خطا در ارسال اعلان:", error);
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

    // کامنت: استفاده از قیمت‌های محاسبه شده برای return
    return {
      order,
      totals: {
        totalPriceProducts: priceCalculation.totals.totalPriceProducts, // قیمت قبل از تخفیف
        totalCost: priceCalculation.totals.totalCost,
        discountAmount,
        shippingCost,
        taxAmount,
        packagingCost,
        finalTotal,
      },
      paymentIntent,
      package: packageDoc, // کامنت: بسته ارسالی (در صورت وجود)
      invoice, // کامنت: فاکتور مالی (در صورت ایجاد موفق)
    };
  }

  /**
   * توضیح فارسی: برای هر آیتم سبد، موجودی انبار و قیمت نهایی محاسبه و رزرو می‌شود.
   * این متد از InventoryService استفاده می‌کند تا تاریخچه موجودی ثبت شود.
   * @param session MongoDB Session برای Transaction (اختیاری)
   */
  private async prepareItems(items: Order["orderList"], orderId?: string, session?: ClientSession) {
    const prepared: Order["orderList"] = [];
    let totalPriceProducts = 0;
    let totalCost = 0;
    const inventoryAdjustments: Array<{ productWarehouseId: string; quantity: number }> = [];

    try {
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
            message: `موجودی کافی برای محصول وجود ندارد. موجودی فعلی: ${productWarehouse.quantity}, درخواستی: ${quantity}`,
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

        // کامنت: استفاده از InventoryService برای کاهش موجودی و ثبت تاریخچه
        const warehouseId = typeof productWarehouse.warehouse === "string"
          ? productWarehouse.warehouse
          : (productWarehouse.warehouse as any)?._id?.toString() || (productWarehouse.warehouse as any)?.toString();
        
        const variantId = productWarehouse.variant
          ? (typeof productWarehouse.variant === "string"
              ? productWarehouse.variant
              : (productWarehouse.variant as any)?._id?.toString() || (productWarehouse.variant as any)?.toString())
          : undefined;

        const productId = typeof productWarehouse.product === "string"
          ? productWarehouse.product
          : (productWarehouse.product as any)?._id?.toString() || (productWarehouse.product as any)?.toString();

        await this.inventoryService.adjustStock({
          warehouseId,
          variantId,
          productId,
          batchNumber: productWarehouse.batchNumber || "DEFAULT",
          quantityDelta: -quantity, // کاهش موجودی
          variantPrice: salesPrice,
          purchasePrice,
          reason: orderId ? `Order #${orderId}` : "Basket checkout",
          changeType: "sale",
        }, session); // کامنت: ارسال session برای Transaction

        // کامنت: ذخیره اطلاعات برای برگشت در صورت خطا
        inventoryAdjustments.push({
          productWarehouseId: productWarehouse._id.toString(),
          quantity,
        });
      }

      return {
        items: prepared,
        totals: {
          totalPriceProducts,
          totalCost,
        },
      };
    } catch (error: any) {
      // کامنت: در صورت خطا، موجودی‌های کم شده را برمی‌گردانیم
      for (const adjustment of inventoryAdjustments) {
        try {
          const productWarehouse = await this.productWarehouseRepo.findById(adjustment.productWarehouseId);
          if (productWarehouse) {
            const warehouseId = typeof productWarehouse.warehouse === "string"
              ? productWarehouse.warehouse
              : (productWarehouse.warehouse as any)?._id?.toString() || (productWarehouse.warehouse as any)?.toString();
            
            const variantId = productWarehouse.variant
              ? (typeof productWarehouse.variant === "string"
                  ? productWarehouse.variant
                  : (productWarehouse.variant as any)?._id?.toString() || (productWarehouse.variant as any)?.toString())
              : undefined;

            const productId = typeof productWarehouse.product === "string"
              ? productWarehouse.product
              : (productWarehouse.product as any)?._id?.toString() || (productWarehouse.product as any)?.toString();

            await this.inventoryService.adjustStock({
              warehouseId,
              variantId,
              productId,
              batchNumber: productWarehouse.batchNumber || "DEFAULT",
              quantityDelta: adjustment.quantity, // برگشت موجودی
              variantPrice: productWarehouse.variantPrice || productWarehouse.price,
              purchasePrice: productWarehouse.purchasePrice,
              reason: "Rollback due to checkout error",
              changeType: "adjustment",
            });
          }
        } catch (rollbackError: any) {
          console.error("خطا در برگشت موجودی:", rollbackError);
        }
      }
      throw error;
    }
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

