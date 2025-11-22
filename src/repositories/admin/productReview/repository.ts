import BaseRepositoryService from "../../../core/mongoose-controller/repository";
import { RepositoryConfigOptions } from "../../../core/mongoose-controller/repository";
import ProductReview, { ProductReviewModel } from "./model";

export default class ProductReviewRepository extends BaseRepositoryService<ProductReview> {
  constructor(options?: RepositoryConfigOptions) {
    super(ProductReviewModel, options);
  }

  /**
   * توضیح فارسی: دریافت نظرات یک محصول
   */
  async getProductReviews(
    productId: string,
    filters?: {
      status?: "pending" | "approved" | "rejected";
      rating?: number;
      limit?: number;
      skip?: number;
      sortBy?: "newest" | "oldest" | "rating" | "helpful";
    }
  ) {
    const query: any = { product: productId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.rating) {
      query.rating = filters.rating;
    }

    const sort: any = {};
    if (filters?.sortBy === "newest") {
      sort.createdAt = -1;
    } else if (filters?.sortBy === "oldest") {
      sort.createdAt = 1;
    } else if (filters?.sortBy === "rating") {
      sort.rating = -1;
    } else if (filters?.sortBy === "helpful") {
      sort.helpfulCount = -1;
    } else {
      sort.createdAt = -1; // کامنت: پیش‌فرض: جدیدترین
    }

    const options: any = { sort };
    if (filters?.limit) {
      options.limit = filters.limit;
    }
    if (filters?.skip) {
      options.skip = filters.skip;
    }

    return this.find(query, options);
  }

  /**
   * توضیح فارسی: دریافت آمار امتیاز یک محصول
   */
  async getProductRatingStats(productId: string) {
    const stats = await this.collection.aggregate([
      {
        $match: {
          product: new (this.model as any).db.base.Types.ObjectId(productId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    const stat = stats[0];
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const rating of stat.ratingDistribution) {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    }

    return {
      averageRating: Math.round((stat.averageRating || 0) * 10) / 10, // گرد کردن به 1 رقم اعشار
      totalReviews: stat.totalReviews,
      ratingDistribution,
    };
  }

  /**
   * توضیح فارسی: بررسی آیا کاربر قبلاً برای این محصول نظر داده است
   */
  async hasUserReviewed(productId: string, userId: string): Promise<boolean> {
    const review = await this.findOne({
      product: productId,
      user: userId,
    });
    return !!review;
  }

  /**
   * توضیح فارسی: دریافت نظرات یک کاربر
   */
  async getUserReviews(userId: string, filters?: { status?: string; limit?: number; skip?: number }) {
    const query: any = { user: userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    const options: any = { sort: { createdAt: -1 } };
    if (filters?.limit) {
      options.limit = filters.limit;
    }
    if (filters?.skip) {
      options.skip = filters.skip;
    }

    return this.find(query, options);
  }
}

