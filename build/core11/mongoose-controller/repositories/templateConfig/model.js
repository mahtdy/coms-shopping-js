"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateConfigModel = void 0;
const mongoose_1 = require("mongoose");
const templateConfigSchema = new mongoose_1.Schema({
    template: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "template"
    },
    language: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "language"
    },
    type: {
        type: String,
        required: true,
        enum: ["general", "gallery", "video", "podcast", "category_faq", "increamental"]
    },
    imageConfig: {
        type: [new mongoose_1.Schema({
                name: {
                    type: String,
                    required: true
                },
                resolotion: new mongoose_1.Schema({
                    h: {
                        type: Number,
                        required: true,
                    },
                    w: {
                        type: Number,
                        required: true
                    }
                }, {
                    _id: false
                }),
                compersionConfig: {
                    type: Object,
                    required: false
                }
            }, {
                _id: false
            })],
        required: true,
        default: []
    }
});
exports.TemplateConfigModel = (0, mongoose_1.model)("templateConfig", templateConfigSchema);
