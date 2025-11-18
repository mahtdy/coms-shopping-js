import { Schema, model, Document } from "mongoose";

interface Position extends Document {
    x: number,
    y: number
}


export interface WaterMarkConfig {
    name?: string,
    ismain: boolean,
    type: string,
    gravity?: string,
    imageAddress?: string
    text?: string,
    textAlign?: string,
    lineSpacing?: number,
    wordSpacing?: number,
    transparency?: number,
    position_x?: number,
    position_y?: number,
    x?: number,
    y?: number,
    fontSize?: number,
    fontColor?: string,
    fontName?: string,
    waterMarkSizeType: string,
    waterMarkSize?: number,
    underline?: boolean,
    bold?: boolean,
    italic?: boolean,
    shadowOffsetX?: number,
    shadowOffsetY?: number,
    shadowBlur?: number,
    shadowColor?: string,
    strokeWidths?: number,
    strokeColor?: string,
    angle?: number,
    tile?: number,
    diagonalLines?: boolean,
    diagonalLinesColor?: string,
    backgroundColor?: string,
}

export default interface WaterMark extends Document {
    lable: string,
    lastUpdate : Date,
    configs: WaterMarkConfig[],
    resultAngle?: number,
    resultQuality?: number,
    resultSize?: number,
    resultDpi?: number
    resultTypes?: ("png" | "jpg" | "webp")[],
    flipVertical: boolean,
    flipHorizontal: boolean,
    borderLeft?: number,
    borderRight?: number,
    borderTop?: number,
    borderBotton?: number,
    borderColor?: string,
    contrast?: number,
    brightness?: number,
    grayscale: boolean,
    sepia: boolean,
    filter?: string,
    
    demoImg : string,
    demoImgSmall : string,
}

export enum waterMarkType {
    image = "image",
    text = "text",
    none = "none"
}

export enum gravityDirection {
    'NorthWest',
    'North',
    'NorthEast',
    'West',
    'Center',
    'East',
    'SouthWest',
    'South',
    'SouthEast'
}

export enum waterMarkSizeType {
    "fixed",
    "relative"
}

const PositionSchema = new Schema({
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    }
})

const WaterMarkSchema = new Schema({
    lable: {
        type: String,
        required: true
    },
    lastUpdate : {
        type : Date,
        required : true,
        default : () => new Date()
    },
    configs: {
        type: [
            new Schema({
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
                            return true
                        }
                    }
                },
                textAlign: {
                    type: String,
                    required: false
                },

                lineSpacing: {
                    type: Number,
                    required : false
                },
                wordSpacing :{
                    type: Number,
                    required : false
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
                        return 0
                    }
                },
                position_y: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0
                    }
                },

                x: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0
                    }
                },
                y: {
                    type: Number,
                    required: true,
                    default: () => {
                        return 0
                    }
                },
                fontSize: {
                    type: Number,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true
                        }
                    }
                },
                fontColor: {
                    type: String,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true
                        }
                    }
                },
                fontName: {
                    type: String,
                    required: function () {
                        if (this.gravity == waterMarkType.text) {
                            return true
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
                    validate: function (value: number) {
                        if (this.waterMarkSizeType == waterMarkSizeType.relative) {
                            if (value > 100 || value < 0) {
                                throw new Error("ابعاد نامعتبر");
                            }

                        } else {
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
            } , {
                _id : false
            })]
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
    },
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

    demoImg : {
        type: String,
        required: false
    },
    demoImgSmall : {
        type : String,
        required: false
    },
});



export const WaterMarkModel = model<WaterMark>('waterMark', WaterMarkSchema)