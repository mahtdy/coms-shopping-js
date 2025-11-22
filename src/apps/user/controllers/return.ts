import BaseController, { ControllerOptions } from "../../../core/mongoose-controller/controller";
import { Response } from "../../../core/controller";
import { Get, Post } from "../../../core/decorators/method";
import { Body, Query, User, Param } from "../../../core/decorators/parameters";
import z from "zod";
import OrderReturnRepository from "../../../repositories/admin/orderReturn/repository";
import OrderReturn from "../../../repositories/admin/orderReturn/model";
import { UserInfo } from "../../../core/mongoose-controller/auth/user/userAuthenticator";
import ReturnService from "../../services/returnService";
import BaseControllerId from "../../../core/mongoose-controller/controller";

/**
 * توضیح فارسی: کنترلر بازگشت کالا برای کاربران
 */
export class ReturnController extends BaseController<OrderReturn> {
  private returnService: ReturnService;

  constructor(baseRoute: string, repo: OrderReturnRepository, options?: ControllerOptions) {
    super(baseRoute, repo, options);
    this.returnService = new ReturnService();
  }

  /**
   * توضیح فارسی: ایجاد درخواست بازگشت کالا
   */
  @Post("/", { loginRequired: true })
  async createReturn(
    @User() user: UserInfo,
    @Body({
      schema: z.object({
        orderId: BaseControllerId.id,
        items: z.array(
          z.object({
            product: BaseControllerId.id,
            productwarehouse: BaseControllerId.id,
            quantity: z.number().int().positive(),
            reason: z.string().min(5),
          })
        ),
        reason: z.string().min(10),
        userNotes: z.string().optional(),
      }),
    })
    data: {
      orderId: string;
      items: Array<{
        product: string;
        productwarehouse: string;
        quantity: number;
        reason: string;
      }>;
      reason: string;
      userNotes?: string;
    }
  ): Promise<Response> {
    try {
      const returnRequest = await this.returnService.createReturnRequest({
        orderId: data.orderId,
        userId: user.id,
        items: data.items,
        reason: data.reason,
        userNotes: data.userNotes,
      });

      return {
        status: 200,
        message: "درخواست بازگشت با موفقیت ثبت شد.",
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
   * توضیح فارسی: دریافت درخواست‌های بازگشت کاربر
   */
  @Get("/", { loginRequired: true })
  async getMyReturns(
    @User() user: UserInfo,
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
      const returns = await this.returnService.getUserReturns(user.id, query);

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
  @Get("/:returnId", { loginRequired: true })
  async getReturn(
    @User() user: UserInfo,
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

      // کامنت: بررسی اینکه درخواست متعلق به کاربر است
      if (returnRequest.user.toString() !== user.id) {
        return {
          status: 403,
          message: "شما مجاز به مشاهده این درخواست نیستید.",
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
}

const returnController = new ReturnController("/return", new OrderReturnRepository(), {});
export default returnController;

