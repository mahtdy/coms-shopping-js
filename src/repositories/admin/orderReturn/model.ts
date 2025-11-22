import { Schema, model, Document, Types } from "mongoose";
import Order from "../order/model";
import BaseUser from "../../../core/mongoose-controller/repositories/user/model";

/**
 * توضیح فارسی: مدل درخواست بازگشت کالا
 */
export default interface OrderReturn extends Document {
  order: string | Order; // سفارش مربوطه
  user: string | BaseUser; // کاربر درخواست‌دهنده
  items: {
    product: string; // محصول
    productwarehouse: string; // موجودی انبار
    quantity: number; // تعداد بازگشتی
    price: number; // قیمت واحد
    reason: string; // دلیل بازگشت
  }[];
  reason: string; // دلیل کلی بازگشت
  status: "pending" | "approved" | "rejected" | "processing" | "completed" | "cancelled"; // وضعیت درخواست
  refundAmount: number; // مبلغ بازگشت وجه
  refundStatus: "pending" | "processing" | "completed" | "failed"; // وضعیت بازگشت وجه
  adminNotes?: string; // یادداشت‌های ادمین
  userNotes?: string; // یادداشت‌های کاربر
  approvedBy?: string; // ادمین تاییدکننده
  approvedAt?: Date; // تاریخ تایید
  rejectedAt?: Date; // تاریخ رد
  completedAt?: Date; // تاریخ تکمیل
  createdAt: Date;
  updatedAt: Date;
}

const orderReturnSchema = new Schema<OrderReturn>(
  {
    order: { type: Schema.Types.ObjectId, required: true, ref: "Order" },
    user: { type: Schema.Types.ObjectId, required: true, ref: "user" },
    items: [
      {
        product: { type: Schema.Types.ObjectId, required: true, ref: "product" },
        productwarehouse: { type: Schema.Types.ObjectId, required: true, ref: "Productwarehouse" },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        reason: { type: String, required: true },
      },
    ],
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "completed", "cancelled"],
      default: "pending",
    },
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    adminNotes: { type: String },
    userNotes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "admin" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const OrderReturnModel = model<OrderReturn>("orderReturn", orderReturnSchema);

