import { Request, Response } from "express";
import ProductDiscountRepository from "../../../repositories/admin/productDiscount/repository";

export class ProductDiscountController {
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
    async list(req: Request, res: Response) {
        try {
            const { limit, page, sort } = req.query;
            const discounts = await ProductDiscountRepository.findAll(
                {},
                {
                    limit: Number(limit) || 20,
                    page: Number(page) || 1,
                    sort: sort ? JSON.parse(sort as string) : { created_at: -1 },
                }
            );

            return res.status(200).json({
                success: true,
                data: discounts,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "خطا در دریافت لیست تخفیف‌ها",
                // error: error.message,
            });
        }
    }



    // ویرایش تخفیف
    // async update(req: Request, res: Response) {
    //     try {
    //         const { id } = req.params;
    //         const data = req.body;
    //         const discount = await ProductDiscountRepository.update(id, data);
    //         return res.status(200).json({
    //             success: true,
    //             message: "تخفیف با موفقیت ویرایش شد",
    //             data: discount,
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "خطا در ویرایش تخفیف",
    //             // error: error.message,
    //         });
    //     }
    // }

    // حذف تخفیف
    // async remove(req: Request, res: Response) {
    //     try {
    //         const { id } = req.params;
    //         await ProductDiscountRepository.remove(id);
    //         return res.status(200).json({
    //             success: true,
    //             message: "تخفیف با موفقیت حذف شد",
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: "خطا در حذف تخفیف",
    //             // error: error.message,
    //         });
    //     }
    // }
}
