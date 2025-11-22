import { Schema, model, Document, Types } from "mongoose";
import Product from "../product/model";
import Order from "../order/model";
import BaseUser from "../../../core/mongoose-controller/repositories/user/model";

/**
 * توضیح فارسی: مدل نظرات و امتیاز محصولات
 */
export default interface ProductReview extends Document {
  product: string | Product; // کامنت: محصول
  user: string | BaseUser; // کامنت: کاربر
  order?: string | Order; // کامنت: سفارش (برای اعتبارسنجی)
  
  // کامنت: امتیازدهی (1 تا 5 ستاره)
  rating: number; // 1-5
  
  // کامنت: نظرات
  title?: string; // کامنت: عنوان نظر
  comment?: string; // کامنت: متن نظر
  images?: string[]; // کامنت: تصاویر ضمیمه شده
  
  // کامنت: امتیازهای جزئی (اختیاری)
  ratings?: {
    quality?: number; // کیفیت محصول (1-5)
    price?: number; // قیمت (1-5)
    delivery?: number; // ارسال (1-5)
    packaging?: number; // بسته‌بندی (1-5)
  };
  
  // کامنت: وضعیت
  status: "pending" | "approved" | "rejected"; // کامنت: وضعیت تایید
  isVerified: boolean; // کامنت: آیا خریدار تایید شده است
  
  // کامنت: مفید بودن
  helpfulCount: number; // کامنت: تعداد افرادی که مفید دانستند
  notHelpfulCount: number; // کامنت: تعداد افرادی که مفید ندانستند
  
  // کامنت: پاسخ ادمین
  adminReply?: {
    text: string;
    repliedBy: string; // شناسه ادمین
    repliedAt: Date;
  };
  
  // کامنت: گزارش‌ها
  reportedCount: number; // کامنت: تعداد گزارش‌ها
  reportedBy?: string[]; // کامنت: شناسه کاربرانی که گزارش داده‌اند
  
  // کامنت: زمان
  createdAt: Date;
  updatedAt: Date;
}

const productReviewSchema = new Schema(
  {
    product: {
      type: Types.ObjectId,
      required: true,
      ref: "product",
      index: true, // کامنت: Index برای جستجوی سریع
    },
    user: {
      type: Types.ObjectId,
      required: true,
      ref: "user",
      index: true,
    },
    order: {
      type: Types.ObjectId,
      required: false,
      ref: "Order",
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
    },
    comment: {
      type: String,
      maxlength: 2000,
    },
    images: {
      type: [String],
      default: [],
    },
    ratings: {
      quality: { type: Number, min: 1, max: 5 },
      price: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      packaging: { type: Number, min: 1, max: 5 },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // کامنت: اگر order وجود داشته باشد، true می‌شود
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
    },
    adminReply: {
      text: { type: String },
      repliedBy: { type: Types.ObjectId, ref: "admin" },
      repliedAt: { type: Date },
    },
    reportedCount: {
      type: Number,
      default: 0,
    },
    reportedBy: {
      type: [Types.ObjectId],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // کامنت: به‌روزرسانی خودکار updatedAt
  }
);

// کامنت: Index ترکیبی برای جلوگیری از نظر تکراری
productReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// کامنت: Index برای جستجوی سریع
productReviewSchema.index({ product: 1, status: 1, rating: 1 });
productReviewSchema.index({ user: 1, status: 1 });

export const ProductReviewModel = model<ProductReview>("ProductReview", productReviewSchema);

