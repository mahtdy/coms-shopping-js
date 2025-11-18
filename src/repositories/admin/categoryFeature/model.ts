import { Document, model, Schema, Types } from "mongoose";

export default interface CategoryFeature extends Document {
    category: Types.ObjectId;
    name: string; // مثال: "size" یا "color"
    type: "select" | "text" | "number";
    values?: { value: string; priceAdjustment?: number }[]; // اگر select باشه
    affectsPrice: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const categoryFeatureSchema = new Schema({
    category: { type: Types.ObjectId, required: true, ref: "category" },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ["select", "text", "number", "boolean"] },
    values: [
        {
            value: { type: String, required: true },
            priceAdjustment: { type: Number, required: false, default: 0 },
        },
    ],
    affectsPrice: { type: Boolean, default: false },
}, { timestamps: true });

export const CategoryFeatureModel = model<CategoryFeature>(
    "categoryFeature",
    categoryFeatureSchema
);
