/**
 * توضیح فارسی: اسکریپت Seed کامل برای فروشگاه موبایل
 * این اسکریپت داده‌های کامل برای یک فروشگاه موبایل ایجاد می‌کند:
 * - ادمین‌ها و کاربران
 * - برندهای موبایل
 * - دسته‌بندی‌ها
 * - محصولات موبایل با جزئیات
 * - موجودی در انبار
 * - تخفیف‌ها
 * - پیک‌ها
 * - آدرس‌های نمونه
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { AdminModel } from "../../core/mongoose-controller/repositories/admin/model";
import { UserModel } from "../../repositories/user/model";
import { WarehouseModel } from "../../repositories/admin/warehouse/model";
import { ProductModel } from "../../repositories/admin/product/model";
import { BrandModel } from "../../repositories/admin/brand/model";
import { CategoryModel } from "../../core/mongoose-controller/repositories/category/model";
import { LanguageModel } from "../../core/mongoose-controller/repositories/language/model";
import { ProductwarehouseModel } from "../../repositories/admin/productWarehouse/model";
import { DiscountModel } from "../../repositories/admin/discount/model";
import { CourierModel } from "../../repositories/admin/courier/model";
import { AddressModel } from "../../repositories/admin/address/model";
import { Types } from "mongoose";

/**
 * توضیح فارسی: داده‌های نمونه ادمین
 */
const sampleAdmins = [
  {
    name: "علی",
    familyName: "احمدی",
    userName: "admin1",
    email: "admin1@mobile-shop.com",
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
    email: "admin2@mobile-shop.com",
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
    email: "admin3@mobile-shop.com",
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
    email: "admin4@mobile-shop.com",
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
    email: "admin5@mobile-shop.com",
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
    email: "user1@mobile-shop.com",
    phoneNumber: "09131111111",
    password: "User123!",
    wallet: 50000000, // 50 میلیون تومان
  },
  {
    name: "زهرا",
    family: "احمدی",
    email: "user2@mobile-shop.com",
    phoneNumber: "09132222222",
    password: "User123!",
    wallet: 30000000,
  },
  {
    name: "مریم",
    family: "رضایی",
    email: "user3@mobile-shop.com",
    phoneNumber: "09133333333",
    password: "User123!",
    wallet: 80000000,
  },
  {
    name: "سارا",
    family: "کریمی",
    email: "user4@mobile-shop.com",
    phoneNumber: "09134444444",
    password: "User123!",
    wallet: 25000000,
  },
  {
    name: "نرگس",
    family: "موسوی",
    email: "user5@mobile-shop.com",
    phoneNumber: "09135555555",
    password: "User123!",
    wallet: 40000000,
  },
  {
    name: "امیر",
    family: "نوری",
    email: "user6@mobile-shop.com",
    phoneNumber: "09136666666",
    password: "User123!",
    wallet: 60000000,
  },
  {
    name: "رضا",
    family: "حسینی",
    email: "user7@mobile-shop.com",
    phoneNumber: "09137777777",
    password: "User123!",
    wallet: 35000000,
  },
  {
    name: "علی",
    family: "جعفری",
    email: "user8@mobile-shop.com",
    phoneNumber: "09138888888",
    password: "User123!",
    wallet: 45000000,
  },
  {
    name: "محمد",
    family: "صادقی",
    email: "user9@mobile-shop.com",
    phoneNumber: "09139999999",
    password: "User123!",
    wallet: 70000000,
  },
  {
    name: "حسن",
    family: "اکبری",
    email: "user10@mobile-shop.com",
    phoneNumber: "09130000000",
    password: "User123!",
    wallet: 55000000,
  },
];

/**
 * توضیح فارسی: برندهای موبایل
 */
