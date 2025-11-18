import { Request, Response } from "express";
import ProductDiscountRepository from "../../../repositories/admin/productDiscount/repository";

export class UserProductDiscountController {
    // دریافت تخفیف‌های فعال برای کاربران
    async active(req: Request, res: Response) {
        try {
            const activeDiscounts = await ProductDiscountRepository.getActiveDiscounts();
            return res.status(200).json({
                success: true,
                data: activeDiscounts,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "خطا در دریافت تخفیف‌های فعال",
                // error: error.message,
            });
        }
    }

    // دریافت تخفیف مربوط به محصول خاص (مثلاً هنگام نمایش جزئیات محصول)
    async byProduct(req: Request, res: Response) {
        try {
            const { product_id } = req.params;
            const activeDiscounts = await ProductDiscountRepository.getActiveDiscounts();
            const discount = activeDiscounts.find(
                (d) =>
                    (d.apply_to === "product" && String(d.product_id) === product_id) ||
                    d.apply_to === "category" ||
                    d.apply_to === "brand"
            );

            return res.status(200).json({
                success: true,
                data: discount || null,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "خطا در دریافت تخفیف محصول",
                // error: error.message,
            });
        }
    }
}
