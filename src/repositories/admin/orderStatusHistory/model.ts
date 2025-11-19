import { Schema, model, Document, Types } from "mongoose";
import Order from "../order/model";

/**
 * توضیح فارسی: مدل تاریخچه تغییرات وضعیت سفارش
 */
export default interface OrderStatusHistory extends Document {
  order: string | Order; // کامنت: اتصال به سفارش
  oldStatus?: "pending" | "confirmed" | "processing" | "completed" | "cancelled"; // وضعیت قبلی
  newStatus: "pending" | "confirmed" | "processing" | "completed" | "cancelled"; // وضعیت جدید
  changedBy?: string; // کامنت: کسی که تغییر را ایجاد کرده (admin یا system)
  reason?: string; // کامنت: دلیل تغییر وضعیت
  notes?: string; // کامنت: یادداشت‌های اضافی
  timestamp: Date; // کامنت: زمان تغییر
}

const orderStatusHistorySchema = new Schema({
  order: {
    type: Types.ObjectId,
    required: true,
    ref: "Order",
  },
  oldStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
  },
  newStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
    required: true,
  },
  changedBy: {
    type: Types.ObjectId,
    ref: "admin", // کامنت: می‌تواند admin یا system باشد
  },
  reason: {
    type: String,
  },
  notes: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// کامنت: Index برای جستجوی سریع
orderStatusHistorySchema.index({ order: 1, timestamp: -1 });
orderStatusHistorySchema.index({ newStatus: 1, timestamp: -1 });

export const OrderStatusHistoryModel = model<OrderStatusHistory>(
  "OrderStatusHistory",
  orderStatusHistorySchema
);

