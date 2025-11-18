import { Document, model, Schema, Types } from "mongoose";

export interface WarehouseTransfer extends Document {
    from_warehouse_id: string | Types.ObjectId;
    to_warehouse_id: string | Types.ObjectId;
    variant_id: string | Types.ObjectId;
    quantity: number;
    batch_number: string;
    transfer_date: Date;
    status: "pending" | "confirmed" | "canceled";
}

const warehouseTransferSchema = new Schema({
    from_warehouse_id: {
        type: Types.ObjectId,
        required: true,
        ref: "warehouse",
    },
    to_warehouse_id: {
        type: Types.ObjectId,
        required: true,
        ref: "warehouse",
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
    batch_number: {
        type: String,
        required: true,
    },
    transfer_date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "canceled"],
        default: "pending",
    },
});

export const WarehouseTransferModel = model<WarehouseTransfer>("warehouse_transfer", warehouseTransferSchema);