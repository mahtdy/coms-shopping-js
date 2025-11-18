"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChestModel = void 0;
const mongoose_1 = require("mongoose");
const chestSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => new Date(),
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
    inventry: {
        type: Number,
        required: true,
        default: 0
    },
    isTankhah: {
        type: Boolean,
        required: true,
        default: false
    }
});
exports.ChestModel = (0, mongoose_1.model)("chest", chestSchema);
