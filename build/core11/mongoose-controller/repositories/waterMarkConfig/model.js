"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterMarkModel = exports.waterMarkSizeType = exports.gravityDirection = exports.waterMarkType = void 0;
const mongoose_1 = require("mongoose");
var waterMarkType;
(function (waterMarkType) {
    waterMarkType["image"] = "image";
    waterMarkType["text"] = "text";
    waterMarkType["none"] = "none";
})(waterMarkType || (exports.waterMarkType = waterMarkType = {}));
var gravityDirection;
(function (gravityDirection) {
    gravityDirection[gravityDirection["NorthWest"] = 0] = "NorthWest";
    gravityDirection[gravityDirection["North"] = 1] = "North";
    gravityDirection[gravityDirection["NorthEast"] = 2] = "NorthEast";
    gravityDirection[gravityDirection["West"] = 3] = "West";
    gravityDirection[gravityDirection["Center"] = 4] = "Center";
    gravityDirection[gravityDirection["East"] = 5] = "East";
    gravityDirection[gravityDirection["SouthWest"] = 6] = "SouthWest";
    gravityDirection[gravityDirection["South"] = 7] = "South";
    gravityDirection[gravityDirection["SouthEast"] = 8] = "SouthEast";
})(gravityDirection || (exports.gravityDirection = gravityDirection = {}));
var waterMarkSizeType;
(function (waterMarkSizeType) {
    waterMarkSizeType[waterMarkSizeType["fixed"] = 0] = "fixed";
    waterMarkSizeType[waterMarkSizeType["relative"] = 1] = "relative";
})(waterMarkSizeType || (exports.waterMarkSizeType = waterMarkSizeType = {}));
const PositionSchema = new mongoose_1.Schema({
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    }
});
const WaterMarkSchema = new mongoose_1.Schema({
    lable: {
        type: String,
        required: true
    },
    configs: {
        type: [
            new mongoose_1.Schema({
                name: {
                    type: String,
                    required: false
                },
                ismain: {
                    type: Boolean,
                    required: true,
                    default: true
                },
                type: {
                    type: String,
                    required: true,
                    enum: waterMarkType,
                    default: waterMarkType.none
                },
                text: {
                    type: String,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true;
                        }
                    }
                },
                textAlign: {
                    type: String,
                    required: false
                },
                lineSpacing: {
                    type: Number,
                    required: false
                },
                wordSpacing: {
                    type: Number,
                    required: false
                },
                imageAddress: {
                    type: String,
                    required: false
                },
                gravity: {
                    type: String,
                    required: true,
                    enum: gravityDirection
                },
                transparency: {
                    type: String,
                    required: false,
                    min: 0,
                    max: 100
                },
                position_x: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0;
                    }
                },
                position_y: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0;
                    }
                },
                x: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0;
                    }
                },
                y: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0;
                    }
                },
                fontSize: {
                    type: Number,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true;
                        }
                    }
                },
                fontColor: {
                    type: String,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true;
                        }
                    }
                },
                fontName: {
                    type: String,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true;
                        }
                    }
                },
                waterMarkSizeType: {
                    type: String,
                    required: true,
                    enum: waterMarkSizeType
                },
                waterMarkSize: {
                    type: Number,
                    required: false,
                    validate: function (value) {
                        if (this.waterMarkSizeType == waterMarkSizeType.relative) {
                            if (value > 100 || value < 0) {
                                throw new Error("ابعاد نامعتبر");
                            }
                        }
                        else {
                            if (value < 0) {
                                throw new Error("ابعاد نامعتبر");
                            }
                        }
                    }
                },
                underline: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                bold: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                italic: {
                    type: Boolean,
                    required: true,
                    default: false
                },
                shadowOffsetX: {
                    type: Number,
                    required: false,
                },
                shadowOffsetY: {
                    type: Number,
                    required: false,
                },
                shadowBlur: {
                    type: Number,
                    required: false,
                },
                shadowColor: {
                    type: String,
                    required: false
                },
                strokeWidths: {
                    type: Number,
                    required: false,
                },
                strokeColor: {
                    type: String,
                    required: false
                },
                angle: {
                    type: Number,
                    required: false
                },
                tile: {
                    type: Number,
                    required: false
                },
                diagonalLines: {
                    type: Boolean,
                    required: false,
                    default: false
                },
                diagonalLinesColor: {
                    type: String,
                    required: false
                },
                backgroundColor: {
                    type: String,
                    required: false
                }
            })
        ]
    },
    resultAngle: {
        type: Number,
        required: false
    },
    resultQuality: {
        type: Number,
        required: true,
        default: 80
    },
    resultTypes: {
        type: [String],
        required: true,
        enum: ["png", "jpg", "webp"],
        default: ["webp"]
    },
    resultSize: {
        type: Number,
        required: false
    },
    flipHorizontal: {
        type: Boolean,
        required: true,
        default: false
    },
    flipVertical: {
        type: Boolean,
        required: true,
        default: false
    },
    borderLeft: {
        type: Number,
        required: false
    },
    borderRight: {
        type: Number,
        required: false
    },
    borderTop: {
        type: Number,
        required: false
    },
    borderBotton: {
        type: Number,
        required: false
    },
    borderColor: {
        type: String,
        required: false
    },
    contrast: {
        type: Number,
        required: false
    },
    brightness: {
        type: Number,
        required: false
    },
    grayscale: {
        type: Boolean,
        required: true,
        default: false
    },
    sepia: {
        type: Boolean,
        required: true,
        default: false
    },
    filter: {
        type: String,
        required: false
    }
    // waterMarkPercent: {
    //     type: Number,
    //     required: function () {
    //         if (this.waterMarkSizeType == waterMarkSizeType.relative) {
    //             return true
    //         }
    //     },
    //     min: 0,
    //     max: 100
    // },
});
exports.WaterMarkModel = (0, mongoose_1.model)('waterMark', WaterMarkSchema);
