import { Schema, Document, model, Types } from "mongoose";
import {BasePage} from "../../../core/mongoose-controller/basePage/model";
// import  Product  from "../../../repositories/admin/product/model";
// import  Productwarehouse  from "../../../repositories/admin/brand/model";

export interface DiscountCodeSettings {
    charCount: number;          // تعداد کاراکترها
    randomDigitCount: number;   // تعداد اعداد رندوم
    prefix: string;             // کاراکتر اختصاصی اول
    type: "letters" | "numbers" | "fixed"; // حروف، اعداد یا کلمه ثابت
    fixedValue?: string;        // در صورت ثابت بودن
}

export interface DiscountFilter {
    userFilter?: {
        allUsers?: boolean;
        gender?: "male" | "female";
        ageRange?: { from: number; to: number };
    };
    productFilter?: {
        allProducts?: boolean;
        category?: string[];
        brand?: string[];
    };
}


export default interface Discount extends BasePage {
    disTitle: string;
    disType: "general" | "special";
    applyOnInvoice: boolean;
    autoApplyOnInvoice: boolean;

    // اعمال روی محصولات / دسته / برند
    applyOnProducts?: string[];
    applyOnCategories?: string[];
    applyOnBrands?: string[];

    // مناسبتی / جشنواره / رویداد
    eventType?: "sale" | "festival" | "specialDay";
    eventName?: string;
    eventStart?: Date;
    eventEnd?: Date;
    autoApplyOnEvent?: boolean;

    // === جدید ===
    variantFilter?: {
        featureKey: string;  // مثل "color" یا "size"
        featureValues?: string[]; // فقط این مقادیر
    }[];

    disStart: Date;
    disEnd: Date;
    firstInvoiceOnly: boolean;
    amountRange: { from: number; to: number };
    disValue: {
        type: "fixed" | "random" | "percent";
        fixedAmount?: number;
        randomRange?: { from: number; to: number };
    };
    maxProfitLimit: boolean;
    usageCount: number;
    useInSpecialProducts: boolean;
    generateCode: boolean;
    codeSettings?: DiscountCodeSettings;
    disCode?: string;
    filters: DiscountFilter;
    isActive: boolean;
    createdAt: Date;
}



const discountSchema = new Schema({
    // user: { type: Types.ObjectId, ref: "user", required: false },
    disTitle: { type: String, required: true },
    disType: { type: String, enum: ["general", "special"], required: true },
    applyOnInvoice: { type: Boolean, required: true, default: false },
    autoApplyOnInvoice: { type: Boolean, required: true, default: false },
    disStart: { type: Date, required: true, default: () => new Date() },
    disEnd: { type: Date, required: true, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    firstInvoiceOnly: { type: Boolean, required: true, default: false },
    amountRange: {
        from: { type: Number, required: true },
        to: { type: Number, required: true },
    },
    disValue: {
        type: { type: String, enum: ["fixed", "random", "percent"], required: true },
        fixedAmount: { type: Number },
        randomRange: { from: { type: Number }, to: { type: Number } },
    },
    maxProfitLimit: { type: Boolean, required: true, default: true },
    usageCount: { type: Number, required: true, default: 1 },
    useInSpecialProducts: { type: Boolean, required: true, default: false },
    generateCode: { type: Boolean, required: true, default: true },
    codeSettings: {
        charCount: { type: Number },
        randomDigitCount: { type: Number },
        prefix: { type: String },
        type: { type: String, enum: ["letters", "numbers", "fixed"] },
        fixedValue: { type: String },
    },
    disCode: { type: String, unique: true },
    filters: {
        userFilter: {
            allUsers: { type: Boolean },
            gender: { type: String, enum: ["male", "female"] },
            ageRange: { from: { type: Number }, to: { type: Number } },
        },
        productFilter: {
            allProducts: { type: Boolean },
            category: [{ type: String }],
            brand: [{ type: String }],
        },
    },
    isActive: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, default: Date.now },
});

export const DiscountModel = model<Discount>("Discount", discountSchema);