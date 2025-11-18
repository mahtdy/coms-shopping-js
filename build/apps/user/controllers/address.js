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
const controller_1 = __importDefault(require("../../../core/mongoose-controller/controller"));
const method_1 = require("../../../core/decorators/method");
const repository_1 = __importDefault(require("../../../repositories/admin/address/repository"));
const zod_1 = __importDefault(require("zod"));
class AddressController extends controller_1.default {
    constructor(baseRoute, repo, options) {
        super(baseRoute, repo, options);
        this.addressRepo = new repository_1.default();
    }
    // اسکیما Zod برای اعتبارسنجی
    // export const addressZod = z.object({
    //     title: z.string(),
    //     receiver: z.object({
    //         name: z.string(),
    //         family: z.string(),
    //         phoneNumber: z.string()
    //     }),
    //     country: z.string(),
    //     province: z.string(),
    //     city: z.string(),
    //     district: z.string(),
    //     street: z.string(),
    //     details: z.string(),
    //     postalCode: z.string(),
    //     location: z.object({
    //         lat: z.number(),
    //         lng: z.number()
    //     }).optional(),
    //     isDefault: z.boolean().optional()
    // });
    //     initApis() {
    //         super.initApis();
    //     }
    // دریافت تمام آدرس‌های کاربر
    async getUserAddresses(user) {
        try {
            const addresses = await this.repository.findByUserId(user.id || "");
            return {
                status: 200,
                data: addresses
            };
        }
        catch (error) {
            throw error;
        }
    }
    // دریافت یک آدرس خاص
    async getAddress(user, addressId) {
        try {
            const address = await this.repository.findById(addressId);
            // بررسی مالکیت آدرس
            if (!address || address.user.toString() !== user.id) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }
            return {
                status: 200,
                data: address
            };
        }
        catch (error) {
            throw error;
        }
    }
    // // افزودن آدرس جدید
    // @Post("/", {
    //     apiDoc: {
    //         security: [
    //             {
    //                 BasicAuth: [],
    //             },
    //         ],
    //     },
    // })
    // async addAddress(
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
    //         // addressData.user = user.id;
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
    // ویرایش آدرس
    // @Put("/:id", {
    //     apiDoc: {
    //         security: [
    //             {
    //                 BasicAuth: [],
    //             },
    //         ],
    //     },
    // })
    // async updateAddress(
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
    //     },
    //     @User() user: UserInfo
    // ): Promise<Response> {
    //     try {
    //         const existingAddress = await this.repository.findById(addressId);
    //         if (!existingAddress || existingAddress.user.toString() !== user.id) {
    //             return {
    //                 status: 404,
    //                 message: "آدرس مورد نظر یافت نشد"
    //             };
    //         }
    //
    //         const updatedAddress = await (this.repository).updateAddress(addressId, addressData);
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
            // بررسی وجود آدرس و مالکیت آن
            const existingAddress = await this.repository.findById(addressId);
            if (!existingAddress || existingAddress.user.toString() !== user.id) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }
            // اگر آدرس پیش‌فرض است، باید یک آدرس دیگر را پیش‌فرض کنیم
            // if (existingAddress.isDefault) {
            //     const otherAddress = await this.repository.findOne({
            //         userId: user.id,
            //         _id: {$ne: addressId}
            //     });
            //
            //     if (otherAddress) {
            //         await (this.repository).setDefaultAddress(otherAddress._id, user.id);
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
    // تنظیم آدرس پیش‌فرض
    async setDefaultAddress(addressId, user) {
        try {
            // بررسی وجود آدرس و مالکیت آن
            const existingAddress = await this.repository.findById(addressId);
            if (!existingAddress || existingAddress.user.toString() !== user.id) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }
            const success = await (this.repository).setDefaultAddress(addressId, user.id);
            if (success) {
                return {
                    status: 200,
                    message: "آدرس پیش‌فرض با موفقیت تنظیم شد"
                };
            }
            else {
                return {
                    status: 500,
                    message: "خطا در تنظیم آدرس پیش‌فرض"
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
}
exports.AddressController = AddressController;
__decorate([
    (0, method_1.Get)("/", {
        apiDoc: {
            security: [
                {
                    BasicAuth: [],
                },
            ],
        },
    }),
    __param(0, (0, parameters_1.User)())
], AddressController.prototype, "getUserAddresses", null);
__decorate([
    (0, method_1.Get)("/:id", {
        apiDoc: {
            security: [
                {
                    BasicAuth: [],
                },
            ],
        },
    }),
    __param(0, (0, parameters_1.User)()),
    __param(1, (0, parameters_1.Body)({ destination: "id" }))
], AddressController.prototype, "getAddress", null);
__decorate([
    (0, method_1.Delete)("/:id", {
        apiDoc: {
            security: [
                {
                    BasicAuth: [],
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
    (0, method_1.Put)("/:id/default", {
        apiDoc: {
            security: [
                {
                    BasicAuth: [],
                },
            ],
        },
    }),
    __param(0, (0, parameters_1.Body)({
        destination: "id"
    })),
    __param(1, (0, parameters_1.User)())
], AddressController.prototype, "setDefaultAddress", null);
const address = new AddressController("/address", new repository_1.default(), {
    insertSchema: zod_1.default.object({
        addressList: zod_1.default.array(zod_1.default.object({
            title: zod_1.default.string(),
            receiver: zod_1.default.object({
                name: zod_1.default.string(),
                family: zod_1.default.string(),
                phoneNumber: zod_1.default.string()
            }),
            country: zod_1.default.string(),
            province: zod_1.default.string(),
            city: zod_1.default.string(),
            district: zod_1.default.string(),
            street: zod_1.default.string(),
            details: zod_1.default.string(),
            postalCode: zod_1.default.string(),
            location: zod_1.default.object({
                lat: zod_1.default.number(),
                lng: zod_1.default.number()
            }).optional(),
            // isDefault: z.boolean().optional().default(false),
        })),
    }),
});
exports.default = address;
