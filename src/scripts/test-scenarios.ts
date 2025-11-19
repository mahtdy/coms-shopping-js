/**
 * توضیح فارسی: اسکریپت اجرای سناریوهای تستی
 * این اسکریپت سناریوهای تستی را به صورت دستی اجرا می‌کند و نتایج را گزارش می‌دهد.
 */

import mongoose from "mongoose";
import axios from "axios";

const BASE_URL = process.env.API_URL || "http://localhost:7000";

/**
 * توضیح فارسی: اطلاعات لاگین تست
 */
const TEST_CREDENTIALS = {
  admin: {
    email: "admin1@test.com",
    password: "Admin123!",
  },
  user: {
    email: "user1@test.com",
    password: "User123!",
  },
};

let adminToken: string = "";
let userToken: string = "";

/**
 * توضیح فارسی: لاگین ادمین
 */
async function loginAdmin(): Promise<string> {
  try {
    const response = await axios.post(`${BASE_URL}/admin/login`, {
      email: TEST_CREDENTIALS.admin.email,
      password: TEST_CREDENTIALS.admin.password,
    });
    return response.data.token || response.data.data?.token || "";
  } catch (error: any) {
    console.error("❌ خطا در لاگین ادمین:", error.message);
    return "";
  }
}

/**
 * توضیح فارسی: لاگین یوزر
 */
async function loginUser(): Promise<string> {
  try {
    const response = await axios.post(`${BASE_URL}/user/login`, {
      email: TEST_CREDENTIALS.user.email,
      password: TEST_CREDENTIALS.user.password,
    });
    return response.data.token || response.data.data?.token || "";
  } catch (error: any) {
    console.error("❌ خطا در لاگین یوزر:", error.message);
    return "";
  }
}

/**
 * توضیح فارسی: سناریو 1: افزودن محصول به سبد
 */
