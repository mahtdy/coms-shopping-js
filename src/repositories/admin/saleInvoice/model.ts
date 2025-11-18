import { Document, model, Schema, Types } from "mongoose";

export interface SaleInvoice extends Document {
    warehouse_id: string | Types.ObjectId;
    buyer_id: string | Types.ObjectId;
    order_id: string | Types.ObjectId;
    invoice_date: Date;
    total_amount: number;
    status: "pending" | "confirmed" | "canceled";
    created_at: Date;
    updated_at: Date;
}

const saleInvoiceSchema = new Schema({
    warehouse_id: {
        type: Types.ObjectId,
        required: true,
        ref: "warehouse",
    },
    buyer_id: {
        type: Types.ObjectId,
        required: true,
        ref: "user",
    },
    order_id: {
        type: Types.ObjectId,
        required: true,
        ref: "order",
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

export const SaleInvoiceModel = model<SaleInvoice>("saleInvoice", saleInvoiceSchema);