"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantyModel = exports.warrantorSchema = void 0;
const mongoose_1 = require("mongoose");
exports.warrantorSchema = new mongoose_1.Schema({
    nameAndFamily: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
    },
    birthCertificateNumber: {
        type: String,
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },
    email: {
        type: String,
        required: false
    },
    emailVirified: {
        type: Boolean,
        required: false
    },
    emailCode: {
        type: Number
    },
    phone: {
        type: String,
        required: true
    },
    phoneVirified: {
        type: Boolean,
        required: false
    },
    phoneCode: {
        type: Number
    },
    address: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "address"
    },
    telephone: {
        type: String,
        required: false
    },
    nationalCode: {
        type: String,
        required: false
    },
    workAddrress: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "address"
    },
    workTelephone: {
        type: String,
        required: false
    },
    jobTitle: {
        type: String,
        required: false
    }
});
const warrantySchema = new mongoose_1.Schema({
    warrantor: {
        type: exports.warrantorSchema,
        required: true
    },
    type: {
        type: String,
        enum: ["deed", "personal"],
        required: false
    },
    attachments: {
        type: Object,
        required: false
    },
    paymentConfig: {
        type: mongoose_1.Types.ObjectId,
        ref: "payment-config",
        required: false
    },
    personalType: {
        type: String,
        enum: ["check", "promissory"],
        required: false
    },
    info: {
        type: Object,
        required: false
    },
    confirmed: {
        type: Boolean,
        required: true,
        default: false
    },
    isReject: {
        type: Boolean,
        required: false
    },
    rejectMessage: {
        type: String,
        required: false
    },
    isOwn: {
        type: Boolean,
        required: true,
        default: false
    },
    deed: {
        type: Object,
        required: false
    },
    deedAddress: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "address"
    },
    amount: {
        type: Number,
        required: false
    },
    isInMortgage: {
        type: Boolean,
        required: false
    },
    homeOffice: {
        type: [Object],
        required: false
    },
});
exports.WarrantyModel = (0, mongoose_1.model)("warranty", warrantySchema);
