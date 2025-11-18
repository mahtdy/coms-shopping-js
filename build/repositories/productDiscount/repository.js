"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
exports.default = {
    // async create(data) {
    //     return await ProductDiscount.create(data);
    // },
    async findById(id) {
        return await model_1.ProductDiscount.findById(id);
    },
    async findAll(filter = {}, { limit = 20, page = 1, sort = { created_at: -1 } } = {}) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            model_1.ProductDiscount.find(filter).sort(sort).skip(skip).limit(limit),
            model_1.ProductDiscount.countDocuments(filter),
        ]);
        return {
            items,
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    },
    // async update(id, data) {
    //     return await ProductDiscount.findByIdAndUpdate(id, data, { new: true });
    // },
    // async remove(id) {
    //     return await ProductDiscount.findByIdAndDelete(id);
    // },
    async getActiveDiscounts(date = new Date()) {
        return model_1.ProductDiscount.find({
            active: true,
            start_date: { $lte: date },
            end_date: { $gte: date },
        }).sort({ priority: 1 });
    },
};
