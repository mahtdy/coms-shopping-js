import { ProductDiscount } from "./model";
import {date} from "zod";

export default {
    // async create(data) {
    //     return await ProductDiscount.create(data);
    // },

    async findById(id: any) {
        return await ProductDiscount.findById(id);
    },

    async findAll(filter = {}, { limit = 20, page = 1, sort = { created_at: -1 } } = {}) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            ProductDiscount.find(filter).sort(sort as any).skip(skip).limit(limit),
            ProductDiscount.countDocuments(filter),
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
        return ProductDiscount.find({
            active: true,
            start_date: {$lte: date},
            end_date: {$gte: date},
        }).sort({priority: 1});
    },
};