const mobileBrands = [
  {
    title: "سامسونگ",
    description: "برند کره‌ای پیشرو در تولید گوشی‌های هوشمند",
    summary: "سامسونگ یکی از بزرگ‌ترین تولیدکنندگان گوشی‌های هوشمند در جهان",
  },
  {
    title: "اپل",
    description: "برند آمریکایی تولیدکننده آیفون",
    summary: "اپل با آیفون‌های خود یکی از محبوب‌ترین برندهای موبایل است",
  },
  {
    title: "شیائومی",
    description: "برند چینی با قیمت مناسب و کیفیت بالا",
    summary: "شیائومی با قیمت‌های مناسب و کیفیت بالا محبوبیت زیادی دارد",
  },
  {
    title: "هواوی",
    description: "برند چینی پیشرو در تکنولوژی",
    summary: "هواوی با تکنولوژی پیشرفته و دوربین‌های قدرتمند",
  },
  {
    title: "آنر",
    description: "زیرمجموعه هواوی با قیمت مناسب",
    summary: "آنر با قیمت‌های مناسب و طراحی زیبا",
  },
  {
    title: "نوکیا",
    description: "برند فنلاندی با کیفیت بالا",
    summary: "نوکیا با کیفیت ساخت بالا و دوام زیاد",
  },
  {
    title: "گوگل",
    description: "برند آمریکایی با سیستم عامل خالص",
    summary: "گوگل پیکسل با سیستم عامل خالص اندروید",
  },
  {
    title: "وان پلاس",
    description: "برند چینی با عملکرد بالا",
    summary: "وان پلاس با عملکرد بالا و طراحی زیبا",
  },
];

/**
 * توضیح فارسی: دسته‌بندی‌های محصولات
 */
const categories = [
  {
    title: "گوشی موبایل",
    description: "گوشی‌های هوشمند",
    seo: {
      url: "mobile-phones",
      seoTitle: "خرید گوشی موبایل",
      metaDescription: "خرید انواع گوشی موبایل با بهترین قیمت",
    },
  },
  {
    title: "تبلت",
    description: "تبلت‌های هوشمند",
    seo: {
      url: "tablets",
      seoTitle: "خرید تبلت",
      metaDescription: "خرید انواع تبلت با بهترین قیمت",
    },
  },
  {
    title: "لوازم جانبی",
    description: "لوازم جانبی موبایل",
    seo: {
      url: "accessories",
      seoTitle: "خرید لوازم جانبی موبایل",
      metaDescription: "خرید انواع لوازم جانبی موبایل",
    },
  },
];

/**
 * توضیح فارسی: محصولات موبایل
 */
