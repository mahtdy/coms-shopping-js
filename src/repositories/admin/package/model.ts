import { Schema, model, Document, Types } from "mongoose";
import Courier from "../courier/model";
import Order from "../order/model";

export default interface Package extends Document {
    order: Types.ObjectId | Order; // کامنت: اتصال به سفارش
    recipientName: string;
    recipientPhone: string;
    destination: { lat: number; lng: number; address: string };
    status: "pending" | "assigned" | "in_transit" | "delivered" | "failed";
    courier?: Types.ObjectId | Courier;
    trackingCode?: string; // کامنت: کد رهگیری
    assignedAt?: Date; // کامنت: تاریخ تخصیص به پیک
    deliveredAt?: Date; // کامنت: تاریخ تحویل
    notes?: string; // کامنت: یادداشت‌های اضافی
}

const packageSchema = new Schema<Package>(
    {
        order: { type: Schema.Types.ObjectId, required: true, ref: "Order" }, // کامنت: اتصال به سفارش
        recipientName: { type: String, required: true },
        recipientPhone: { type: String, required: true },
        destination: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            address: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ["pending", "assigned", "in_transit", "delivered", "failed"],
            default: "pending",
        },
        courier: { type: Schema.Types.ObjectId, ref: "Courier" },
        trackingCode: { type: String, unique: true, sparse: true }, // کامنت: کد رهگیری (unique اما optional)
        assignedAt: { type: Date }, // کامنت: تاریخ تخصیص به پیک
        deliveredAt: { type: Date }, // کامنت: تاریخ تحویل
        notes: { type: String }, // کامنت: یادداشت‌های اضافی
    },
    { timestamps: true }
);

// export default PackageModel = model<Package>("Package", packageSchema);
// export default PackageModel;
export const PackageModel = model<Package>("package", packageSchema);
