"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankAccountModel = void 0;
const mongoose_1 = require("mongoose");
const bankAccountSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    isReal: {
        type: Boolean,
        required: true,
        default: true
    },
    isOfficial: {
        type: Boolean,
        required: true,
        default: true
    },
    shaba: {
        type: String,
        unique: true,
        required: true
    },
    card: {
        type: String,
        unique: true,
        required: true
    },
    number: {
        type: String,
        unique: true,
        required: true
    },
    type: {
        type: String,
        enum: ["sell", "buy", "wallet"],
        required: true,
        default: "sell"
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => Date.now()
    },
    bank: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    },
    canDelete: {
        type: Boolean,
        required: true,
        default: true
    },
    owner: {
        type: String,
        required: true
    },
    inventory: {
        type: Number,
        required: true,
        default: 0
    },
    isTankhah: {
        type: Boolean,
        required: true,
        default: false
    },
    address: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "address"
    },
    deinPossible: {
        type: Boolean,
        required: true,
    },
    maxDein: {
        type: Number,
        required: false,
    },
    deinDrodown: {
        type: Number,
        required: false
    },
    deinExprie: {
        type: Date,
        required: false
    }
});
exports.BankAccountModel = (0, mongoose_1.model)("bank-account", bankAccountSchema);
