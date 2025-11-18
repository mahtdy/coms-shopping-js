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
exports.BasketController = void 0;
const repository_1 = __importDefault(require("../../../repositories/admin/basket/repository"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const model_1 = require("../../../repositories/admin/basket/model");
const zod_1 = __importDefault(require("zod"));
const repository_2 = __importDefault(require("../../../repositories/admin/product/repository"));
const repository_3 = __importDefault(require("../../../repositories/admin/productWarehouse/repository"));
const method_1 = require("../../../core/decorators/method");
// import { set, Types } from "mongoose";
// import { QueryInfo } from "../../../core/mongoose-controller/repository";
const parameters_1 = require("../../../core/decorators/parameters");
// import { Route } from "../../../core/application";
const lodash_1 = require("lodash");
const repository_4 = __importDefault(require("../../../repositories/admin/order/repository"));
// interface OrderCheckoutBasket {
//   user?: string | UserInfo;
//   basketList: {
//     price: number;
//     product: string | Product;
//     productwarehouse: string | Productwarehouse;
//     quantity: number;
//   }[];
//   // config: object;
// }
class BasketController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.basketRepo = new repository_1.default();
        this.proRepo = new repository_2.default();
        this.orderRepo = new repository_4.default();
        this.prowareRepo = new repository_3.default();
    }
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
    // checkout    6704fc69abe76b1bc03ff07a
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi2K3Ys9mGIiwiZmFtaWx5Ijoi2YXYrdmF2K_bjCIsImlkIjoiNjRiOTJiZDliYTI5YWFjZTMxMjliM2RlIiwicGhvbmVOdW1iZXIiOiIwOTM1ODcwMzUzNCIsImVtYWlsIjoiaC5tb2hhbW1hZGkuMjQ3N0BnbWFpbC5jb20iLCJpYXQiOjE3MjY2NDU3ODl9.IMnS_9ACJlV86lu1CI1z39-cd86wWRZ4oI0wmAWE3Jo
    async orderCheckout(user, orderData) {
        console.log("user.id12", user);
        console.log("orderData", orderData);
        // console.log("productwarehouse11", BasketId);
        // console.log("data11", data);
        if (user != null) {
            let userBasket = await this.basketRepo.findOne({
                user: user.id,
            });
            if (userBasket == null) {
                return { status: 200, message: "basket is empty" };
            }
            else {
                return this.createNewOrder(userBasket, user.id);
            }
            console.log("userBasket", userBasket);
            console.log("user.id11", user);
            let userorder = await this.orderRepo.findOne({ user: user.id });
            console.log("userorder", userorder);
            // if (userorder == null) {
            //   return this.createNewOrder(data, user.id);
            // } else {
            //   return this.updateExistingOrder(data, userorder);
            // }
        }
        // @User() user: UserInfo,
        // @Body({
        //   destination: "admin",
        //   schema: BaseController.id,
        // })
        // admin: string,
        // @Body({
        //   destination: "id",
        //   schema: BaseController.id,
        // })
        // id: string,
        // @Body({
        //   destination: "id_basket",
        //   schema: BaseController.id,
        // })
        // id_basket: string,
        // @Body({
        //   destination: "id_user",
        //   schema: BaseController.id,
        // })
        // id_user: string,
        // @Body({
        //   schema: z.object({
        //     sendTime: z.string().default("8-12"),
        //     isBig: z.boolean().default(false),
        //     sendDate: z.coerce.date(),
        //     sendType: z.coerce.number().positive().int(),
        //     statusOrder: z.coerce.number().positive().int(),
        //     totalPriceProducts: z.coerce.number().positive().int(),
        //     totalPriceSend: z.coerce.number().positive().int(),
        //     // totalPriceOff: z.coerce.number().positive().int(),
        //     totalPriceAll: z.coerce.number().positive().int(),
        //   }),
        // })
        // data: {
        //   sendTime: string;
        //   isBig: boolean;
        //   sendDate: Date;
        //   sendType: number;
        //   statusOrder: number;
        //   totalPriceProducts: number;
        //   totalPriceSend: number;
        //   // totalPriceOff: number,
        //   totalPriceAll: number;
        // }
        // ) {
        // console.log("id", id);
        // console.log("user", user);
        // console.log("data", data);
        // this.orderRepo.insert(data as any);
        return { status: 200, message: "insert data to  DB" };
    }
    async createNewOrder(data, userId) {
        console.log("data", data);
        console.log("userId", userId);
        console.log("its ok");
        return { status: 200, message: "New insert data to  DB" };
    }
    async updateExistingOrder(data, userbasket) {
        console.log("data", data);
        console.log("userbasket", userbasket);
        return { status: 200, message: "Update insert data to  DB" };
    }
    // quantity-increase
    async quantityIncrease(user, productwarehouse
    // @Body({
    //   destination: "hash",
    //   schema: z.string(),
    // })
    // hash: string
    ) {
        try {
            var userbasket = await this.repository.findOne({
                user: user.id,
            });
            if (userbasket == null) {
                return { status: 404, message: "ID basket not found" };
            }
            const bsktList = userbasket === null || userbasket === void 0 ? void 0 : userbasket.basketList.find((basketItem) => {
                return basketItem.productwarehouse.equals(productwarehouse);
            });
            if (!bsktList) {
                return { status: 400, message: "Product in basket not found" };
            }
            let productwarehouseCheck = await this.prowareRepo.findById(productwarehouse);
            if (!productwarehouseCheck) {
                return { status: 400, message: "Product in warehouse not found" };
            }
            else if (productwarehouseCheck.quantity < Number(bsktList === null || bsktList === void 0 ? void 0 : bsktList.quantity) + 1) {
                return { status: 400, message: "Not enough quantity" };
            }
            if (bsktList) {
                try {
                    bsktList.quantity += 1;
                }
                catch (error) {
                    console.error("Error updating basket:", error);
                }
            }
            const result = await model_1.BasketModel.findByIdAndUpdate(userbasket === null || userbasket === void 0 ? void 0 : userbasket._id, {
                $set: { basketList: userbasket.basketList },
            });
            if (!result) {
                return { status: 404, message: "User basket not found" };
            }
            return { status: 200, message: "Basket updated successfully" };
        }
        catch (error) {
            throw error;
        }
    }
    // quantity-decrease
    async quantityDecrease(user, productwarehouse) {
        try {
            var userbasket = await this.repository.findOne({
                user: user.id,
            });
            if (userbasket == null) {
                return { status: 404, message: "ID basket not found" };
            }
            const bsktList = userbasket === null || userbasket === void 0 ? void 0 : userbasket.basketList.find((basketItem) => {
                return basketItem.productwarehouse.equals(productwarehouse);
            });
            if (!bsktList) {
                return { status: 400, message: "Product in basket not found" };
            }
            let productwarehouseCheck = await this.prowareRepo.findById(productwarehouse);
            if (!productwarehouseCheck) {
                return { status: 400, message: "Product in warehouse not found" };
            }
            else if (0 >= Number(bsktList === null || bsktList === void 0 ? void 0 : bsktList.quantity)) {
                (0, lodash_1.pull)(userbasket.basketList, bsktList);
                const result = await model_1.BasketModel.findByIdAndUpdate(userbasket === null || userbasket === void 0 ? void 0 : userbasket._id, {
                    $set: { basketList: userbasket.basketList },
                });
                return { status: 400, message: "Not wwwwww enough quantity" };
            }
            if (bsktList) {
                try {
                    bsktList.quantity -= 1;
                }
                catch (error) {
                    console.error("Error updating basket:", error);
                }
            }
            const result = await model_1.BasketModel.findByIdAndUpdate(userbasket === null || userbasket === void 0 ? void 0 : userbasket._id, {
                $set: { basketList: userbasket.basketList },
            });
            if (!result) {
                return { status: 404, message: "User basket not found" };
            }
            return { status: 200, message: "Basket updated successfully" };
        }
        catch (error) {
            throw error;
        }
    }
    async push(id, field) {
        return this.editById(id, {
            $set: {
                product: field,
            },
        });
    }
    // async deleteByPhone(
    //   @Body({ destination: "phone", schema: z.string() }) phone: string
    // ): Promise<Response> {
    //   try {
    //     await this.repository.findOneAndDelete({
    //       "info.userInfo.phoneNumber": phone,
    //     });
    //     return {
    //       status: 200,
    //       data: {},
    //     };
    //   } catch (error) {
    //     throw error;
    //   }
    // }
    async create(data, user) {
        let userbasket = await this.basketRepo.findOne({ user: user.id });
        if (userbasket == null) {
            return this.createNewBasket(data, user.id);
        }
        else {
            return this.updateExistingBasket(data, userbasket);
        }
    }
    async createNewBasket(data, userId) {
        try {
            data.user = userId;
            const basketLists = data.basketList;
            for (const bsktList of basketLists) {
                const productwarehouseId = bsktList.productwarehouse;
                const quantity = bsktList.quantity;
                let productwarehouse = await this.prowareRepo.findById(productwarehouseId);
                if (!productwarehouse) {
                    return { status: 400, message: "Product in warehouse not found" };
                }
                else if (productwarehouse.quantity < quantity) {
                    return { status: 400, message: "Not enough quantity" };
                }
                const product = await this.proRepo.findById(productwarehouse.product);
                bsktList.price = productwarehouse.price;
                bsktList.product = product === null || product === void 0 ? void 0 : product._id;
            }
            data.basketList = basketLists;
            return super.create(data);
        }
        catch (error) {
            console.error("Error creating new basket:", error);
            throw error;
        }
    }
    async updateExistingBasket(data, userbasket) {
        const basketLists = userbasket.basketList;
        const dataList = data.basketList[0];
        const bsktList = basketLists.find((basketItem) => {
            return basketItem.productwarehouse.equals(dataList.productwarehouse);
        });
        const productwarehouse = await this.prowareRepo.findById(dataList.productwarehouse);
        if (!productwarehouse) {
            return { status: 400, message: "Product in warehouse not found" };
        }
        else if (productwarehouse.quantity <
            Number(bsktList === null || bsktList === void 0 ? void 0 : bsktList.quantity) +
                Number(dataList.quantity ? dataList.quantity : 1)) {
            return { status: 400, message: "Not enough quantity for update" };
        }
        if (bsktList) {
            try {
                bsktList.quantity += dataList.quantity;
            }
            catch (error) {
                console.error("Error updating basket:", error);
            }
        }
        else {
            basketLists.push({
                product: productwarehouse.product,
                productwarehouse: productwarehouse._id,
                price: productwarehouse.price,
                quantity: dataList.quantity,
            });
        }
        try {
            const result = await model_1.BasketModel.findByIdAndUpdate(userbasket._id, {
                $set: { basketList: basketLists },
            });
            if (!result) {
                return { status: 404, message: "User basket not found" };
            }
        }
        catch (error) {
            throw error;
        }
        return { status: 200, message: "Basket updated successfully" };
    }
}
exports.BasketController = BasketController;
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
        schema: zod_1.default.object({
            BasketId: controller_1.default.id.default("6704fc69abe76b1bc03ff07a"),
            address: controller_1.default.id.default("6704fc69abe76b1bc0311333"),
            offCode: controller_1.default.id.default("6704fc69abe76b1bc00ff0ff"),
            statusOrder: zod_1.default.number().positive().default(3),
            sendType: zod_1.default.number().positive().default(1),
            sendTime: zod_1.default.number().positive().default(1),
            isBig: zod_1.default.number().positive().default(1),
            sendDate: zod_1.default.number().positive().default(1),
            typePeyment: zod_1.default.number().positive().default(1),
            totalPriceProducts: zod_1.default.number().positive().default(1),
        }),
    }))
], BasketController.prototype, "orderCheckout", null);
__decorate([
    (0, method_1.Post)("/increase"),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({
        destination: "productwarehouse",
        schema: controller_1.default.id,
    }))
], BasketController.prototype, "quantityIncrease", null);
__decorate([
    (0, method_1.Post)("/decrease"),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({
        destination: "productwarehouse",
        schema: controller_1.default.id,
    }))
], BasketController.prototype, "quantityDecrease", null);
__decorate([
    __param(0, (0, parameters_1.Body)({
        destination: "id",
        schema: controller_1.default.id,
    })),
    __param(1, (0, parameters_1.Body)({
        destination: "field",
        schema: zod_1.default.string(),
    }))
], BasketController.prototype, "push", null);
__decorate([
    __param(1, (0, parameters_1.User)())
], BasketController.prototype, "create", null);
const basket = new BasketController("/basket", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        // product: BaseController.id,
        basketList: zod_1.default.array(zod_1.default.object({
            productwarehouse: controller_1.default.id.optional().default("67d2b3f1e0122b71ef770e8e"),
            // user: BaseController.id,
            // price: ,
            quantity: zod_1.default.coerce.number().positive().int().default(10),
        })),
    }),
    apiDoc: {
        security: [
            {
                BasicAuth: [],
            },
        ],
    },
});
exports.default = basket;
