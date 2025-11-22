import BaseController, { ControllerOptions } from "../../../core/mongoose-controller/controller";
import { Response } from "../../../core/controller";
import { Get, Post, Put } from "../../../core/decorators/method";
import { Body, Query, Admin, Param } from "../../../core/decorators/parameters";
import z from "zod";
import OrderReturnRepository from "../../../repositories/admin/orderReturn/repository";
import OrderReturn from "../../../repositories/admin/orderReturn/model";
import { AdminInfo } from "../../../core/mongoose-controller/auth/admin/admin-logIn";
import ReturnService from "../../services/returnService";
import BaseControllerId from "../../../core/mongoose-controller/controller";

/**
 * توضیح فارسی: کنترلر بازگشت کالا برای ادمین
 */
export class AdminReturnController extends BaseController<OrderReturn> {
  private returnService: ReturnService;

  constructor(baseRoute: string, repo: OrderReturnRepository, options?: ControllerOptions) {
    super(baseRoute, repo, options);
    this.returnService = new ReturnService();
  }

  /**
   * توضیح فارسی: دریافت همه درخواست‌های بازگشت
   */
  @Get("/")
  async getAllReturns(
    @Query({
      schema: z.object({
        status: z.enum(["pending", "approved", "rejected", "processing", "completed", "cancelled"]).optional(),
        limit: z.number().int().positive().optional(),
        skip: z.number().int().nonnegative().optional(),
      }),
    })
    query: { status?: string; limit?: number; skip?: number }
  ): Promise<Response> {
    try {
      const returns = query.status
        ? await this.returnService.returnRepo.getReturnsByStatus(
            query.status as OrderReturn["status"],
            query.limit,
            query.skip
          )
        : await this.repository.find({}, { limit: query.limit, skip: query.skip, sort: { createdAt: -1 } });

      return {
        status: 200,
        data: returns,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت درخواست‌های بازگشت",
      };
    }
  }

  /**
   * توضیح فارسی: دریافت جزئیات یک درخواست بازگشت
   */
  @Get("/:returnId")
  async getReturn(
    @Param({ destination: "returnId", schema: z.string() }) returnId: string
  ): Promise<Response> {
    try {
      const returnRequest = await this.returnService.getReturn(returnId);

      if (!returnRequest) {
        return {
          status: 404,
          message: "درخواست بازگشت یافت نشد.",
        };
      }

      return {
        status: 200,
        data: returnRequest,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: error.message || "خطا در دریافت درخواست بازگشت",
      };
    }
  }

  /**
   * توضیح فارسی: تایید درخواست بازگشت
   */
  @Put("/:returnId/approve")
  async approveReturn(
    @Admin() admin: AdminInfo,
    @Param({ destination: "returnId", schema: z.string() }) returnId: string,
    @Body({
      schema: z.object({
        adminNotes: z.string().optional(),
      }),
    })
    data: { adminNotes?: string }
  ): Promise<Response> {
    try {
      const returnRequest = await this.returnService.approveReturn(returnId, admin.id, data.adminNotes);

      return {
        status: 200,
        message: "درخواست بازگشت تایید شد.",
        data: returnRequest,
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
   * توضیح فارسی: رد درخواست بازگشت
   */
  @Put("/:returnId/reject")
  async rejectReturn(
    @Admin() admin: AdminInfo,
    @Param({ destination: "returnId", schema: z.string() }) returnId: string,
    @Body({
      schema: z.object({
        adminNotes: z.string().min(10),
      }),
    })
    data: { adminNotes: string }
  ): Promise<Response> {
    try {
      const returnRequest = await this.returnService.rejectReturn(returnId, admin.id, data.adminNotes);

      return {
        status: 200,
        message: "درخواست بازگشت رد شد.",
        data: returnRequest,
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
   * توضیح فارسی: پردازش بازگشت وجه
   */
  @Put("/:returnId/process-refund")
  async processRefund(
    @Param({ destination: "returnId", schema: z.string() }) returnId: string
  ): Promise<Response> {
    try {
      const returnRequest = await this.returnService.processRefund(returnId);

      return {
        status: 200,
        message: "بازگشت وجه با موفقیت پردازش شد.",
        data: returnRequest,
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

const adminReturn = new AdminReturnController("/admin/return", new OrderReturnRepository(), {});
export default adminReturn;

