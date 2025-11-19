/**
 * توضیح فارسی: تست‌های واحد و یکپارچگی برای کنترلر تخفیف
 * این فایل شامل تست‌های مختلف برای سناریوهای تولید تخفیف پس از فاکتور است.
 */

import { DiscountController } from "../discount";
import DiscountRepository from "../../../../repositories/admin/discount/repository";
import OrderRepository from "../../../../repositories/admin/order/repository";
import { UserInfo } from "../../../../core/mongoose-controller/auth/user/userAuthenticator";
import Discount from "../../../../repositories/admin/discount/model";
import Order from "../../../../repositories/admin/order/model";

// کامنت: Mock کردن Repository ها برای تست
jest.mock("../../../../repositories/admin/discount/repository");
jest.mock("../../../../repositories/admin/order/repository");

describe("DiscountController - generateDiscountAfterInvoice", () => {
  let discountController: DiscountController;
  let mockDiscountRepo: jest.Mocked<DiscountRepository>;
  let mockOrderRepo: jest.Mocked<OrderRepository>;

  const mockUser: UserInfo = {
    id: "user123",
    name: "Test",
    family: "User",
    phoneNumber: "09123456789",
    email: "test@example.com",
  };

  beforeEach(() => {
    // کامنت: ایجاد mock instances
    mockDiscountRepo = new DiscountRepository() as jest.Mocked<DiscountRepository>;
    mockOrderRepo = new OrderRepository() as jest.Mocked<OrderRepository>;
    discountController = new DiscountController("/discount", mockDiscountRepo);
    (discountController as any).orderRepo = mockOrderRepo;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * سناریو 1: تخفیف Fixed با موفقیت
   */
  describe("سناریو 1: تخفیف Fixed با موفقیت", () => {
    it("باید تخفیف Fixed را با موفقیت تولید کند", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000,
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف تست",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: false,
        amountRange: { from: 100000, to: 10000000 },
        disValue: {
          type: "fixed",
          fixedAmount: 50000,
        },
        maxProfitLimit: false,
        usageCount: 100,
        generateCode: true,
        codeSettings: {
          type: "letters",
          charCount: 8,
          prefix: "TEST",
          randomDigitCount: 0,
        },
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      // کامنت: Mock کردن متدهای Repository
      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(1);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);
      mockDiscountRepo.insert = jest.fn().mockResolvedValue({
        ...mockActiveDiscount,
        disCode: "TESTABCD",
        disValue: { type: "fixed", fixedAmount: 50000 },
      } as Discount);

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(200);
      expect(result.message).toBe("Discount code generated");
      expect(result.data).toBeDefined();
      expect(result.data?.disValue?.fixedAmount).toBe(50000);
      expect(result.data?.disCode).toBeDefined();
    });
  });

  /**
   * سناریو 2: تخفیف Random با موفقیت
   */
  describe("سناریو 2: تخفیف Random با موفقیت", () => {
    it("باید تخفیف Random را در بازه مشخص تولید کند", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000,
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف رندوم",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: false,
        amountRange: { from: 100000, to: 10000000 },
        disValue: {
          type: "random",
          randomRange: { from: 10000, to: 50000 },
        },
        maxProfitLimit: false,
        usageCount: 100,
        generateCode: false,
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(1);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);
      mockDiscountRepo.insert = jest.fn().mockImplementation((data: any) => {
        const discountValue = data.disValue.fixedAmount;
        expect(discountValue).toBeGreaterThanOrEqual(10000);
        expect(discountValue).toBeLessThanOrEqual(50000);
        return Promise.resolve({ ...mockActiveDiscount, ...data } as Discount);
      });

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });
  });

  /**
   * سناریو 3: تخفیف Percent با موفقیت
   */
  describe("سناریو 3: تخفیف Percent با موفقیت", () => {
    it("باید تخفیف Percent را به درستی محاسبه کند", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000,
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف درصدی",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: false,
        amountRange: { from: 100000, to: 10000000 },
        disValue: {
          type: "percent",
          fixedAmount: 10, // 10 درصد
        },
        maxProfitLimit: false,
        usageCount: 100,
        generateCode: false,
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(1);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);
      mockDiscountRepo.insert = jest.fn().mockImplementation((data: any) => {
        // کامنت: بررسی محاسبه درصد: 10% از 200000 = 20000
        expect(data.disValue.fixedAmount).toBe(20000);
        return Promise.resolve({ ...mockActiveDiscount, ...data } as Discount);
      });

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(200);
    });
  });

  /**
   * سناریو 4: تخفیف با maxProfitLimit
   */
  describe("سناریو 4: تخفیف با maxProfitLimit", () => {
    it("باید تخفیف را به سود محدود کند", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000, // سود = 50000
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف با محدودیت سود",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: false,
        amountRange: { from: 100000, to: 10000000 },
        disValue: {
          type: "fixed",
          fixedAmount: 100000, // بیشتر از سود
        },
        maxProfitLimit: true, // محدودیت سود فعال است
        usageCount: 100,
        generateCode: false,
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(1);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);
      mockDiscountRepo.insert = jest.fn().mockImplementation((data: any) => {
        // کامنت: تخفیف باید به سود (50000) محدود شود، نه 100000
        expect(data.disValue.fixedAmount).toBe(50000);
        return Promise.resolve({ ...mockActiveDiscount, ...data } as Discount);
      });

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(200);
    });
  });

  /**
   * سناریو 5: عدم وجود تخفیف فعال
   */
  describe("سناریو 5: عدم وجود تخفیف فعال", () => {
    it("باید خطای 404 برگرداند اگر تخفیف فعال وجود نداشته باشد", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000,
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(null); // هیچ تخفیف فعالی وجود ندارد

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(404);
      expect(result.message).toBe("No active discount settings found");
    });
  });

  /**
   * سناریو 6: تخفیف فقط برای اولین خرید
   */
  describe("سناریو 6: تخفیف فقط برای اولین خرید", () => {
    it("باید خطا برگرداند اگر کاربر قبلاً سفارش داشته باشد", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000,
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف اولین خرید",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: true, // فقط اولین خرید
        amountRange: { from: 100000, to: 10000000 },
        disValue: {
          type: "fixed",
          fixedAmount: 50000,
        },
        maxProfitLimit: false,
        usageCount: 100,
        generateCode: false,
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(2); // کاربر قبلاً یک سفارش داشته
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(400);
      expect(result.message).toBe("Discount only for first invoice");
    });
  });

  /**
   * سناریو 7: مبلغ سفارش خارج از بازه
   */
  describe("سناریو 7: مبلغ سفارش خارج از بازه", () => {
    it("باید خطا برگرداند اگر مبلغ سفارش خارج از بازه باشد", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 50000, // کمتر از 100000
        totalCost: 40000,
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف با بازه مبلغی",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: false,
        amountRange: { from: 100000, to: 10000000 }, // بازه 100000 تا 10000000
        disValue: {
          type: "fixed",
          fixedAmount: 50000,
        },
        maxProfitLimit: false,
        usageCount: 100,
        generateCode: false,
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(1);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(400);
      expect(result.message).toBe("Invoice amount out of range");
    });
  });

  /**
   * سناریو 8: تولید کد تخفیف
   */
  describe("سناریو 8: تولید کد تخفیف", () => {
    it("باید کد تخفیف با حروف تولید کند", async () => {
      const orderId = "order123";
      const mockOrder: Partial<Order> = {
        _id: orderId as any,
        totalPriceProducts: 200000,
        totalCost: 150000,
      };

      const mockActiveDiscount: Partial<Discount> = {
        _id: "discount123" as any,
        disTitle: "تخفیف با کد",
        disType: "general",
        applyOnInvoice: true,
        isActive: true,
        disStart: new Date("2025-01-01"),
        disEnd: new Date("2025-12-31"),
        firstInvoiceOnly: false,
        amountRange: { from: 100000, to: 10000000 },
        disValue: {
          type: "fixed",
          fixedAmount: 50000,
        },
        maxProfitLimit: false,
        usageCount: 100,
        generateCode: true,
        codeSettings: {
          type: "letters",
          charCount: 8,
          prefix: "TEST",
          randomDigitCount: 0,
        },
        filters: {
          userFilter: { allUsers: true },
          productFilter: { allProducts: true },
        },
      };

      mockOrderRepo.findById = jest.fn().mockResolvedValue(mockOrder as Order);
      mockOrderRepo.count = jest.fn().mockResolvedValue(1);
      mockDiscountRepo.findOne = jest.fn().mockResolvedValue(mockActiveDiscount as Discount);
      mockDiscountRepo.insert = jest.fn().mockImplementation((data: any) => {
        // کامنت: بررسی اینکه کد تولید شده و با prefix شروع می‌شود
        expect(data.disCode).toBeDefined();
        expect(data.disCode).toMatch(/^TEST/);
        expect(data.disCode.length).toBeGreaterThanOrEqual(8);
        return Promise.resolve({ ...mockActiveDiscount, ...data } as Discount);
      });

      const result = await discountController.generateDiscountAfterInvoice(mockUser, { orderId });

      expect(result.status).toBe(200);
      expect(result.data?.disCode).toBeDefined();
    });
  });
});

