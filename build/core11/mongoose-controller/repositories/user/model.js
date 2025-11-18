"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseUserZod = exports.userSchema = void 0;
const mongoose_1 = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const zod_1 = require("zod");
const controller_1 = __importDefault(require("../../controller"));
exports.userSchema = {
    name: {
        type: String,
        required: true
    },
    family: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
        unique: true
    },
    profile: {
        type: String,
        required: false
    },
    isEmailRegistered: {
        type: Boolean,
        required: true,
        default: false
    },
    newEmail: {
        type: String,
        validate: function (value) {
            // if (!Email.validateEmail(value)) {
            //     throw new Error("ایمیل وارد شده نامعتبر است");
            // }
            return true;
        }
    },
    emailHash: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: function (value) {
            // if (!PhoneNumber.validateNumber(value)) {
            //     throw new Error("شماره تلفن وارد شده نامعتبر است");
            // }
            return true;
        },
        unique: true
    },
    nationalCode: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    passwordLastChange: {
        type: Date,
        required: true,
        default: () => {
            return new Date(Date.now());
        }
    },
    changePassword: {
        type: Boolean,
        required: true,
        default: true
    },
    passwords: {
        type: [String],
        requierd: true,
        default: []
    },
    towFactorLogIn: {
        type: Boolean,
        required: true,
        default: false
    },
    towFactorTocken: {
        type: String,
        required: false
    },
    userCategory: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: "6108d532e681165bcd45812e",
        ref: "customerCategory"
    },
    notificationTokens: {
        type: [new mongoose_1.Schema({
                domain: mongoose_1.Types.ObjectId,
                type: {
                    type: String,
                    default: "web-push"
                },
                config: Object
            })],
        required: false
    },
    wallet: {
        type: Number,
        required: true,
        default: 0
    }
};
exports.baseUserZod = zod_1.z.object({
    name: zod_1.z.string(),
    family: zod_1.z.string(),
    email: zod_1.z.string(),
    isEmailRegistered: zod_1.z.boolean().optional(),
    // newEmail: z.string(),
    // emailHash?: z.string(),
    phoneNumber: zod_1.z.string(),
    password: zod_1.z.string(),
    towFactorLogIn: zod_1.z.boolean().optional(),
    // towFactorTocken?: string,
    userCategory: controller_1.default.id.optional(),
    passwordLastChange: zod_1.z.coerce.date().default(() => new Date()),
    // passwords: string[],
    // notificationTokens?: string | string[],
}).omit({
    passwordLastChange: true
});
// const userSchema = new Schema()
// userSchema.plugin(uniqueValidator, { message: "{PATH} is unique" })
// export const UserModel = model<BaseUser>("user", userSchema)
