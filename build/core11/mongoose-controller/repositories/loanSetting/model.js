"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanSettingModel = void 0;
const mongoose_1 = require("mongoose");
const loanSettingSchema = new mongoose_1.Schema({
    from: {
        type: Number,
        required: true
    },
    to: {
        type: Number,
        required: true
    },
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
        })
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
        })
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    }
});
exports.LoanSettingModel = (0, mongoose_1.model)("loan-setting", loanSettingSchema);
