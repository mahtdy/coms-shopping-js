import { Document, Schema, Types, model } from "mongoose";
import { BasePage, basePageSchema } from "../../../core/mongoose-controller/basePage/model";

export default interface Courier extends BasePage {
    name: string;
    phone: string;
    vehicle: string; // e.g. "motorbike"
    capacity: {
        count: number;
        weightKg?: number;
    };
    shift: {
        start: string; // "08:00"
        end: string;   // "18:00"
    };
    currentLocation?: {
        type: "Point";
        coordinates: [number, number]; // [lon, lat]
        updatedAt?: Date;
    };
    status: "available" | "on_trip" | "break" | "offline";
    meta?: any;
}

const pschema = { ...basePageSchema };

const schema = Object.assign(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        vehicle: { type: String, default: "motorbike" },
        capacity: {
            count: { type: Number, default: 60 },
            weightKg: { type: Number, default: 100 },
        },
        shift: {
            start: { type: String, default: "08:00" },
            end: { type: String, default: "18:00" },
        },
        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [lon, lat]
                default: [0, 0],
            },
            updatedAt: Date,
        },
        status: {
            type: String,
            enum: ["available", "on_trip", "break", "offline"],
            default: "available",
        },
        meta: { type: Schema.Types.Mixed },
    },
    pschema
);

const courierSchema = new Schema(schema);

// create 2dsphere index for geo queries
courierSchema.index({ "currentLocation": "2dsphere" });

export const CourierModel = model<Courier>("courier", courierSchema);
