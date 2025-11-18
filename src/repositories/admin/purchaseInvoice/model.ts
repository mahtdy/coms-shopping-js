import { Document, model, Schema, Types } from "mongoose";

export interface PurchaseInvoice extends Document {
    warehouse_id: string | Types.ObjectId;
    supplier_id: string | Types.ObjectId;
    invoice_date: Date;
    total_amount: number;
    status: "pending" | "confirmed" | "canceled";
    created_at: Date;
    updated_at: Date;
}

const purchaseInvoiceSchema = new Schema({
    warehouse_id: {
        type: Types.ObjectId,
        required: true,
        ref: "warehouse",
    },
    supplier_id: {
        type: Types.ObjectId,
        required: true,
        ref: "supplier",
    },
    invoice_date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    total_amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "canceled"],
        default: "pending",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

export const PurchaseInvoiceModel = model<PurchaseInvoice>("purchase_invoice", purchaseInvoiceSchema);