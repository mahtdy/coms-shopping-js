"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repository_1 = __importDefault(require("../../../core/mongoose-controller/repository"));
const model_1 = require("../../../repositories/admin/order/model");
const user_1 = __importDefault(require("../../../apps/admin/controllers/user"));
class OrderRepository extends repository_1.default {
    constructor(options) {
        super(model_1.OrderModel, options);
    }
    // }
    // src/repositories/admin/order/repository.ts
    // export default class OrderRepository {
    async insert(data) {
        const order = new model_1.OrderModel(data);
        return await order.save();
    }
    async findAll() {
        return await model_1.OrderModel.find().exec();
    }
    async findByUser(userId) {
        return await model_1.OrderModel.find({ user: user_1.default }).exec();
    }
    async findById(id) {
        return await model_1.OrderModel.findById(id).exec();
    }
    async update(id, data) {
        return await model_1.OrderModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }
}
exports.default = OrderRepository;