const mobileProducts = [
  // سامسونگ
  {
    title: "گوشی سامسونگ گلکسی S24 Ultra",
    price: 65000000,
    description: "گوشی هوشمند سامسونگ گلکسی S24 Ultra با پردازنده Snapdragon 8 Gen 3، حافظه 256GB، RAM 12GB، دوربین 200 مگاپیکسلی",
    summary: "گلکسی S24 Ultra با بهترین امکانات",
    image: "https://images.samsung.com/is/image/samsung/p6pim/ir/2401/gallery/ir-galaxy-s24-s928-sm-s928bzkgmeb-thumb-539800200",
    brandName: "سامسونگ",
    categoryName: "گوشی موبایل",
    config: {
      ram: "12GB",
      storage: "256GB",
      screen: "6.8 اینچ",
      camera: "200MP",
      battery: "5000mAh",
      processor: "Snapdragon 8 Gen 3",
      weight: "233g",
    },
    purchasePrice: 58000000,
    stock: 15,
  },
  {
    title: "گوشی سامسونگ گلکسی A54",
    price: 18000000,
    description: "گوشی هوشمند سامسونگ گلکسی A54 با پردازنده Exynos 1380، حافظه 128GB، RAM 8GB، دوربین 50 مگاپیکسلی",
    summary: "گلکسی A54 با قیمت مناسب",
    image: "https://images.samsung.com/is/image/samsung/p6pim/ir/sm-a546blgheir/gallery/ir-galaxy-a54-5g-sm-a546-sm-a546blgheir-thumb-533856134",
    brandName: "سامسونگ",
    categoryName: "گوشی موبایل",
    config: {
      ram: "8GB",
      storage: "128GB",
      screen: "6.4 اینچ",
      camera: "50MP",
      battery: "5000mAh",
      processor: "Exynos 1380",
      weight: "202g",
    },
    purchasePrice: 16000000,
    stock: 30,
  },
  // اپل
  {
    title: "گوشی آیفون 15 Pro Max",
    price: 75000000,
    description: "گوشی هوشمند آیفون 15 Pro Max با پردازنده A17 Pro، حافظه 256GB، دوربین 48 مگاپیکسلی",
    summary: "آیفون 15 Pro Max با بهترین عملکرد",
    image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-natural-titanium-select",
    brandName: "اپل",
    categoryName: "گوشی موبایل",
    config: {
      ram: "8GB",
      storage: "256GB",
      screen: "6.7 اینچ",
      camera: "48MP",
      battery: "4441mAh",
      processor: "A17 Pro",
      weight: "221g",
    },
    purchasePrice: 68000000,
    stock: 10,
  },
  {
    title: "گوشی آیفون 14",
    price: 45000000,
    description: "گوشی هوشمند آیفون 14 با پردازنده A15 Bionic، حافظه 128GB، دوربین 12 مگاپیکسلی",
    summary: "آیفون 14 با قیمت مناسب",
    image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-select",
    brandName: "اپل",
    categoryName: "گوشی موبایل",
    config: {
      ram: "6GB",
      storage: "128GB",
      screen: "6.1 اینچ",
      camera: "12MP",
      battery: "3279mAh",
      processor: "A15 Bionic",
      weight: "172g",
    },
    purchasePrice: 40000000,
    stock: 20,
  },
  // شیائومی
  {
    title: "گوشی شیائومی 14 Pro",
    price: 35000000,
    description: "گوشی هوشمند شیائومی 14 Pro با پردازنده Snapdragon 8 Gen 3، حافظه 256GB، RAM 12GB، دوربین 50 مگاپیکسلی",
    summary: "شیائومی 14 Pro با عملکرد بالا",
    image: "https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1703234569.11111111.png",
    brandName: "شیائومی",
    categoryName: "گوشی موبایل",
    config: {
      ram: "12GB",
      storage: "256GB",
      screen: "6.36 اینچ",
      camera: "50MP",
      battery: "4610mAh",
      processor: "Snapdragon 8 Gen 3",
      weight: "209g",
    },
    purchasePrice: 30000000,
    stock: 25,
  },
  {
    title: "گوشی شیائومی Redmi Note 13",
    price: 12000000,
    description: "گوشی هوشمند شیائومی Redmi Note 13 با پردازنده Snapdragon 685، حافظه 128GB، RAM 8GB",
    summary: "Redmi Note 13 با قیمت مناسب",
    image: "https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1703234569.11111111.png",
    brandName: "شیائومی",
    categoryName: "گوشی موبایل",
    config: {
      ram: "8GB",
      storage: "128GB",
      screen: "6.67 اینچ",
      camera: "108MP",
      battery: "5000mAh",
      processor: "Snapdragon 685",
      weight: "199g",
    },
    purchasePrice: 10000000,
    stock: 40,
  },
  // هواوی
  {
    title: "گوشی هواوی P60 Pro",
    price: 55000000,
    description: "گوشی هوشمند هواوی P60 Pro با پردازنده Snapdragon 8+ Gen 1، حافظه 256GB، دوربین 48 مگاپیکسلی",
    summary: "هواوی P60 Pro با دوربین قدرتمند",
    image: "https://consumer.huawei.com/content/dam/huawei-cbg-site/common/mkt/pdp/phones/p60-pro/images/p60-pro-kv.jpg",
    brandName: "هواوی",
    categoryName: "گوشی موبایل",
    config: {
      ram: "12GB",
      storage: "256GB",
      screen: "6.67 اینچ",
      camera: "48MP",
      battery: "4815mAh",
      processor: "Snapdragon 8+ Gen 1",
      weight: "200g",
    },
    purchasePrice: 48000000,
    stock: 12,
  },
  // آنر
  {
    title: "گوشی آنر 90",
    price: 22000000,
    description: "گوشی هوشمند آنر 90 با پردازنده Snapdragon 7 Gen 1، حافظه 256GB، RAM 12GB",
    summary: "آنر 90 با طراحی زیبا",
    image: "https://www.hihonor.com/content/dam/honor/cn/products/honor-90/images/honor-90-kv.jpg",
    brandName: "آنر",
    categoryName: "گوشی موبایل",
    config: {
      ram: "12GB",
      storage: "256GB",
      screen: "6.7 اینچ",
      camera: "200MP",
      battery: "5000mAh",
      processor: "Snapdragon 7 Gen 1",
      weight: "183g",
    },
    purchasePrice: 19000000,
    stock: 28,
  },
];

/**
 * توضیح فارسی: تخفیف‌های نمونه
 */
