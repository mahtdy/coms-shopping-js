import { Document, model, Schema, Types } from "mongoose";

export interface SaleInvoiceItem extends Document {
    sale_invoice_id: string | Types.ObjectId;
    variant_id: string | Types.ObjectId;
    quantity: number;
    unit_sale_price: number;
    batch_number: string;
}

const saleInvoiceItemSchema = new Schema({
    sale_invoice_id: {
        type: Types.ObjectId,
        required: true,
        ref: "sale_invoice",
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
    unit_sale_price: {
        type: Number,
        required: true,
    },
    batch_number: {
        type: String,
        required: true,
    },
});

export const SaleInvoiceItemModel = model<SaleInvoiceItem>("saleInvoiceItem", saleInvoiceItemSchema);