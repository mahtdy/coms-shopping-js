import { Document, model, Schema, Types } from "mongoose";

export default interface CategoryFeature extends Document {
    category: Types.ObjectId;
    name: string; // مثال: "size" یا "color"
    type: "select" | "text" | "number";
    values?: { value: string; priceAdjustment?: number }[]; // اگر select باشه، لیست مقدارها و مقدار تغییر قیمت دلخواه برای هر مقدار
    affectsPrice: boolean; // آیا این ویژگی روی قیمت اثر میگذارد؟
}

const categoryFeatureSchema = new Schema({
    category: { type: Types.ObjectId, required: true, ref: "category" },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ["select", "text", "number"] },
    values: [
        {
            value: { type: String, required: true },
            priceAdjustment: { type: Number, required: false, default: 0 } // می‌تواند مثبت یا منفی باشد
        }
    ],
    affectsPrice: { type: Boolean, default: false },
});

export const CategoryFeatureModel = model<CategoryFeature>(
    "categoryFeature",
    categoryFeatureSchema
);
