"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../repository"));
const model_1 = require("./model");
class ActionRepository extends repository_1.default {
    constructor(options) {
        super(model_1.ActionModel, options);
    }
    async getSorted() {
        return this.collection.aggregate([
            {
                $group: {
                    _id: "$partName",
                    persianName: {
                        $first: "$partPersion"
                    },
                    sub: {
                        $addToSet: {
                            subPartName: "$subPartName",
                            subPartPersion: "$subPartPersion"
                        }
                    }
                }
            }
        ]).exec();
        // var parts= await this.distinct("partName")
        // for (let i = 0; i < parts.length; i++) {
        //     var subParts 
        // }
    }
}
exports.default = ActionRepository;
