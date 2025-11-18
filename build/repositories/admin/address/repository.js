"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import BaseRepositoryService from "../../../core/mongoose-controller/repository";
// import Address, {AddressModel} from "./model";
// import CacheService from "../../core/cache";
const model_1 = require("../../../repositories/admin/address/model");
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
// interface AddressOptions<T> {
//     cache?: CacheService,
//     model: Model<T>
// }
class AddressRepository extends repository_1.default {
    constructor(options) {
        super(model_1.AddressModel, options);
    }
}
exports.default = AddressRepository;
