import { Schema, model } from "mongoose";

const productDiscountSchema = new Schema({
    title: { type: String, required: true }, // عنوان تخفیف
    description: { type: String }, // توضیح کوتاه برای ادمین یا نمایش در سایت
    type: {
        type: String,
        enum: ["percent", "amount"],
        default: "percent",
    },
    value: { type: Number, required: true }, // مقدار درصد یا مبلغ
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    active: { type: Boolean, default: true },

    // ناحیه اعمال تخفیف
    apply_to: {
        type: String,
        enum: ["product", "category", "brand", "variant"],
        required: true,
    },

    // شناسه مرجع بسته به نوع
    product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    brand_id: { type: Schema.Types.ObjectId, ref: "Brand" },
    variant_id: { type: Schema.Types.ObjectId, ref: "ProductVariant" },

    // اولویت: هرچه عدد کوچکتر باشد، مهم‌تر است
    priority: { type: Number, default: 10 },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

productDiscountSchema.index({ apply_to: 1, product_id: 1, category_id: 1 });

export const ProductDiscount = model("ProductDiscount", productDiscountSchema);
