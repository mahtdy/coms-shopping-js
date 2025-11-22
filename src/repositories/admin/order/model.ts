import { Types, Schema, model, Document } from "mongoose";
import BaseUser from "../../../core/mongoose-controller/repositories/user/model";
import Product from "../product/model";
import Productwarehouse from "../productWarehouse/model";
import Basket from "../basket/model";
import Address from "../address/model";
import Package from "../package/model";
import { string } from "zod";

// const uniqueValidator = require("mongoose-unique-validator");
export default interface Order extends Document {
  user: string;
  orderList: {
    product: string | Product;
    productwarehouse: string | Productwarehouse;
    price: number;
    quantity: number;
  }[];
  totalCost: number;         // هزینه کل (خرید + جاری)
  totalPriceProducts: number; // قیمت کل محصولات
  
  // کامنت: شماره فاکتور و وضعیت
  orderNumber?: string;      // شماره فاکتور (ORD-2025-0001)
  orderStatus?: "pending" | "confirmed" | "processing" | "completed" | "cancelled"; // وضعیت سفارش
  
  // کامنت: آدرس و بسته
  address?: string | Address; // آدرس ارسال سفارش (اختیاری)
  package?: string | Package; // بسته ارسالی (اختیاری)
  deliveryStatus?: "pending" | "preparing" | "assigned" | "in_transit" | "delivered" | "failed"; // وضعیت ارسال
  
  // کامنت: محاسبات مالی
  discountAmount?: number;    // مقدار تخفیف (به تومان)
  discountCode?: string;      // کد تخفیف استفاده شده
  shippingCost?: number;      // هزینه ارسال
  taxAmount?: number;         // مالیات
  packagingCost?: number;    // هزینه بسته‌بندی
  finalTotal?: number;       // مبلغ نهایی قابل پرداخت
  
  // کامنت: جزئیات ارسال
  sendType?: number;          // نوع ارسال (1: عادی, 2: پیک موتوری, ...)
  sendTime?: number;          // زمان ارسال (1: فوری, 2: عادی, 3: استاندارد)
  sendDate?: number;         // تاریخ ارسال
  isBig?: boolean;            // بسته بزرگ
  
  // کامنت: اتصال به فاکتور
  invoice?: string | Types.ObjectId; // فاکتور مالی (اختیاری)
  
  createdAt: Date;
  updatedAt?: Date; // تاریخ آخرین به‌روزرسانی
}

const orderSchema = new Schema({
  user: { type: Types.ObjectId, required: true, ref: "user" },
  orderList: [
    {
      product: { type: Types.ObjectId, required: true, ref: "product" },
      productwarehouse: { type: Types.ObjectId, required: true, ref: "Productwarehouse" },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalCost: { type: Number, required: true, default: 0 },
  totalPriceProducts: { type: Number, required: true, default: 0 },
  
  // کامنت: شماره فاکتور و وضعیت
  orderNumber: { type: String, unique: true, sparse: true }, // شماره فاکتور
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
    default: "pending"
  }, // وضعیت سفارش
  
  // کامنت: آدرس و بسته
  address: { type: Types.ObjectId, required: false, ref: "address" }, // آدرس ارسال سفارش
  package: { type: Types.ObjectId, required: false, ref: "package" }, // بسته ارسالی
  deliveryStatus: { 
    type: String, 
    enum: ["pending", "preparing", "assigned", "in_transit", "delivered", "failed"],
    default: "pending"
  }, // وضعیت ارسال
  
  // کامنت: محاسبات مالی
  discountAmount: { type: Number, default: 0 }, // مقدار تخفیف
  discountCode: { type: String }, // کد تخفیف استفاده شده
  shippingCost: { type: Number, default: 0 }, // هزینه ارسال
  taxAmount: { type: Number, default: 0 }, // مالیات
  packagingCost: { type: Number, default: 0 }, // هزینه بسته‌بندی
  finalTotal: { type: Number, default: 0 }, // مبلغ نهایی قابل پرداخت
  
  // کامنت: جزئیات ارسال
  sendType: { type: Number }, // نوع ارسال
  sendTime: { type: Number }, // زمان ارسال
  sendDate: { type: Number }, // تاریخ ارسال
  isBig: { type: Boolean, default: false }, // بسته بزرگ
  
  // کامنت: اتصال به فاکتور
  invoice: { type: Types.ObjectId, required: false, ref: "invoice" }, // فاکتور مالی
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const OrderModel = model<Order>("Order", orderSchema);