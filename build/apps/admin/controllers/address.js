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
exports.AddressController = void 0;
const parameters_1 = require("../../../core/decorators/parameters");
const method_1 = require("../../../core/decorators/method");
const repository_1 = __importDefault(require("../../../repositories/admin/address/repository"));
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const zod_1 = __importDefault(require("zod"));
class AddressController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.addressRepo = new repository_1.default();
    }
    // initApis() {
    //     super.initApis();
    // }
    async test(
    // @User() user: UserInfo,
    ) {
        console.log("user.id12");
        return { status: 200, message: "Basket updated successfully" };
    }
    async getUserAddresses(addressData) {
        console.log("user.id12", addressData);
        try {
            const addresses = await this.repository.findOne({
                user: addressData.userId,
            });
            return {
                status: 200,
                data: addresses
            };
        }
        catch (error) {
            throw error;
        }
    }
    // افزودن آدرس جدید برای کاربر
    // @Post("/user/:user", {
    //     loginRequired: true,
    //
    // })
    // async addUserAddress(
    //     @User() user: UserInfo,
    //     @Body({
    //         schema: z.object({
    //             title: z.string(),
    //             receiver: z.object({
    //                 name: z.string(),
    //                 family: z.string(),
    //                 phoneNumber: z.string()
    //             }),
    //             country: z.string(),
    //             province: z.string(),
    //             city: z.string(),
    //             district: z.string(),
    //             street: z.string(),
    //             details: z.string(),
    //             postalCode: z.string(),
    //             location: z.object({
    //                 lat: z.number(),
    //                 lng: z.number()
    //             }).optional(),
    //             isDefault: z.boolean().optional(),
    //         }),
    //     })
    //     addressData: {
    //         title: string,
    //         receiver: {
    //             name: string,
    //             family: string,
    //             phoneNumber: string
    //         },
    //         country: string,
    //         province: string,
    //         city: string,
    //         district: string,
    //         street: string,
    //         details: string,
    //         postalCode: string,
    //         location: {
    //             lat: number,
    //             lng: number
    //         },
    //         isDefault: boolean,
    //     }
    // ): Promise<Response> {
    //     try {
    //         console.log("user.id12", user);
    //         // افزودن شناسه کاربر به آدرس
    //         user :  user.id;
    //
    //         const address = await (this.repository).addAddress(addressData);
    //
    //         return {
    //             status: 200,
    //             message: "آدرس با موفقیت اضافه شد",
    //             data: address
    //         };
    //     } catch (error) {
    //         throw error;
    //     }
    // }
    //
    // // ویرایش آدرس کاربر
    // @Put("/:id", {
    //     apiDoc: {
    //         security: [
    //             {
    //                 AdminAuth: [],
    //             },
    //         ],
    //     },
    // })
    // async updateAddress(
    //     @User() user: UserInfo,
    //     @Body({
    //         destination: "id"
    //     }) addressId: string,
    //     @Body({
    //         schema: z.object({
    //             title: z.string(),
    //             receiver: z.object({
    //                 name: z.string(),
    //                 family: z.string(),
    //                 phoneNumber: z.string()
    //             }),
    //             country: z.string(),
    //             province: z.string(),
    //             city: z.string(),
    //             district: z.string(),
    //             street: z.string(),
    //             details: z.string(),
    //             postalCode: z.string(),
    //             location: z.object({
    //                 lat: z.number(),
    //                 lng: z.number()
    //             }).optional(),
    //             isDefault: z.boolean().optional(),
    //         }),
    //     })
    //     addressData: {
    //         title: string,
    //         receiver: {
    //             name: string,
    //             family: string,
    //             phoneNumber: string
    //         },
    //         country: string,
    //         province: string,
    //         city: string,
    //         district: string,
    //         street: string,
    //         details: string,
    //         postalCode: string,
    //         location: {
    //             lat: number,
    //             lng: number
    //         },
    //         isDefault: boolean,
    //     }
    // ): Promise<Response> {
    //     try {
    //         const updatedAddress = await (this.repository).updateAddress(addressId, addressData);
    //
    //         if (!updatedAddress) {
    //             return {
    //                 status: 404,
    //                 message: "آدرس مورد نظر یافت نشد"
    //             };
    //         }
    //
    //         return {
    //             status: 200,
    //             message: "آدرس با موفقیت بروزرسانی شد",
    //             data: updatedAddress
    //         };
    //     } catch (error) {
    //         throw error;
    //     }
    // }
    // حذف آدرس
    async deleteAddress(addressId, user) {
        try {
            const existingAddress = await this.repository.findById(addressId);
            if (!existingAddress) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }
            // اگر آدرس پیش‌فرض است، باید یک آدرس دیگر را پیش‌فرض کنیم
            // if (existingAddress.isDefault) {
            //     const otherAddress = await this.repository.findOne({
            //         userId: existingAddress.user,
            //         _id: {$ne: addressId}
            //     });
            //
            //     if (otherAddress) {
            //         await (this.repository).setDefaultAddress(otherAddress._id, existingAddress.user);
            //     }
            // }
            await this.repository.findByIdAndDelete(addressId);
            return {
                status: 200,
                message: "آدرس با موفقیت حذف شد"
            };
        }
        catch (error) {
            throw error;
        }
    }
    // جستجوی آدرس‌ها
    async searchAddresses(searchParams, user) {
        try {
            const query = {};
            if (searchParams.userId) {
                query.userId = searchParams.userId;
            }
            if (searchParams.province) {
                query.province = searchParams.province;
            }
            if (searchParams.city) {
                query.city = searchParams.city;
            }
            if (searchParams.postalCode) {
                query.postalCode = searchParams.postalCode;
            }
            const addresses = await this.repository.find(query);
            return {
                status: 200,
                data: addresses
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.AddressController = AddressController;
__decorate([
    (0, method_1.Get)("/test")
], AddressController.prototype, "test", null);
__decorate([
    (0, method_1.Post)("/user", {}),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.default.object({
            userId: controller_1.default.id.default("627e2d5cb22fe19e794c8347"),
            // schema: data.id
        }),
    }))
], AddressController.prototype, "getUserAddresses", null);
__decorate([
    (0, method_1.Delete)("/:id", {
        apiDoc: {
            security: [
                {
                    AdminAuth: [],
                },
            ],
        },
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "id"
    })),
    __param(1, (0, parameters_1.User)())
], AddressController.prototype, "deleteAddress", null);
__decorate([
    (0, method_1.Get)("/search", {
        apiDoc: {
            security: [
                {
                    AdminAuth: [],
                },
            ],
        },
    }),
    __param(0, (0, parameters_1.Body)({
        schema: zod_1.default.object({
            userId: controller_1.default.id.optional(),
            province: zod_1.default.string().optional(),
            city: zod_1.default.string().optional(),
            postalCode: zod_1.default.string().optional()
        })
    })),
    __param(1, (0, parameters_1.User)())
], AddressController.prototype, "searchAddresses", null);
const address = new AddressController("/address", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        user: controller_1.default.id,
        addressList: zod_1.default.array(zod_1.default.object({
            title: zod_1.default.string().default('Home'),
            receiver: zod_1.default.object({
                name: zod_1.default.string().default('first name'),
                family: zod_1.default.string().default('last name'),
                phoneNumber: zod_1.default.string().default('09123456789')
            }),
            country: zod_1.default.string().default('iran'),
            province: zod_1.default.string().default('Qazvin'),
            city: zod_1.default.string().default('Qazvin'),
            district: zod_1.default.string().default('Qazvin'),
            street: zod_1.default.string().default('naderi'),
            details: zod_1.default.string().default('ساختمان 333 پلاک 11'),
            postalCode: zod_1.default.string().default('3414633222'),
            location: zod_1.default.object({
                lat: zod_1.default.number().optional(),
                lng: zod_1.default.number().optional()
            }).optional(),
            // isDefault: z.boolean().optional().default(false),
        })),
    }),
});
exports.default = address;