async function scenario1_AddToBasket() {
  console.log("\n📦 سناریو 1: افزودن محصول به سبد");
  
  try {
    // کامنت: دریافت لیست محصولات
    const productsResponse = await axios.get(`${BASE_URL}/user/product`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (productsResponse.data.data?.length === 0) {
      console.log("⚠️  محصولی یافت نشد. لطفاً ابتدا محصول ایجاد کنید.");
      return false;
    }

    const product = productsResponse.data.data[0];
    console.log(`✅ محصول یافت شد: ${product.title}`);

    // کامنت: افزودن به سبد
    const basketResponse = await axios.post(
      `${BASE_URL}/user/basket`,
      {
        basketList: [
          {
            product: product._id,
            productwarehouse: product.warehouses?.[0]?._id || product._id,
            quantity: 2,
            price: product.price,
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    if (basketResponse.data.status === 200) {
      console.log("✅ محصول با موفقیت به سبد اضافه شد");
      return true;
    } else {
      console.log(`❌ خطا: ${basketResponse.data.message}`);
      return false;
    }
  } catch (error: any) {
    console.error("❌ خطا:", error.message);
    return false;
  }
}

/**
 * توضیح فارسی: سناریو 2: ایجاد سفارش
 */
async function scenario2_CreateOrder() {
  console.log("\n📦 سناریو 2: ایجاد سفارش");
  
  try {
    // کامنت: دریافت سبد
    const basketResponse = await axios.get(`${BASE_URL}/user/basket`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (!basketResponse.data.data || basketResponse.data.data.basketList?.length === 0) {
      console.log("⚠️  سبد خرید خالی است. ابتدا محصول اضافه کنید.");
      return false;
    }

    // کامنت: دریافت آدرس کاربر
    const addressResponse = await axios.get(`${BASE_URL}/user/address`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    let addressId = null;
    if (addressResponse.data.data && addressResponse.data.data.length > 0) {
      addressId = addressResponse.data.data[0]._id;
    } else {
      console.log("⚠️  آدرس یافت نشد. لطفاً ابتدا آدرس اضافه کنید.");
      return false;
    }

    // کامنت: Checkout
    const checkoutResponse = await axios.post(
      `${BASE_URL}/user/order/checkout`,
      {
        address: addressId,
        sendType: 1,
        sendTime: 2,
        isBig: false,
      },
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    if (checkoutResponse.data.status === 200) {
      console.log("✅ سفارش با موفقیت ایجاد شد");
      console.log(`   شماره فاکتور: ${checkoutResponse.data.data?.order?.orderNumber || "N/A"}`);
      console.log(`   مبلغ نهایی: ${checkoutResponse.data.data?.totals?.finalTotal?.toLocaleString() || "N/A"} تومان`);
      return true;
    } else {
      console.log(`❌ خطا: ${checkoutResponse.data.message}`);
      return false;
    }
  } catch (error: any) {
    console.error("❌ خطا:", error.message);
    if (error.response) {
      console.error("   پاسخ:", error.response.data);
    }
    return false;
  }
}

/**
 * توضیح فارسی: سناریو 3: ایجاد کد تخفیف
 */
async function scenario3_CreateDiscount() {
  console.log("\n🎁 سناریو 3: ایجاد کد تخفیف");
  
  try {
    const discountResponse = await axios.post(
      `${BASE_URL}/admin/discount`,
      {
        disTitle: "تخفیف تست 20%",
        disType: "general",
        applyOnInvoice: true,
        autoApplyOnInvoice: false,
        disStart: new Date(),
        disEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 روز بعد
        firstInvoiceOnly: false,
        amountRange: {
          from: 100000,
          to: 10000000,
        },
        disValue: {
          type: "percent",
          fixedAmount: 20,
        },
        maxProfitLimit: true,
        usageCount: 100,
        useInSpecialProducts: false,
        generateCode: true,
        disCode: "TEST20",
        filters: {
          userFilter: {
            allUsers: true,
          },
          productFilter: {
            allProducts: true,
          },
        },
        isActive: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (discountResponse.data.status === 200) {
      console.log("✅ کد تخفیف با موفقیت ایجاد شد");
      console.log(`   کد: ${discountResponse.data.data?.disCode || "N/A"}`);
      return true;
    } else {
      console.log(`❌ خطا: ${discountResponse.data.message}`);
      return false;
    }
  } catch (error: any) {
    console.error("❌ خطا:", error.message);
    if (error.response) {
      console.error("   پاسخ:", error.response.data);
    }
    return false;
  }
}

/**
 * توضیح فارسی: سناریو 4: افزودن موجودی
 */
async function scenario4_AddInventory() {
  console.log("\n📊 سناریو 4: افزودن موجودی");
  
  try {
    // کامنت: دریافت انبارها
    const warehousesResponse = await axios.get(`${BASE_URL}/admin/warehouse`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!warehousesResponse.data.warehouses || warehousesResponse.data.warehouses.length === 0) {
      console.log("⚠️  انباری یافت نشد. لطفاً ابتدا انبار ایجاد کنید.");
      return false;
    }

    const warehouseId = warehousesResponse.data.warehouses[0]._id;

    // کامنت: دریافت محصولات
    const productsResponse = await axios.get(`${BASE_URL}/admin/product`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!productsResponse.data.data || productsResponse.data.data.length === 0) {
      console.log("⚠️  محصولی یافت نشد. لطفاً ابتدا محصول ایجاد کنید.");
      return false;
    }

    const product = productsResponse.data.data[0];

    // کامنت: افزودن موجودی
    const inventoryResponse = await axios.post(
      `${BASE_URL}/admin/warehouse/${warehouseId}/inventory`,
      {
        variantId: product._id,
        quantity: 100,
        variantPrice: 100000,
        purchasePrice: 80000,
        min_stock_threshold: 10,
        batch_number: "BATCH-TEST-001",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (inventoryResponse.data.status === 200 || inventoryResponse.data._id) {
      console.log("✅ موجودی با موفقیت اضافه شد");
      return true;
    } else {
      console.log(`❌ خطا: ${inventoryResponse.data.message || "خطای نامشخص"}`);
      return false;
    }
  } catch (error: any) {
    console.error("❌ خطا:", error.message);
    if (error.response) {
      console.error("   پاسخ:", error.response.data);
    }
    return false;
  }
}

/**
 * توضیح فارسی: اجرای همه سناریوها
 */
async function runAllScenarios() {
  console.log("🚀 شروع اجرای سناریوهای تستی\n");
  console.log("=" .repeat(50));

  // کامنت: لاگین
  console.log("\n🔐 در حال لاگین...");
  adminToken = await loginAdmin();
  userToken = await loginUser();

  if (!adminToken) {
    console.error("❌ لاگین ادمین ناموفق بود");
    return;
  }
  if (!userToken) {
    console.error("❌ لاگین یوزر ناموفق بود");
    return;
  }
  console.log("✅ لاگین موفق بود");

  // کامنت: اجرای سناریوها
  const results = {
    scenario1: await scenario1_AddToBasket(),
    scenario2: await scenario2_CreateOrder(),
    scenario3: await scenario3_CreateDiscount(),
    scenario4: await scenario4_AddInventory(),
  };

  // کامنت: گزارش نتایج
  console.log("\n" + "=".repeat(50));
  console.log("📊 گزارش نتایج:");
  console.log(`   سناریو 1 (افزودن به سبد): ${results.scenario1 ? "✅" : "❌"}`);
  console.log(`   سناریو 2 (ایجاد سفارش): ${results.scenario2 ? "✅" : "❌"}`);
  console.log(`   سناریو 3 (ایجاد تخفیف): ${results.scenario3 ? "✅" : "❌"}`);
  console.log(`   سناریو 4 (افزودن موجودی): ${results.scenario4 ? "✅" : "❌"}`);

  const successCount = Object.values(results).filter(r => r).length;
  console.log(`\n✅ ${successCount} از ${Object.keys(results).length} سناریو موفق بودند`);
}

// کامنت: اجرای اسکریپت
if (require.main === module) {
  runAllScenarios()
    .then(() => {
      console.log("\n✅ اجرای سناریوها به پایان رسید");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ خطا در اجرای سناریوها:", error);
      process.exit(1);
    });
}

export { runAllScenarios };

