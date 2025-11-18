"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/basePage/repository"));
const model_1 = require("./model");
class BrandRepository extends repository_1.default {
    constructor(options) {
        super({
            model: model_1.BrandModel,
            typeName: "brand",
            contentFunc: async function (url, category, language) {
                return "/brand" + url;
            },
            selectData: {
                type: 1,
                title: 1,
                mainImage: 1,
                author: 1,
                category: 1,
                publishDate: 1,
                insertDate: 1,
            },
            sort: {
            // publishDate: {
            //   show: "زمان انتشار",
            // },
            // insertDate: {
            //   show: "زمان انتشار",
            // },
            // view: {
            //   show: "بازدید",
            // },
            },
        });
    }
}
exports.default = BrandRepository;