const discounts = [
  {
    title: "تخفیف ویژه نوروز",
    disCode: "NOWRUZ1403",
    disValue: {
      type: "percent",
      fixedAmount: 15, // 15% تخفیف
    },
    amountRange: {
      from: 10000000,
      to: 100000000,
    },
    disStart: new Date("2025-01-01"),
    disEnd: new Date("2025-04-20"),
    usageCount: 1000,
    isActive: true,
    firstInvoiceOnly: false,
    autoApplyOnInvoice: false,
  },
  {
    title: "تخفیف اولین خرید",
    disCode: "FIRSTBUY",
    disValue: {
      type: "fixed",
      fixedAmount: 500000, // 500 هزار تومان تخفیف
    },
    amountRange: {
      from: 5000000,
      to: 100000000,
    },
    disStart: new Date("2025-01-01"),
    disEnd: new Date("2025-12-31"),
    usageCount: 500,
    isActive: true,
    firstInvoiceOnly: true,
    autoApplyOnInvoice: false,
  },
  {
    title: "تخفیف محصولات سامسونگ",
    disCode: "SAMSUNG20",
    disValue: {
      type: "percent",
      fixedAmount: 20, // 20% تخفیف
    },
    amountRange: {
      from: 15000000,
      to: 100000000,
    },
    disStart: new Date("2025-01-01"),
    disEnd: new Date("2025-12-31"),
    usageCount: 200,
    isActive: true,
    firstInvoiceOnly: false,
    autoApplyOnInvoice: false,
  },
];

/**
 * توضیح فارسی: پیک‌های نمونه
 */
