/**
 * توضیح فارسی: اسکریپت Seed برای ایجاد داده‌های نمونه
 * این اسکریپت 5 ادمین و 10 یوزر تستی ایجاد می‌کند.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { AdminModel } from "../core/mongoose-controller/repositories/admin/model";
import { UserModel } from "../core/mongoose-controller/repositories/user/model";
import { WarehouseModel } from "../repositories/admin/warehouse/model";
import { ProductModel } from "../repositories/admin/product/model";
import { BrandModel } from "../repositories/admin/brand/model";
import { CategoryModel } from "../core/mongoose-controller/repositories/category/model";
import { ProductwarehouseModel } from "../repositories/admin/productWarehouse/model";
import { DiscountModel } from "../repositories/admin/discount/model";

/**
 * توضیح فارسی: داده‌های نمونه ادمین
 */
const sampleAdmins = [
  {
    name: "علی",
    familyName: "احمدی",
    userName: "admin1",
    email: "admin1@test.com",
    phoneNumber: "09121111111",
    password: "Admin123!",
    isSuperAdmin: true,
    validIPList: ["*"],
    towFactorLogIn: false,
  },
  {
    name: "محمد",
    familyName: "رضایی",
    userName: "admin2",
    email: "admin2@test.com",
    phoneNumber: "09122222222",
    password: "Admin123!",
    isSuperAdmin: false,
    validIPList: ["*"],
    towFactorLogIn: false,
  },
  {
    name: "حسن",
    familyName: "کریمی",
    userName: "admin3",
    email: "admin3@test.com",
    phoneNumber: "09123333333",
    password: "Admin123!",
    isSuperAdmin: false,
    validIPList: ["*"],
    towFactorLogIn: false,
  },
  {
    name: "رضا",
    familyName: "موسوی",
    userName: "admin4",
    email: "admin4@test.com",
    phoneNumber: "09124444444",
    password: "Admin123!",
    isSuperAdmin: false,
    validIPList: ["*"],
    towFactorLogIn: false,
  },
  {
    name: "حسین",
    familyName: "نوری",
    userName: "admin5",
    email: "admin5@test.com",
    phoneNumber: "09125555555",
    password: "Admin123!",
    isSuperAdmin: false,
    validIPList: ["*"],
    towFactorLogIn: false,
  },
];

/**
 * توضیح فارسی: داده‌های نمونه یوزر
 */
const sampleUsers = [
  {
    name: "فاطمه",
    family: "محمدی",
    email: "user1@test.com",
    phoneNumber: "09131111111",
    password: "User123!",
    wallet: 1000000,
  },
  {
    name: "زهرا",
    family: "احمدی",
    email: "user2@test.com",
    phoneNumber: "09132222222",
    password: "User123!",
    wallet: 500000,
  },
  {
    name: "مریم",
    family: "رضایی",
    email: "user3@test.com",
    phoneNumber: "09133333333",
    password: "User123!",
    wallet: 2000000,
  },
  {
    name: "سارا",
    family: "کریمی",
    email: "user4@test.com",
    phoneNumber: "09134444444",
    password: "User123!",
    wallet: 750000,
  },
  {
    name: "نرگس",
    family: "موسوی",
    email: "user5@test.com",
    phoneNumber: "09135555555",
    password: "User123!",
    wallet: 300000,
  },
  {
    name: "امیر",
    family: "نوری",
    email: "user6@test.com",
    phoneNumber: "09136666666",
    password: "User123!",
    wallet: 1500000,
  },
  {
    name: "رضا",
    family: "حسینی",
    email: "user7@test.com",
    phoneNumber: "09137777777",
    password: "User123!",
    wallet: 800000,
  },
  {
    name: "علی",
    family: "جعفری",
    email: "user8@test.com",
    phoneNumber: "09138888888",
    password: "User123!",
    wallet: 1200000,
  },
  {
    name: "محمد",
    family: "صادقی",
    email: "user9@test.com",
    phoneNumber: "09139999999",
    password: "User123!",
    wallet: 600000,
  },
  {
    name: "حسن",
    family: "اکبری",
    email: "user10@test.com",
    phoneNumber: "09130000000",
    password: "User123!",
    wallet: 900000,
  },
];

