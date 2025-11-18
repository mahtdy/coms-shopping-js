"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const repository_1 = __importDefault(require("../../../repositories/admin/order/repository"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const zod_1 = __importDefault(require("zod"));
const repository_2 = __importDefault(require("../../../repositories/admin/product/repository"));
const repository_3 = __importDefault(require("../../../repositories/admin/productWarehouse/repository"));
const method_1 = require("../../../core/decorators/method");
// import { set, Types } from "mongoose";
// import { QueryInfo } from "../../../core/mongoose-controller/repository";
const parameters_1 = require("../../../core/decorators/parameters");
class OrderController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.orderRepo = new repository_1.default();
        this.proRepo = new repository_2.default();
        this.prowareRepo = new repository_3.default();
    }
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi2K3Ys9mGIiwiZmFtaWx5Ijoi2YXYrdmF2K_bjCIsImlkIjoiNjRiOTJiZDliYTI5YWFjZTMxMjliM2RlIiwicGhvbmVOdW1iZXIiOiIwOTM1ODcwMzUzNCIsImVtYWlsIjoiaC5tb2hhbW1hZGkuMjQ3N0BnbWFpbC5jb20iLCJpYXQiOjE3MjY2NDU3ODl9.IMnS_9ACJlV86lu1CI1z39-cd86wWRZ4oI0wmAWE3Jo
    // @PreExec({
    //   method: "delete",
    //   route: "",
    // })
    // async checkBeforeDelete(): Promise<Response> {
    //   console.log("checkBeforeDelete");
    //   return {
    //     // status: 200,
    //     next: true,
    //   };
    // }
    initApis() {
        super.initApis();
    }
    // checkout
    async orderCheckout(user, id) {
        // try {
        var userbasket = await this.repository.findOne({
            user: user.id,
        });
        if (userbasket == null) {
            return { status: 404, message: "ID basket not found" };
        }
        var userbasket = await this.repository.findOne({
            user: user.id,
        });
        console.log("id", id);
        console.log("userbasket", userbasket);
        console.log("user", user);
        return { status: 200, message: "Not enough stock" };
    }
    //
    // // quantity-increase
    // @Post("/increase")
    // async quantityIncrease(
    //   @User() user: UserInfo,
    //   @Body({
    //     destination: "productwarehouse",
    //     schema: BaseController.id,
    //   })
    //   productwarehouse: string
    //   // @Body({
    //   //   destination: "hash",
    //   //   schema: z.string(),
    //   // })
    //   // hash: string
    // ): Promise<Response> {
    //   try {
    //     var userorder = await this.repository.findOne({
    //       user: user.id as string,
    //     });
    //     if (userorder == null) {
    //       return { status: 404, message: "ID order not found" };
    //     }
    //     const bsktList = userorder?.orderList.find((orderItem: any) => {
    //       return orderItem.productwarehouse.equals(productwarehouse);
    //     });
    //     if (!bsktList) {
    //       return { status: 400, message: "Product in order not found" };
    //     }
    //     let productwarehouseCheck = await this.prowareRepo.findById(
    //       productwarehouse
    //     );
    //     if (!productwarehouseCheck) {
    //       return { status: 400, message: "Product in warehouse not found" };
    //     } else if (productwarehouseCheck.stock < Number(bsktList?.quantity) + 1) {
    //       return { status: 400, message: "Not enough stock" };
    //     }
    //     if (bsktList) {
    //       try {
    //         bsktList.quantity += 1;
    //       } catch (error) {
    //         console.error("Error updating order:", error);
    //       }
    //     }
    //     const result = await OrderModel.findByIdAndUpdate(userorder?._id, {
    //       $set: { orderList: userorder.orderList },
    //     });
    //
    //     if (!result) {
    //       return { status: 404, message: "User order not found" };
    //     }
    //     return { status: 200, message: "Order updated successfully" };
    //   } catch (error) {
    //     throw error;
    //   }
    // }
    //
    // // quantity-decrease
    // @Post("/decrease")
    // // async quantityDecrease(
    // //   @User() user: UserInfo,
    // //   @Body({
    // //     destination: "productwarehouse",
    // //     schema: BaseController.id,
    // //   })
    // //   productwarehouse: string
    // // ): Promise<Response> {
    // //   try {
    // //     var userorder = await this.repository.findOne({
    // //       user: user.id as string,
    // //     });
    // //     if (userorder == null) {
    // //       return { status: 404, message: "ID order not found" };
    // //     }
    // //     const bsktList = userorder?.orderList.find((orderItem: any) => {
    // //       return orderItem.productwarehouse.equals(productwarehouse);
    // //     });
    // //     if (!bsktList) {
    // //       return { status: 400, message: "Product in order not found" };
    // //     }
    // //     let productwarehouseCheck = await this.prowareRepo.findById(
    // //       productwarehouse
    // //     );
    // //     if (!productwarehouseCheck) {
    // //       return { status: 400, message: "Product in warehouse not found" };
    // //     } else if (0 >= Number(bsktList?.quantity)) {
    // //       pull(userorder.orderList, bsktList);
    // //       const result = await OrderModel.findByIdAndUpdate(userorder?._id, {
    // //         $set: { orderList: userorder.orderList },
    // //       });
    // //       return { status: 400, message: "Not wwwwww enough stock" };
    // //     }
    // //     if (bsktList) {
    // //       try {
    // //         bsktList.quantity -= 1;
    // //       } catch (error) {
    // //         console.error("Error updating order:", error);
    // //       }
    // //     }
    // //     const result = await OrderModel.findByIdAndUpdate(userorder?._id, {
    // //       $set: { orderList: userorder.orderList },
    // //     });
    //
    // //     if (!result) {
    // //       return { status: 404, message: "User order not found" };
    // //     }
    // //     return { status: 200, message: "Order updated successfully" };
    // //   } catch (error) {
    // //     throw error;
    // //   }
    // // }
    // async push(
    //   @Body({
    //     destination: "id",
    //     schema: BaseController.id,
    //   })
    //   id: string,
    //   @Body({
    //     destination: "field",
    //     schema: z.string(),
    //   })
    //   field: string
    // ) {
    //   return this.editById(id, {
    //     $set: {
    //       product: field,
    //     },
    //   });
    // }
    //
    // // async deleteByPhone(
    // //   @Body({ destination: "phone", schema: z.string() }) phone: string
    // // ): Promise<Response> {
    // //   try {
    // //     await this.repository.findOneAndDelete({
    // //       "info.userInfo.phoneNumber": phone,
    // //     });
    // //     return {
    // //       status: 200,
    // //       data: {},
    // //     };
    // //   } catch (error) {
    // //     throw error;
    // //   }
    // // }
    async create(data, user) {
        let userorder = await this.orderRepo.findOne({ user: user.id });
        if (userorder == null) {
            return this.createNewOrder(data, user.id);
        }
        else {
            return this.updateExistingOrder(data, userorder);
        }
    }
    async createNewOrder(data, userId) {
        // try {
        //   data.user = userId;
        //   const orderLists = data.orderList;
        //   for (const bsktList of orderLists) {
        //     const productwarehouseId = bsktList.productwarehouse;
        //     const quantity = bsktList.quantity;
        //     let productwarehouse = await this.prowareRepo.findById(
        //       productwarehouseId as string
        //     );
        //     if (!productwarehouse) {
        //       return { status: 400, message: "Product in warehouse not found" };
        //     } else if (productwarehouse.stock < quantity) {
        //       return { status: 400, message: "Not enough stock" };
        //     }
        //     const product = await this.proRepo.findById(
        //       productwarehouse.product as string
        //     );
        //     bsktList.price = productwarehouse.price;
        //     bsktList.product = product?._id;
        //   }
        //   data.orderList = orderLists;
        //   return super.create(data);
        // } catch (error) {
        //   console.error("Error creating new order:", error);
        //   throw error;
        // }
        return { status: 200, message: "its order" };
    }
    async updateExistingOrder(data, userorder) {
        const orderLists = userorder.orderList;
        // const dataList = data.orderList[0];
        // const bsktList = orderLists.find((orderItem: any) => {
        //   return orderItem.productwarehouse.equals(dataList.productwarehouse);
        // });
        // const productwarehouse = await this.prowareRepo.findById(
        //   dataList.productwarehouse as string
        // );
        // if (!productwarehouse) {
        //   return { status: 400, message: "Product in warehouse not found" };
        // } else if (
        //   productwarehouse.stock <
        //   Number(bsktList?.quantity) +
        //     Number(dataList.quantity ? dataList.quantity : 1)
        // ) {
        //   return { status: 400, message: "Not enough stock for update" };
        // }
        // if (bsktList) {
        //   try {
        //     bsktList.quantity += dataList.quantity;
        //   } catch (error) {
        //     console.error("Error updating order:", error);
        //   }
        // } else {
        //   orderLists.push({
        //     product: productwarehouse.product,
        //     productwarehouse: productwarehouse._id,
        //     price: productwarehouse.price,
        //     quantity: dataList.quantity,
        //   });
        // }
        // try {
        //   const result = await OrderModel.findByIdAndUpdate(userorder._id, {
        //     $set: { orderList: orderLists },
        //   });
        //   if (!result) {
        //     return { status: 404, message: "User order not found" };
        //   }
        // } catch (error: any) {
        //   throw error;
        // }
        return { status: 200, message: "Order updated successfully" };
    }
}
exports.OrderController = OrderController;
__decorate([
    (0, method_1.Post)("/checkout", {
        // absolute: true,
        loginRequired: true,
        // apiDoc: {
        //   security: [
        //     {
        //       BasicAuth: [],
        //     },
        //   ],
        // },
    }),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id,
    }))
], OrderController.prototype, "orderCheckout", null);
__decorate([
    __param(1, (0, parameters_1.User)())
], OrderController.prototype, "create", null);
const order = new OrderController("/order", new repository_1.default(), {
    insertSchema: zod_1.default.object({
    // product: BaseController.id,
    // orderList: z.array(
    //   z.object({
    //     productwarehouse: BaseController.id.optional(),
    //     // user: BaseController.id,
    //     // price: ,
    //     quantity: z.coerce.number().positive().int().default(1),
    //   })
    // ),
    }),
    apiDoc: {
        security: [
            {
                BasicAuth: [],
            },
        ],
    },
});
exports.default = order;
