"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressModel = void 0;
const mongoose_1 = require("mongoose");
const addressSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "user"
    },
    addressList: {
        type: [
            new mongoose_1.Schema({
                title: {
                    type: String,
                    required: true
                },
                receiver: {
                    name: {
                        type: String,
                        required: true
                    },
                    family: {
                        type: String,
                        required: true
                    },
                    phoneNumber: {
                        type: String,
                        required: true
                    }
                },
                country: {
                    type: String,
                    required: true
                },
                province: {
                    type: String,
                    required: true
                },
                city: {
                    type: String,
                    required: true
                },
                district: {
                    type: String,
                    required: true
                },
                street: {
                    type: String,
                    required: true
                },
                details: {
                    type: String,
                    required: true
                },
                postalCode: {
                    type: String,
                    required: true
                },
                location: {
                    lat: {
                        type: Number,
                        required: false
                    },
                    lng: {
                        type: Number,
                        required: false
                    }
                },
                isDefault: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                createdAt: {
                    type: Date,
                    required: true,
                    default: () => new Date()
                },
                updatedAt: {
                    type: Date,
                    required: true,
                    default: () => new Date()
                }
            }),
        ],
    },
});
exports.AddressModel = (0, mongoose_1.model)("address", addressSchema);
// اسکیما Zod برای اعتبارسنجی
// export const addressZod = z.object({
//     title: z.string(),
//     receiver: z.object({
//         name: z.string(),
//         family: z.string(),
//         phoneNumber: z.string()
//     }),
//     country: z.string(),
//     province: z.string(),
//     city: z.string(),
//     district: z.string(),
//     street: z.string(),
//     details: z.string(),
//     postalCode: z.string(),
//     location: z.object({
//         lat: z.number(),
//         lng: z.number()
//     }).optional(),
//     isDefault: z.boolean().optional()
// });
