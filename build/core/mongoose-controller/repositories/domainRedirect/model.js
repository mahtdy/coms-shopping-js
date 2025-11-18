"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainRedirectModel = void 0;
const mongoose_1 = require("mongoose");
const domainRedirectSchema = new mongoose_1.Schema({
    from: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "domain"
    },
    to: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "domain"
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    }
});
exports.DomainRedirectModel = (0, mongoose_1.model)("domain-redirect", domainRedirectSchema);
