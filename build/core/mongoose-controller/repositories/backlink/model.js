"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackLinkModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const backLinkSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true
    },
    pageAuthority: {
        type: Number,
        required: false
    },
    domainAuthority: {
        type: Number,
        required: false
    },
    spamScore: {
        type: Number,
        required: false
    },
    inboundLinks: {
        type: [String],
        required: false
    },
    links: {
        type: [
            new mongoose_1.Schema({
                url: {
                    type: String,
                    required: true
                },
                text: {
                    type: String,
                    required: true
                },
            })
        ],
        required: true
    },
});
exports.BackLinkModel = (0, mongoose_1.model)('backLink', backLinkSchema);
