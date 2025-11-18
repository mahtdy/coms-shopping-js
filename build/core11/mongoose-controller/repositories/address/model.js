"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressModel = exports.addressSchema = void 0;
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const controller_1 = __importDefault(require("../../controller"));
exports.addressSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    state: zod_1.z.string(),
    city: zod_1.z.string(),
    cityPart: zod_1.z.string().optional(),
    street: zod_1.z.string().optional(),
    address: zod_1.z.string(),
    plaque: zod_1.z.string(),
    _id: controller_1.default.id.optional(),
    unit: zod_1.z.number().optional(),
    type: zod_1.z.string().optional(),
    title: zod_1.z.string().optional()
});
const addressMongooseSchema = new mongoose_1.Schema({
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    cityPart: {
        type: String,
        required: false
    },
    street: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    plaque: {
        type: String,
        required: true
    },
    unit: {
        type: Number,
        required: false
    },
    type: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: false
    }
});
exports.AddressModel = (0, mongoose_1.model)("address", addressMongooseSchema);
