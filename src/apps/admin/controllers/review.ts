import BaseController from "../../../core/mongoose-controller/controller";
import { Response } from "../../../core/controller";
import { Get, Put, Post } from "../../../core/decorators/method";
import { Body, Query, Admin, Param } from "../../../core/decorators/parameters";
import { z } from "zod";
import ReviewService from "../../services/reviewService";
import { AdminInfo } from "../../../core/mongoose-controller/auth/admin/admin-logIn";

/**
 * توضیح فارسی: کنترلر نظرات و امتیازدهی محصولات (برای ادمین)
 */
export class AdminReviewController extends BaseController<any> {
  private reviewService: ReviewService;

  constructor() {
    super("/admin/review", {} as any);
    this.reviewService = new ReviewService();
  }

  /**
   * توضیح فارسی: دریافت همه نظرات (با فیلتر)
   */
  @Get("/")
  async getAllReviews(
    @Query({
      schema: z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        productId: z.string().optional(),
        userId: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        limit: z.number().default(20),
        skip: z.number().default(0),
        sortBy: z.enum(["newest", "oldest", "rating", "helpful"]).default("newest"),
      }),
    })
    query: {
      status?: "pending" | "approved" | "rejected";
      productId?: string;
      userId?: string;
      rating?: number;
      limit?: number;
      skip?: number;
      sortBy?: "newest" | "oldest" | "rating" | "helpful";
    }
  ): Promise<Response> {
    try {
      // کامنت: استفاده از متد getAllReviews در repository
      const reviews = await this.reviewService.getAllReviews({
        productId: query.productId,
        userId: query.userId,
        status: query.status,
        rating: query.rating,
        limit: query.limit,
        skip: query.skip,
        sortBy: query.sortBy,
      });

      return {
        status: 200,
        data: reviews,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت نظرات",
      };
    }
  }

  /**
   * توضیح فارسی: تایید یا رد نظر
   */
  @Put("/:reviewId/status")
  async updateReviewStatus(
    @Param({ destination: "reviewId", schema: z.string() }) reviewId: string,
    @Admin() admin: AdminInfo,
    @Body({
      schema: z.object({
        status: z.enum(["approved", "rejected"]),
      }),
    })
    data: { status: "approved" | "rejected" }
  ): Promise<Response> {
    try {
      const review = await this.reviewService.updateReviewStatus(reviewId, data.status, admin.id);

      return {
        status: 200,
        message: `نظر با موفقیت ${data.status === "approved" ? "تایید" : "رد"} شد.`,
        data: review,
      };
    } catch (error: any) {
      if (error?.status) {
        return {
          status: error.status,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * توضیح فارسی: افزودن پاسخ ادمین به نظر
   */
  @Post("/:reviewId/reply")
  async addAdminReply(
    @Param({ destination: "reviewId", schema: z.string() }) reviewId: string,
    @Admin() admin: AdminInfo,
    @Body({
      schema: z.object({
        text: z.string().min(1).max(1000),
      }),
    })
    data: { text: string }
  ): Promise<Response> {
    try {
      const review = await this.reviewService.addAdminReply(reviewId, data.text, admin.id);

      return {
        status: 200,
        message: "پاسخ با موفقیت افزوده شد.",
        data: review,
      };
    } catch (error: any) {
      if (error?.status) {
        return {
          status: error.status,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * توضیح فارسی: دریافت نظرات در انتظار تایید
   */
  @Get("/pending")
  async getPendingReviews(
    @Query({
      schema: z.object({
        limit: z.number().default(20),
        skip: z.number().default(0),
      }),
    })
    query: { limit?: number; skip?: number }
  ): Promise<Response> {
    try {
      // کامنت: استفاده از متد getAllReviews
      const reviews = await this.reviewService.getAllReviews({
        status: "pending",
        limit: query.limit,
        skip: query.skip,
        sortBy: "newest",
      });

      return {
        status: 200,
        data: reviews,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت نظرات در انتظار تایید",
      };
    }
  }
}

const adminReview = new AdminReviewController();
export default adminReview;

