"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loanTemplateModel = void 0;
const mongoose_1 = require("mongoose");
const WarrantySchema = new mongoose_1.Schema({
    deed: {
        type: new mongoose_1.Schema({
            min: {
                type: Number,
                required: true
            },
            enabled: {
                type: Boolean,
                required: true,
                default: false
            }
        }, { _id: false })
    },
    personal: {
        type: new mongoose_1.Schema({
            min: {
                type: Number,
                required: true
            },
            guarantorsCount: {
                type: Number,
                required: true
            }
        }, { _id: false })
    }
}, { _id: false });
const PeriodeSchema = new mongoose_1.Schema({
    months: {
        type: Number,
        required: true
    },
    bankFees: {
        type: Number,
        required: false
    },
    supplierName: {
        type: String,
        required: false
    },
    supplierIcon: {
        type: String,
        required: false
    },
    warranty: {
        type: WarrantySchema,
        required: true
    },
    formula: {
        type: String,
        required: true,
        enum: ["banking", "market"]
    },
    interestRate: {
        type: Number,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    }
});
const loanTemplateSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    periodes: {
        type: [PeriodeSchema],
        required: true
    },
    dueDate: {
        type: Date,
        required: false
    }
});
exports.loanTemplateModel = (0, mongoose_1.model)("loan-template", loanTemplateSchema);
