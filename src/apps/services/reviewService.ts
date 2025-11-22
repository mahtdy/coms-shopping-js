import ProductReviewRepository from "../../repositories/admin/productReview/repository";
import OrderRepository from "../../repositories/admin/order/repository";
import ProductRepository from "../../repositories/admin/product/repository";
import ProductReview from "../../repositories/admin/productReview/model";
import Order from "../../repositories/admin/order/model";

/**
 * توضیح فارسی: گزینه‌های ثبت نظر
 */
export interface CreateReviewOptions {
  productId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  images?: string[];
  ratings?: {
    quality?: number;
    price?: number;
    delivery?: number;
    packaging?: number;
  };
  orderId?: string; // کامنت: برای اعتبارسنجی
}

/**
 * توضیح فارسی: نتیجه ثبت نظر
 */
export interface ReviewResult {
  review: ProductReview;
  productRatingStats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  };
}

/**
 * توضیح فارسی: سرویس مدیریت نظرات و امتیازدهی محصولات
 */
export default class ReviewService {
  private reviewRepo: ProductReviewRepository;
  private orderRepo: OrderRepository;
  private productRepo: ProductRepository;

  constructor() {
    this.reviewRepo = new ProductReviewRepository();
    this.orderRepo = new OrderRepository();
    this.productRepo = new ProductRepository();
  }

  /**
   * توضیح فارسی: ثبت نظر جدید
   */
  async createReview(options: CreateReviewOptions): Promise<ReviewResult> {
    const { productId, userId, rating, title, comment, images, ratings, orderId } = options;

    // کامنت: اعتبارسنجی امتیاز
    if (rating < 1 || rating > 5) {
      throw {
        status: 400,
        message: "امتیاز باید بین 1 تا 5 باشد.",
      };
    }

    // کامنت: بررسی وجود محصول
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw {
        status: 404,
        message: "محصول یافت نشد.",
      };
    }

    // کامنت: بررسی نظر تکراری
    const existingReview = await this.reviewRepo.hasUserReviewed(productId, userId);
    if (existingReview) {
      throw {
        status: 400,
        message: "شما قبلاً برای این محصول نظر داده‌اید.",
      };
    }

    // کامنت: اعتبارسنجی خرید (اگر orderId ارائه شده باشد)
    let isVerified = false;
    if (orderId) {
      const order = await this.orderRepo.findById(orderId);
      if (!order) {
        throw {
          status: 404,
          message: "سفارش یافت نشد.",
        };
      }

      // کامنت: بررسی اینکه سفارش متعلق به کاربر است
      const orderUserId =
        typeof order.user === "string"
          ? order.user
          : (order.user as any)?._id?.toString() || (order.user as any)?.toString();

      if (orderUserId !== userId) {
        throw {
          status: 403,
          message: "این سفارش متعلق به شما نیست.",
        };
      }

      // کامنت: بررسی اینکه محصول در سفارش وجود دارد
      const hasProduct = order.orderList.some((item) => {
        const itemProductId =
          typeof item.product === "string"
            ? item.product
            : (item.product as any)?._id?.toString() || (item.product as any)?.toString();
        return itemProductId === productId;
      });

      if (!hasProduct) {
        throw {
          status: 400,
          message: "این محصول در سفارش شما وجود ندارد.",
        };
      }

      isVerified = true;
    }

    // کامنت: ایجاد نظر
    const review = await this.reviewRepo.create({
      product: productId,
      user: userId,
      order: orderId,
      rating,
      title,
      comment,
      images: images || [],
      ratings,
      status: "pending", // کامنت: نیاز به تایید ادمین
      isVerified,
      helpfulCount: 0,
      notHelpfulCount: 0,
      reportedCount: 0,
      reportedBy: [],
    });

    // کامنت: محاسبه آمار جدید امتیاز محصول
    const productRatingStats = await this.reviewRepo.getProductRatingStats(productId);

