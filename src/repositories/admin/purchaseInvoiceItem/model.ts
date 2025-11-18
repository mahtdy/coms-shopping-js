import { Document, model, Schema, Types } from "mongoose";

export interface PurchaseInvoiceItem extends Document {
    purchase_invoice_id: string | Types.ObjectId;
    variant_id: string | Types.ObjectId;
    quantity: number;
    unit_purchase_price: number;
    batch_number: string;
}

const purchaseInvoiceItemSchema = new Schema({
    purchase_invoice_id: {
        type: Types.ObjectId,
        required: true,
        ref: "purchase_invoice",
    },
    variant_id: {
        type: Types.ObjectId,
        required: true,
        ref: "product_variant",
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unit_purchase_price: {
        type: Number,
        required: true,
    },
    batch_number: {
        type: String,
        required: true,
    },
});

export const PurchaseInvoiceItemModel = model<PurchaseInvoiceItem>("purchase_invoice_item", purchaseInvoiceItemSchema);