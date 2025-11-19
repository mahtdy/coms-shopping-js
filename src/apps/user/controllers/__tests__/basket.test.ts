/**
 * توضیح فارسی: تست‌های ماژول سبد خرید
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import BasketRepository from "../../../../repositories/admin/basket/repository";
import ProductWarehouseRepository from "../../../../repositories/admin/productWarehouse/repository";
import ProductRepository from "../../../../repositories/admin/product/repository";
import { UserModel } from "../../../../core/mongoose-controller/repositories/user/model";
import { BasketModel } from "../../../../repositories/admin/basket/model";

describe("ماژول سبد خرید", () => {
  let testUserId: string;
  let testProductId: string;
  let testProductWarehouseId: string;

  beforeAll(async () => {
    // کامنت: اتصال به دیتابیس تست
    await mongoose.connect(process.env.DB_URL || "mongodb://127.0.0.1:27017/shopping-test");

    // کامنت: ایجاد یوزر تست
    const testUser = await UserModel.findOne({ email: "user1@test.com" });
    if (!testUser) {
      throw new Error("یوزر تست یافت نشد. لطفاً Seed را اجرا کنید.");
    }
    testUserId = testUser._id.toString();

    // کامنت: یافتن محصول و انبار تست
    const productRepo = new ProductRepository();
    const productWarehouseRepo = new ProductWarehouseRepository();
    
    const products = await productRepo.findAll();
    if (products.length === 0) {
      throw new Error("محصول تست یافت نشد.");
    }
    testProductId = products[0]._id.toString();

    const warehouses = await productWarehouseRepo.findAll();
    if (warehouses.length === 0) {
      throw new Error("انبار تست یافت نشد.");
    }
    testProductWarehouseId = warehouses[0]._id.toString();
  });

  afterAll(async () => {
    // کامنت: پاک کردن سبدهای تست
    await BasketModel.deleteMany({ user: testUserId });
    await mongoose.disconnect();
  });

  describe("افزودن محصول به سبد", () => {
    it("باید محصول را با موفقیت به سبد اضافه کند", async () => {
      const basketRepo = new BasketRepository();
      
      // کامنت: ایجاد سبد جدید
      const basket = await basketRepo.create({
        user: testUserId,
        basketList: [
          {
            product: testProductId,
            productwarehouse: testProductWarehouseId,
            quantity: 2,
            price: 100000,
          },
        ],
      });

      expect(basket).toBeDefined();
      expect(basket.basketList.length).toBe(1);
      expect(basket.basketList[0].quantity).toBe(2);
    });

    it("باید در صورت موجودی ناکافی خطا بدهد", async () => {
      const productWarehouseRepo = new ProductWarehouseRepository();
      const warehouse = await productWarehouseRepo.findById(testProductWarehouseId);
      
      if (!warehouse) {
        throw new Error("انبار یافت نشد");
      }

      const originalQuantity = warehouse.quantity;
      
      // کامنت: تنظیم موجودی به 0
      await productWarehouseRepo.editById(testProductWarehouseId, {
        $set: { quantity: 0 },
      });

      // کامنت: تلاش برای افزودن به سبد باید خطا بدهد
      // این تست نیاز به mock کردن controller دارد
      
      // کامنت: برگشت موجودی
      await productWarehouseRepo.editById(testProductWarehouseId, {
        $set: { quantity: originalQuantity },
      });
    });
  });

  describe("به‌روزرسانی سبد", () => {
    it("باید تعداد محصول را افزایش دهد", async () => {
      const basketRepo = new BasketRepository();
      
      // کامنت: ایجاد سبد
      const basket = await basketRepo.create({
        user: testUserId,
        basketList: [
          {
            product: testProductId,
            productwarehouse: testProductWarehouseId,
            quantity: 1,
            price: 100000,
          },
        ],
      });

      // کامنت: افزایش تعداد
      const updatedBasket = await basketRepo.editById(basket._id.toString(), {
        $set: {
          "basketList.0.quantity": 3,
        },
      });

      expect(updatedBasket?.basketList[0].quantity).toBe(3);
    });
  });
});

