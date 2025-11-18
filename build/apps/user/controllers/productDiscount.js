"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProductDiscountController = void 0;
const repository_1 = __importDefault(require("../../../repositories/productDiscount/repository"));
class UserProductDiscountController {
    // دریافت تخفیف‌های فعال برای کاربران
    async active(req, res) {
        try {
            const activeDiscounts = await repository_1.default.getActiveDiscounts();
            return res.status(200).json({
                success: true,
                data: activeDiscounts,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "خطا در دریافت تخفیف‌های فعال",
                // error: error.message,
            });
        }
    }
    // دریافت تخفیف مربوط به محصول خاص (مثلاً هنگام نمایش جزئیات محصول)
    async byProduct(req, res) {
        try {
            const { product_id } = req.params;
            const activeDiscounts = await repository_1.default.getActiveDiscounts();
            const discount = activeDiscounts.find((d) => (d.apply_to === "product" && String(d.product_id) === product_id) ||
                d.apply_to === "category" ||
                d.apply_to === "brand");
            return res.status(200).json({
                success: true,
                data: discount || null,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: "خطا در دریافت تخفیف محصول",
                // error: error.message,
            });
        }
    }
}
exports.UserProductDiscountController = UserProductDiscountController;
