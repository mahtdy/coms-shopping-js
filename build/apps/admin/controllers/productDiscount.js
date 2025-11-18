"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDiscountController = void 0;
const repository_1 = __importDefault(require("../../../repositories/productDiscount/repository"));
class ProductDiscountController {
    // ایجاد تخفیف جدید
    // async create(req: Request, res: Response) {
    //     try {
    //         const data = req.body;
    //         const discount = await ProductDiscountRepository.create(data);
    //         return res.status(201).json({
    //             success: true,
    //             message: "تخفیف با موفقیت ایجاد شد",
    //             data: discount,
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "خطا در ایجاد تخفیف",
    //             // error: error.message,
    //         });
    //     }
    // }
    // دریافت لیست تخفیف‌ها
    async list(req, res) {
        try {
            const { limit, page, sort } = req.query;
            const discounts = await repository_1.default.findAll({}, {
                limit: Number(limit) || 20,
                page: Number(page) || 1,
                sort: sort ? JSON.parse(sort) : { created_at: -1 },
            });
            return res.status(200).json({
                success: true,
                data: discounts,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "خطا در دریافت لیست تخفیف‌ها",
                // error: error.message,
            });
        }
    }
}
exports.ProductDiscountController = ProductDiscountController;
