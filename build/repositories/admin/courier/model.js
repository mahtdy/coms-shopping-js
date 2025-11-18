"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourierModel = void 0;
const mongoose_1 = require("mongoose");
const model_1 = require("../../../core/mongoose-controller/basePage/model");
const pschema = { ...model_1.basePageSchema };
const schema = Object.assign({
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
    meta: { type: mongoose_1.Schema.Types.Mixed },
}, pschema);
const courierSchema = new mongoose_1.Schema(schema);
// create 2dsphere index for geo queries
courierSchema.index({ "currentLocation": "2dsphere" });
exports.CourierModel = (0, mongoose_1.model)("courier", courierSchema);
