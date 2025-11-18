"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockSchema = void 0;
const mongoose_1 = require("mongoose");
var BlockType;
(function (BlockType) {
    BlockType[BlockType["static"] = 0] = "static";
    BlockType[BlockType["dynamic"] = 1] = "dynamic";
})(BlockType || (BlockType = {}));
exports.blockSchema = {
    name: {
        type: String,
        required: true,
        unique: true
    },
    dataType: {
        type: String,
        enum: BlockType,
        required: true
    },
    tsx: {
        type: String,
        required: true
    },
    css: {
        type: String,
        required: true
    },
    dataMap: {
        type: Object,
        required: true
    },
    childComponents: {
        type: [new mongoose_1.Schema({
                path: {
                    type: String,
                    required: true
                },
                componentType: {
                    type: String,
                    required: true
                }
            }, {
                _id: false
            })],
        required: true,
        default: []
    },
    blockSubType: {
        type: String,
        required: false
    }
    // queries: {
    //     type : [new Schema({
    //         from: {
    //             type: String,
    //             required : false
    //         },
    //         filter : {
    //             type : Object,
    //             required : false
    //         },
    //         fromOwn: {
    //             type : new Schema({
    //                 path: {
    //                     type : String,
    //                     required : true
    //                 },
    //             } , {_id : false})
    //         },
    //         sort : {
    //             type : Object,
    //             required : false
    //         },
    //         limit : {
    //             type : Number,
    //             required : false
    //         } ,
    //         part : {
    //             type: String,
    //             require : false
    //         }
    //     })],
    //     required : false       
    // },
    // dataMapper: {
    // },
};
// const BlockModel = model<Block>("block", blockSchema)
