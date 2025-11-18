import { Document, model, Schema, Types } from "mongoose";

export default interface ProductVariant extends Document {
    product: Types.ObjectId;
    sku: string;
    features: { featureId?: Types.ObjectId; name: string; value: string; priceAdjustment?: number }[];
    basePrice?: number;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const productVariantSchema = new Schema({
    product: { type: Types.ObjectId, required: true, ref: "product" },
    sku: { type: String, required: true, unique: true },
    features: [
        {
            featureId: { type: Types.ObjectId, ref: "categoryFeature", required: false },
            name: { type: String, required: true },
            value: { type: String, required: true },
            priceAdjustment: { type: Number, required: false, default: 0 },
        },
    ],
    basePrice: { type: Number, required: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });

export const ProductVariantModel = model<ProductVariant>("productVariant", productVariantSchema);
