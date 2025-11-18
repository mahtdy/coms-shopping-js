import { Document, model, Schema, Types } from "mongoose";

export interface InventoryHistory extends Document {
    inventory_id: string | Types.ObjectId;
    change_type: "purchase" | "sale" | "transfer" | "adjustment";
    quantity_changed: number;
    batch_number: string;
    reason: string;
    timestamp: Date;
}

const inventoryHistorySchema = new Schema({
    inventory_id: {
        type: Types.ObjectId,
        required: true,
        ref: "inventory",
    },
    change_type: {
        type: String,
        enum: ["purchase", "sale", "transfer", "adjustment"],
        required: true,
    },
    quantity_changed: {
        type: Number,
        required: true,
    },
    batch_number: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export const InventoryHistoryModel = model<InventoryHistory>("inventory_history", inventoryHistorySchema);