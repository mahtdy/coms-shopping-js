"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryMakerModel = void 0;
const mongoose_1 = require("mongoose");
const queryMakerSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    repoName: {
        type: String,
        required: true
    },
    preset: {
        type: Boolean,
        required: true,
        default: false
    },
    limit: {
        type: Number,
        required: true
    },
    query: {
        type: [Object],
        required: true,
        default: []
    },
    exact: {
        type: Object,
        required: false
    },
    fromOwn: {
        type: [Object],
        required: false
    },
    sort: {
        type: new mongoose_1.Schema({
            key: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true,
                enum: ["-1", "1"]
            }
        }, {
            _id: false
        }),
        required: false
    },
});
exports.QueryMakerModel = (0, mongoose_1.model)("query", queryMakerSchema);