const couriers = [
  {
    name: "رضا پیک",
    phone: "09121111111",
    vehicle: "motorbike",
    capacity: {
      count: 50,
      weightKg: 100,
    },
    shift: {
      start: "08:00",
      end: "18:00",
    },
    currentLocation: {
      type: "Point",
      coordinates: [51.3890, 35.6892], // تهران
      updatedAt: new Date(),
    },
    status: "available",
  },
  {
    name: "علی پیک",
    phone: "09122222222",
    vehicle: "motorbike",
    capacity: {
      count: 60,
      weightKg: 120,
    },
    shift: {
      start: "09:00",
      end: "19:00",
    },
    currentLocation: {
      type: "Point",
      coordinates: [51.4200, 35.7000], // تهران - شمال
      updatedAt: new Date(),
    },
    status: "available",
  },
  {
    name: "محمد پیک",
    phone: "09123333333",
    vehicle: "car",
    capacity: {
      count: 100,
      weightKg: 500,
    },
    shift: {
      start: "08:00",
      end: "20:00",
    },
    currentLocation: {
      type: "Point",
      coordinates: [51.3500, 35.6800], // تهران - جنوب
      updatedAt: new Date(),
    },
    status: "available",
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
 * توضیح فارسی: ایجاد انبار مرکزی
 */
async function seedWarehouse() {
  console.log("🌱 در حال ایجاد انبار مرکزی...");
  
  const existingWarehouse = await WarehouseModel.findOne({ title: "انبار مرکزی تهران" });
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
    title: "انبار مرکزی تهران",
    description: "انبار مرکزی فروشگاه موبایل در تهران",
    address: "تهران، خیابان ولیعصر، پلاک 100",
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
 * توضیح فارسی: ایجاد یا یافتن زبان پیش‌فرض
 */
async function getOrCreateDefaultLanguage(): Promise<Types.ObjectId> {
  // کامنت: جستجوی زبان فارسی
  let language = await LanguageModel.findOne({ sign: "fa" });
  
  if (!language) {
    // کامنت: ایجاد زبان فارسی در صورت عدم وجود
    language = new LanguageModel({
      title: "فارسی",
      panelTitle: "فارسی",
      sign: "fa",
      direction: "rtl",
      status: true,
      isDefault: true,
      showInLangList: true,
      index: true,
      translation: {},
      countries: ["IR"],
    });
    
    await language.save();
    console.log("✅ زبان فارسی ایجاد شد.");
  } else {
    console.log("✅ زبان فارسی از قبل وجود دارد.");
  }
  
  return language._id;
}

/**
 * توضیح فارسی: ایجاد دسته‌بندی‌ها
 */
async function seedCategories() {
  console.log("🌱 در حال ایجاد دسته‌بندی‌ها...");
  
  // کامنت: دریافت یا ایجاد زبان پیش‌فرض
  const languageId = await getOrCreateDefaultLanguage();
  
  const categoryMap = new Map<string, Types.ObjectId>();

  for (const catData of categories) {
    const existingCategory = await CategoryModel.findOne({ title: catData.title });
    if (existingCategory) {
      console.log(`⚠️  دسته‌بندی ${catData.title} از قبل وجود دارد.`);
      categoryMap.set(catData.title, existingCategory._id);
      continue;
    }

    const category = new CategoryModel({
      title: catData.title,
      language: languageId,
      useage: 0,
    });

    await category.save();
    categoryMap.set(catData.title, category._id);
    console.log(`✅ دسته‌بندی ${catData.title} ایجاد شد.`);
  }

  return categoryMap;
}

/**
 * توضیح فارسی: ایجاد برندها
 */
async function seedBrands() {
  console.log("🌱 در حال ایجاد برندها...");
  
  const brandMap = new Map<string, Types.ObjectId>();

  for (const brandData of mobileBrands) {
    const existingBrand = await BrandModel.findOne({ title: brandData.title });
    if (existingBrand) {
      console.log(`⚠️  برند ${brandData.title} از قبل وجود دارد.`);
      brandMap.set(brandData.title, existingBrand._id);
      continue;
    }

    const brand = new BrandModel({
      title: brandData.title,
      description: brandData.description,
      summary: brandData.summary,
      isPublished: true,
      publishDate: new Date(),
    });

    await brand.save();
    brandMap.set(brandData.title, brand._id);
    console.log(`✅ برند ${brandData.title} ایجاد شد.`);
  }

  return brandMap;
}

/**
 * توضیح فارسی: ایجاد محصولات
 */
async function seedProducts(brandMap: Map<string, Types.ObjectId>, categoryMap: Map<string, Types.ObjectId>, warehouseId: Types.ObjectId) {
  console.log("🌱 در حال ایجاد محصولات...");
  
  const productMap = new Map<string, Types.ObjectId>();

  for (const productData of mobileProducts) {
    const existingProduct = await ProductModel.findOne({ title: productData.title });
    if (existingProduct) {
      console.log(`⚠️  محصول ${productData.title} از قبل وجود دارد.`);
      productMap.set(productData.title, existingProduct._id);
      continue;
    }

    const brandId = brandMap.get(productData.brandName);
    const categoryId = categoryMap.get(productData.categoryName);

    if (!brandId || !categoryId) {
      console.log(`⚠️  برند یا دسته‌بندی برای ${productData.title} یافت نشد.`);
      continue;
    }

    const product = new ProductModel({
      title: productData.title,
      price: productData.price,
      description: productData.description,
      summary: productData.summary,
      image: productData.image,
      brand: brandId,
      category: categoryId,
      features: [],
      config: productData.config,
      isPublished: true,
      publishDate: new Date(),
    });

    await product.save();
    productMap.set(productData.title, product._id);
    console.log(`✅ محصول ${productData.title} ایجاد شد.`);

    // کامنت: ایجاد موجودی در انبار
    const productWarehouse = new ProductwarehouseModel({
      warehouse: warehouseId,
      product: product._id,
      quantity: productData.stock,
      variantPrice: productData.price,
      purchasePrice: productData.purchasePrice,
      price: productData.price,
      minStockThreshold: 5,
      batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date(),
      config: productData.config,
    });

    await productWarehouse.save();
    console.log(`   📦 موجودی ${productData.stock} عدد در انبار ثبت شد.`);
  }

  return productMap;
}

/**
 * توضیح فارسی: ایجاد تخفیف‌ها
 */
async function seedDiscounts() {
  console.log("🌱 در حال ایجاد تخفیف‌ها...");
  
  for (const discountData of discounts) {
    const existingDiscount = await DiscountModel.findOne({ disCode: discountData.disCode });
    if (existingDiscount) {
      console.log(`⚠️  تخفیف ${discountData.disCode} از قبل وجود دارد.`);
      continue;
    }

    const discount = new DiscountModel({
      title: discountData.title,
      disTitle: discountData.title,
      disType: "general",
      applyOnInvoice: false,
      autoApplyOnInvoice: discountData.autoApplyOnInvoice || false,
      disStart: discountData.disStart,
      disEnd: discountData.disEnd,
      firstInvoiceOnly: discountData.firstInvoiceOnly,
      amountRange: discountData.amountRange,
      disValue: discountData.disValue,
      maxProfitLimit: true,
      usageCount: discountData.usageCount,
      useInSpecialProducts: false,
      generateCode: false,
      disCode: discountData.disCode,
      filters: {
        userFilter: {
          allUsers: true,
        },
        productFilter: {
          allProducts: true,
        },
      },
      isActive: discountData.isActive,
      isPublished: true,
      publishDate: new Date(),
      createdAt: new Date(),
    });

    await discount.save();
    console.log(`✅ تخفیف ${discountData.title} (${discountData.disCode}) ایجاد شد.`);
  }
}

/**
 * توضیح فارسی: ایجاد پیک‌ها
 */
async function seedCouriers() {
  console.log("🌱 در حال ایجاد پیک‌ها...");
  
  for (const courierData of couriers) {
    const existingCourier = await CourierModel.findOne({ phone: courierData.phone });
    if (existingCourier) {
      console.log(`⚠️  پیک ${courierData.name} از قبل وجود دارد.`);
      continue;
    }

    const courier = new CourierModel({
      ...courierData,
      isPublished: true,
      publishDate: new Date(),
    });

    await courier.save();
    console.log(`✅ پیک ${courierData.name} ایجاد شد.`);
  }
}

/**
 * توضیح فارسی: ایجاد آدرس‌های نمونه برای کاربران
 */
async function seedAddresses() {
  console.log("🌱 در حال ایجاد آدرس‌های نمونه...");
  
  const users = await UserModel.find().limit(5); // فقط برای 5 کاربر اول

  for (const user of users) {
    const existingAddress = await AddressModel.findOne({ user: user._id });
    if (existingAddress) {
      console.log(`⚠️  آدرس برای کاربر ${user.email} از قبل وجود دارد.`);
      continue;
    }

    const address = new AddressModel({
      user: user._id,
      addressList: [
        {
          title: "خانه",
          province: "تهران",
          city: "تهران",
          district: "منطقه 1",
          address: "خیابان ولیعصر، پلاک 100",
          postalCode: "1234567890",
          phone: user.phoneNumber,
          isDefault: true,
          location: {
            lat: 35.6892 + (Math.random() - 0.5) * 0.1,
            lng: 51.3890 + (Math.random() - 0.5) * 0.1,
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await address.save();
    console.log(`✅ آدرس برای کاربر ${user.email} ایجاد شد.`);
  }
}

/**
 * توضیح فارسی: اجرای Seed کامل
 */
async function runSeed() {
  try {
    // کامنت: اتصال به دیتابیس
    const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/shopping-test";
    await mongoose.connect(dbUrl);
    console.log("✅ اتصال به دیتابیس برقرار شد.\n");

    // کامنت: ایجاد داده‌های نمونه به ترتیب
    await seedAdmins();
    console.log("");
    
    await seedUsers();
    console.log("");
    
    const warehouseId = await seedWarehouse();
    console.log("");
    
    const categoryMap = await seedCategories();
    console.log("");
    
    const brandMap = await seedBrands();
    console.log("");
    
    if (warehouseId) {
      await seedProducts(brandMap, categoryMap, warehouseId);
      console.log("");
    }
    
    await seedDiscounts();
    console.log("");
    
    await seedCouriers();
    console.log("");
    
    await seedAddresses();
    console.log("");

    console.log("\n✅ Seed کامل با موفقیت انجام شد!");
    console.log("\n📋 خلاصه:");
    console.log(`   - 5 ادمین ایجاد شد`);
    console.log(`   - 10 کاربر ایجاد شد`);
    console.log(`   - 1 انبار مرکزی ایجاد شد`);
    console.log(`   - ${categories.length} دسته‌بندی ایجاد شد`);
    console.log(`   - ${mobileBrands.length} برند ایجاد شد`);
    console.log(`   - ${mobileProducts.length} محصول ایجاد شد`);
    console.log(`   - ${discounts.length} تخفیف ایجاد شد`);
    console.log(`   - ${couriers.length} پیک ایجاد شد`);
    console.log(`   - 5 آدرس نمونه ایجاد شد`);
    
    console.log("\n🔑 اطلاعات لاگین:");
    console.log("   ادمین‌ها: admin1@mobile-shop.com تا admin5@mobile-shop.com (رمز: Admin123!)");
    console.log("   کاربران: user1@mobile-shop.com تا user10@mobile-shop.com (رمز: User123!)");
    
    console.log("\n💰 کدهای تخفیف:");
    console.log("   - NOWRUZ1403: 15% تخفیف (حداقل 10 میلیون تومان)");
    console.log("   - FIRSTBUY: 500 هزار تومان تخفیف برای اولین خرید");
    console.log("   - SAMSUNG20: 20% تخفیف روی محصولات سامسونگ");

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

export { runSeed, sampleAdmins, sampleUsers, mobileBrands, mobileProducts, discounts, couriers };

