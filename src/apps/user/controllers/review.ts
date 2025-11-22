import BaseController from "../../../core/mongoose-controller/controller";
import { Response } from "../../../core/controller";
import { Get, Post, Put } from "../../../core/decorators/method";
import { Body, Query, User, Param } from "../../../core/decorators/parameters";
import { z } from "zod";
import ReviewService from "../../services/reviewService";
import { UserInfo } from "../../../core/mongoose-controller/auth/user/userAuthenticator";

/**
 * توضیح فارسی: کنترلر نظرات و امتیازدهی محصولات (برای کاربران)
 */
export class ReviewController extends BaseController<any> {
  private reviewService: ReviewService;

  constructor() {
    super("/review", {} as any);
    this.reviewService = new ReviewService();
  }

  /**
   * توضیح فارسی: ثبت نظر جدید
   */
  @Post("/", { loginRequired: true })
  async createReview(
    @User() user: UserInfo,
    @Body({
      schema: z.object({
        productId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().max(200).optional(),
        comment: z.string().max(2000).optional(),
        images: z.array(z.string()).optional(),
        ratings: z
          .object({
            quality: z.number().min(1).max(5).optional(),
            price: z.number().min(1).max(5).optional(),
            delivery: z.number().min(1).max(5).optional(),
            packaging: z.number().min(1).max(5).optional(),
          })
          .optional(),
        orderId: z.string().optional(), // کامنت: برای اعتبارسنجی
      }),
    })
    data: {
      productId: string;
      rating: number;
      title?: string;
      comment?: string;
      images?: string[];
      ratings?: {
        quality?: number;
        price?: number;
        delivery?: number;
        packaging?: number;
      };
      orderId?: string;
    }
  ): Promise<Response> {
    try {
      const result = await this.reviewService.createReview({
        productId: data.productId,
        userId: user.id,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images,
        ratings: data.ratings,
        orderId: data.orderId,
      });

      return {
        status: 200,
        message: "نظر شما با موفقیت ثبت شد و در انتظار تایید است.",
        data: result,
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
   * توضیح فارسی: دریافت نظرات یک محصول
   */
  @Get("/product/:productId")
  async getProductReviews(
    @Param({ destination: "productId", schema: z.string() }) productId: string,
    @Query({
      schema: z.object({
        status: z.enum(["pending", "approved", "rejected"]).default("approved"),
        rating: z.number().min(1).max(5).optional(),
        limit: z.number().default(10),
        skip: z.number().default(0),
        sortBy: z.enum(["newest", "oldest", "rating", "helpful"]).default("newest"),
      }),
    })
    query: {
      status?: "pending" | "approved" | "rejected";
      rating?: number;
      limit?: number;
      skip?: number;
      sortBy?: "newest" | "oldest" | "rating" | "helpful";
    }
  ): Promise<Response> {
    try {
      const reviews = await this.reviewService.getProductReviews(productId, {
        status: query.status || "approved",
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
   * توضیح فارسی: دریافت آمار امتیاز یک محصول
   */
  @Get("/product/:productId/stats")
  async getProductRatingStats(
    @Param({ destination: "productId", schema: z.string() }) productId: string
  ): Promise<Response> {
    try {
      const stats = await this.reviewService.getProductRatingStats(productId);

      return {
        status: 200,
        data: stats,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت آمار امتیاز",
      };
    }
  }

  /**
   * توضیح فارسی: بررسی آیا کاربر می‌تواند نظر بدهد
   */
  @Get("/product/:productId/can-review", { loginRequired: true })
  async canUserReview(
    @Param({ destination: "productId", schema: z.string() }) productId: string,
    @User() user: UserInfo
  ): Promise<Response> {
    try {
      const result = await this.reviewService.canUserReview(productId, user.id);

      return {
        status: 200,
        data: result,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در بررسی امکان نظر دادن",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت نظرات کاربر
   */
  @Get("/my-reviews", { loginRequired: true })
  async getMyReviews(
    @User() user: UserInfo,
    @Query({
      schema: z.object({
        status: z.string().optional(),
        limit: z.number().default(10),
        skip: z.number().default(0),
      }),
    })
    query: { status?: string; limit?: number; skip?: number }
  ): Promise<Response> {
    try {
      const reviews = await this.reviewService.getUserReviews(user.id, {
        status: query.status,
        limit: query.limit,
        skip: query.skip,
      });

      return {
        status: 200,
        data: reviews,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت نظرات شما",
      };
    }
  }

  /**
   * توضیح فارسی: ثبت مفید بودن یا نبودن نظر
   */
  @Put("/:reviewId/helpful", { loginRequired: true })
  async markHelpful(
    @Param({ destination: "reviewId", schema: z.string() }) reviewId: string,
    @Body({
      schema: z.object({
        isHelpful: z.boolean(),
      }),
    })
    data: { isHelpful: boolean }
  ): Promise<Response> {
    try {
      const review = await this.reviewService.markHelpful(reviewId, data.isHelpful);

      return {
        status: 200,
        message: data.isHelpful ? "نظر به عنوان مفید ثبت شد." : "نظر به عنوان غیرمفید ثبت شد.",
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
   * توضیح فارسی: گزارش نظر
   */
  @Post("/:reviewId/report", { loginRequired: true })
  async reportReview(
    @Param({ destination: "reviewId", schema: z.string() }) reviewId: string,
    @User() user: UserInfo
  ): Promise<Response> {
    try {
      const review = await this.reviewService.reportReview(reviewId, user.id);

      return {
        status: 200,
        message: "نظر گزارش شد. تیم ما آن را بررسی خواهد کرد.",
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
}

const review = new ReviewController();
export default review;