    return {
      review,
      productRatingStats,
    };
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
    return this.reviewRepo.getProductReviews(productId, filters);
  }

  /**
   * توضیح فارسی: دریافت آمار امتیاز یک محصول
   */
  async getProductRatingStats(productId: string) {
    return this.reviewRepo.getProductRatingStats(productId);
  }

  /**
   * توضیح فارسی: تایید یا رد نظر (برای ادمین)
   */
  async updateReviewStatus(
    reviewId: string,
    status: "approved" | "rejected",
    adminId: string
  ): Promise<ProductReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw {
        status: 404,
        message: "نظر یافت نشد.",
      };
    }

    const updatedReview = await this.reviewRepo.editById(reviewId, {
      $set: {
        status,
      },
    });

    if (!updatedReview) {
      throw {
        status: 500,
        message: "خطا در به‌روزرسانی وضعیت نظر.",
      };
    }

    return updatedReview;
  }

  /**
   * توضیح فارسی: افزودن پاسخ ادمین به نظر
   */
  async addAdminReply(
    reviewId: string,
    replyText: string,
    adminId: string
  ): Promise<ProductReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw {
        status: 404,
        message: "نظر یافت نشد.",
      };
    }

    const updatedReview = await this.reviewRepo.editById(reviewId, {
      $set: {
        adminReply: {
          text: replyText,
          repliedBy: adminId,
          repliedAt: new Date(),
        },
      },
    });

    if (!updatedReview) {
      throw {
        status: 500,
        message: "خطا در افزودن پاسخ ادمین.",
      };
    }

    return updatedReview;
  }

  /**
   * توضیح فارسی: ثبت مفید بودن یا نبودن نظر
   */
  async markHelpful(reviewId: string, isHelpful: boolean): Promise<ProductReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw {
        status: 404,
        message: "نظر یافت نشد.",
      };
    }

    const updateField = isHelpful ? "helpfulCount" : "notHelpfulCount";
    const updatedReview = await this.reviewRepo.editById(reviewId, {
      $inc: {
        [updateField]: 1,
      },
    });

    if (!updatedReview) {
      throw {
        status: 500,
        message: "خطا در ثبت مفید بودن نظر.",
      };
    }

    return updatedReview;
  }

  /**
   * توضیح فارسی: گزارش نظر
   */
  async reportReview(reviewId: string, userId: string): Promise<ProductReview> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw {
        status: 404,
        message: "نظر یافت نشد.",
      };
    }

    // کامنت: بررسی اینکه کاربر قبلاً گزارش نداده است
    const reportedBy = review.reportedBy || [];
    if (reportedBy.includes(userId as any)) {
      throw {
        status: 400,
        message: "شما قبلاً این نظر را گزارش داده‌اید.",
      };
    }

    const updatedReview = await this.reviewRepo.editById(reviewId, {
      $inc: {
        reportedCount: 1,
      },
      $push: {
        reportedBy: userId,
      },
    });

    if (!updatedReview) {
      throw {
        status: 500,
        message: "خطا در گزارش نظر.",
      };
    }

    return updatedReview;
  }

  /**
   * توضیح فارسی: دریافت نظرات یک کاربر
   */
  async getUserReviews(userId: string, filters?: { status?: string; limit?: number; skip?: number }) {
    return this.reviewRepo.getUserReviews(userId, filters);
  }

  /**
   * توضیح فارسی: بررسی آیا کاربر می‌تواند برای محصول نظر بدهد
   */
  async canUserReview(productId: string, userId: string): Promise<{
    canReview: boolean;
    reason?: string;
    hasPurchased?: boolean;
    hasReviewed?: boolean;
  }> {
    // کامنت: بررسی نظر قبلی
    const hasReviewed = await this.reviewRepo.hasUserReviewed(productId, userId);
    if (hasReviewed) {
      return {
        canReview: false,
        reason: "شما قبلاً برای این محصول نظر داده‌اید.",
        hasReviewed: true,
      };
    }

    // کامنت: بررسی خرید
    const orders = await this.orderRepo.find({
      user: userId,
      orderStatus: "completed", // کامنت: فقط سفارش‌های تکمیل شده
    });

    let hasPurchased = false;
    for (const order of orders) {
      const hasProduct = order.orderList.some((item) => {
        const itemProductId =
          typeof item.product === "string"
            ? item.product
            : (item.product as any)?._id?.toString() || (item.product as any)?.toString();
        return itemProductId === productId;
      });

      if (hasProduct) {
        hasPurchased = true;
        break;
      }
    }

    if (!hasPurchased) {
      return {
        canReview: false,
        reason: "شما باید این محصول را خریداری کرده باشید تا بتوانید نظر بدهید.",
        hasPurchased: false,
      };
    }

    return {
      canReview: true,
      hasPurchased: true,
      hasReviewed: false,
    };
  }

  /**
   * توضیح فارسی: دریافت محصولات برتر بر اساس امتیاز
   */
  async getTopRatedProducts(limit: number = 10): Promise<Array<{
    productId: string;
    productName: string;
    averageRating: number;
    totalReviews: number;
  }>> {
    const stats = await this.reviewRepo.collection.aggregate([
      {
        $match: {
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $sort: { averageRating: -1, totalReviews: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    // کامنت: دریافت اطلاعات محصولات
    const products = await Promise.all(
      stats.map(async (stat) => {
        const product = await this.productRepo.findById(stat._id.toString());
        return {
          productId: stat._id.toString(),
          productName: product?.title || "Unknown",
          averageRating: Math.round((stat.averageRating || 0) * 10) / 10,
          totalReviews: stat.totalReviews,
        };
      })
    );

    return products;
  }

  /**
   * توضیح فارسی: دریافت محصولات با بیشترین نظرات
   */
  async getMostReviewedProducts(limit: number = 10): Promise<Array<{
    productId: string;
    productName: string;
    averageRating: number;
    totalReviews: number;
  }>> {
    const stats = await this.reviewRepo.collection.aggregate([
      {
        $match: {
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $sort: { totalReviews: -1, averageRating: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    // کامنت: دریافت اطلاعات محصولات
    const products = await Promise.all(
      stats.map(async (stat) => {
        const product = await this.productRepo.findById(stat._id.toString());
        return {
          productId: stat._id.toString(),
          productName: product?.title || "Unknown",
          averageRating: Math.round((stat.averageRating || 0) * 10) / 10,
          totalReviews: stat.totalReviews,
        };
      })
    );

    return products;
  }

  /**
   * توضیح فارسی: دریافت آمار کلی نظرات
   */
  async getOverallReviewStats(): Promise<{
    totalReviews: number;
    approvedReviews: number;
    pendingReviews: number;
    rejectedReviews: number;
    averageRating: number;
    totalProductsWithReviews: number;
  }> {
    const stats = await this.reviewRepo.collection.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const statusCounts: { [key: string]: number } = {
      approved: 0,
      pending: 0,
      rejected: 0,
    };
    let totalRating = 0;
    let totalCount = 0;

    for (const stat of stats) {
      statusCounts[stat._id] = stat.count;
      if (stat._id === "approved") {
        totalRating += (stat.avgRating || 0) * stat.count;
        totalCount += stat.count;
      }
    }

    const totalReviews = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const averageRating = totalCount > 0 ? totalRating / totalCount : 0;

    // کامنت: تعداد محصولات با نظرات
    const productsWithReviews = await this.reviewRepo.collection.distinct("product", {
      status: "approved",
    });

    return {
      totalReviews,
      approvedReviews: statusCounts.approved,
      pendingReviews: statusCounts.pending,
      rejectedReviews: statusCounts.rejected,
      averageRating: Math.round(averageRating * 10) / 10,
      totalProductsWithReviews: productsWithReviews.length,
    };
  }
}