/**
 * توضیح فارسی: ایجاد ادمین‌های نمونه
 */
async function seedAdmins() {
  console.log("🌱 در حال ایجاد ادمین‌های نمونه...");
  
  for (const adminData of sampleAdmins) {
    const existingAdmin = await AdminModel.findOne({
      $or: [
        { email: adminData.email },
        { userName: adminData.userName },
        { phoneNumber: adminData.phoneNumber },
      ],
    });

    if (existingAdmin) {
      console.log(`⚠️  ادمین ${adminData.userName} از قبل وجود دارد.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const admin = new AdminModel({
      ...adminData,
      password: hashedPassword,
      createAt: new Date(),
      passwordLastChange: new Date(),
      passwords: [hashedPassword],
    });

    await admin.save();
    console.log(`✅ ادمین ${adminData.userName} ایجاد شد.`);
  }
}

/**
 * توضیح فارسی: ایجاد یوزرهای نمونه
 */
async function seedUsers() {
  console.log("🌱 در حال ایجاد یوزرهای نمونه...");
  
  for (const userData of sampleUsers) {
    const existingUser = await UserModel.findOne({
      $or: [
        { email: userData.email },
        { phoneNumber: userData.phoneNumber },
      ],
    });

    if (existingUser) {
      console.log(`⚠️  یوزر ${userData.email} از قبل وجود دارد.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new UserModel({
      ...userData,
      password: hashedPassword,
      passwordLastChange: new Date(),
      passwords: [hashedPassword],
      changePassword: false,
      wallet: userData.wallet || 0,
    });

    await user.save();
    console.log(`✅ یوزر ${userData.email} ایجاد شد.`);
  }
}

/**
 * توضیح فارسی: ایجاد انبار نمونه
 */
async function seedWarehouse() {
  console.log("🌱 در حال ایجاد انبار نمونه...");
  
  const existingWarehouse = await WarehouseModel.findOne({ title: "انبار مرکزی" });
  if (existingWarehouse) {
    console.log("⚠️  انبار مرکزی از قبل وجود دارد.");
    return existingWarehouse._id;
  }

  const admin = await AdminModel.findOne({ isSuperAdmin: true });
  if (!admin) {
    console.log("⚠️  ادمین برای ایجاد انبار یافت نشد.");
    return null;
  }

  const warehouse = new WarehouseModel({
    title: "انبار مرکزی",
    description: "انبار مرکزی تست",
    address: "تهران، خیابان ولیعصر",
    phone: "02112345678",
    manager: admin._id,
    capacity: 10000,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await warehouse.save();
  console.log("✅ انبار مرکزی ایجاد شد.");
  return warehouse._id;
}

/**
 * توضیح فارسی: اجرای Seed
 */
async function runSeed() {
  try {
    // کامنت: اتصال به دیتابیس
    const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/shopping-test";
    await mongoose.connect(dbUrl);
    console.log("✅ اتصال به دیتابیس برقرار شد.");

    // کامنت: ایجاد داده‌های نمونه
    await seedAdmins();
    await seedUsers();
    const warehouseId = await seedWarehouse();

    console.log("\n✅ Seed با موفقیت انجام شد!");
    console.log("\n📋 خلاصه:");
    console.log(`   - 5 ادمین ایجاد شد`);
    console.log(`   - 10 یوزر ایجاد شد`);
    if (warehouseId) {
      console.log(`   - 1 انبار ایجاد شد`);
    }
    console.log("\n🔑 اطلاعات لاگین:");
    console.log("   ادمین‌ها: admin1@test.com تا admin5@test.com (رمز: Admin123!)");
    console.log("   یوزرها: user1@test.com تا user10@test.com (رمز: User123!)");

    await mongoose.disconnect();
    console.log("\n✅ اتصال به دیتابیس بسته شد.");
  } catch (error: any) {
    console.error("❌ خطا در اجرای Seed:", error);
    process.exit(1);
  }
}

// کامنت: اجرای Seed در صورت فراخوانی مستقیم
if (require.main === module) {
  runSeed();
}

export { runSeed, sampleAdmins, sampleUsers };

