import {Body, User} from "../../../core/decorators/parameters";
import {Response} from "../../../core/controller";
import BaseController, {ControllerOptions} from "../../../core/mongoose-controller/controller";
import {Get, Post, Put, Delete} from "../../../core/decorators/method";
import {UserInfo} from "../../../core/mongoose-controller/auth/user/userAuthenticator";
import Address from "../../../repositories/admin/address/model";
import AddressRepository from "../../../repositories/admin/address/repository";
import ProductRepository from "../../../repositories/admin/product/repository";
import ProductWarehouseRepository from "../../../repositories/admin/productWarehouse/repository";
import OrderRepository from "../../../repositories/admin/order/repository";
import BasketRepository from "../../../repositories/admin/basket/repository";
import z from "zod";
import basket, {BasketController} from "../../admin/controllers/basket";
import AddressValidationService from "../../services/addressValidationService";

export class AddressController extends BaseController<Address> {
    // proRepo: ProductRepository;
    // prowareRepo: ProductWarehouseRepository;
    // orderRepo: OrderRepository;
    addressRepo: AddressRepository;
    private addressValidationService: AddressValidationService;

    constructor(
        baseRoute: string,
        repo: AddressRepository,
        options?: ControllerOptions
    ) {
        super(baseRoute, repo, options);
        this.addressRepo = new AddressRepository();
        this.addressValidationService = new AddressValidationService();
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

    /**
     * توضیح فارسی: دریافت تمام آدرس‌های کاربر از طریق توکن احراز هویت.
     */
    @Get("/", {
        loginRequired: true,
    })
    async getUserAddresses(@User() user: UserInfo): Promise<Response> {
        try {
            const addresses = await this.repository.findOne({
                user: user.id as string,
            });
            
            return {
                status: 200,
                data: addresses || { user: user.id, addressList: [] }
            };
        } catch (error) {
            throw error;
        }
    }

    // دریافت یک آدرس خاص
    @Get("/:id", {
        apiDoc: {
            security: [
                {
                    BasicAuth: [],
                },
            ],
        },
    })
    async getAddress(@User() user: UserInfo, @Body({destination: "id"}) addressId: string): Promise<Response> {
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
        } catch (error) {
            throw error;
        }
    }

    /**
     * توضیح فارسی: افزودن آدرس جدید برای کاربر. اگر اولین آدرس باشد، به صورت پیش‌فرض تنظیم می‌شود.
     */
    @Post("/", {
        loginRequired: true,
    })
    async addAddress(
        @User() user: UserInfo,
        @Body({
            schema: z.object({
                title: z.string(),
                receiver: z.object({
                    name: z.string(),
                    family: z.string(),
                    phoneNumber: z.string()
                }),
                country: z.string(),
                province: z.string(),
                city: z.string(),
                district: z.string(),
                street: z.string(),
                details: z.string(),
                postalCode: z.string(),
                location: z.object({
                    lat: z.number(),
                    lng: z.number()
                }).optional(),
                isDefault: z.boolean().optional(),
            }),
        })
        addressData: {
            title: string,
            receiver: {
                name: string,
                family: string,
                phoneNumber: string
            },
            country: string,
            province: string,
            city: string,
            district: string,
            street: string,
            details: string,
            postalCode: string,
            location?: {
                lat: number,
                lng: number
            },
            isDefault?: boolean,
        }
    ): Promise<Response> {
        try {
            // کامنت: اعتبارسنجی آدرس
            const validationResult = this.addressValidationService.validateAddress({
                province: addressData.province,
                city: addressData.city,
                postalCode: addressData.postalCode,
                location: addressData.location,
                receiver: addressData.receiver,
                details: addressData.details,
            });

            // کامنت: اگر خطاهای جدی وجود دارد، درخواست را رد می‌کنیم
            if (!validationResult.isValid) {
                return {
                    status: 400,
                    message: "خطا در اعتبارسنجی آدرس",
                    data: {
                        errors: validationResult.errors,
                        warnings: validationResult.warnings,
                    },
                };
            }

            // کامنت: اگر هشدار وجود دارد، به کاربر اطلاع می‌دهیم اما ادامه می‌دهیم
            if (validationResult.warnings.length > 0) {
                console.warn("هشدارهای اعتبارسنجی آدرس:", validationResult.warnings);
            }

            // بررسی وجود آدرس برای کاربر
            let userAddress = await this.repository.findOne({ user: user.id as string });
            
            const newAddressItem = {
                ...addressData,
                isDefault: addressData.isDefault ?? (userAddress === null || userAddress.addressList.length === 0),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            if (!userAddress) {
                // اگر کاربر آدرسی ندارد، یک رکورد جدید ایجاد می‌کنیم
                userAddress = await this.repository.insert({
                    user: user.id as string,
                    addressList: [newAddressItem],
                } as any);
            } else {
                // اگر آدرس پیش‌فرض جدید است، بقیه را غیرفعال می‌کنیم
                if (newAddressItem.isDefault) {
                    userAddress.addressList.forEach((addr: any) => {
                        addr.isDefault = false;
                    });
                }
                userAddress.addressList.push(newAddressItem as any);
                await this.repository.editById(userAddress._id, {
                    $set: { addressList: userAddress.addressList }
                });
            }

            return {
                status: 200,
                message: "آدرس با موفقیت اضافه شد",
                data: {
                    address: userAddress,
                    validation: {
                        warnings: validationResult.warnings,
                    },
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * توضیح فارسی: ویرایش یک آدرس خاص از لیست آدرس‌های کاربر. index آدرس در addressList باید ارسال شود.
     */
    @Put("/", {
        loginRequired: true,
    })
    async updateAddress(
        @User() user: UserInfo,
        @Body({
            schema: z.object({
                addressIndex: z.number().int().min(0), // ایندکس آدرس در addressList
                title: z.string().optional(),
                receiver: z.object({
                    name: z.string(),
                    family: z.string(),
                    phoneNumber: z.string()
                }).optional(),
                country: z.string().optional(),
                province: z.string().optional(),
                city: z.string().optional(),
                district: z.string().optional(),
                street: z.string().optional(),
                details: z.string().optional(),
                postalCode: z.string().optional(),
                location: z.object({
                    lat: z.number(),
                    lng: z.number()
                }).optional(),
                isDefault: z.boolean().optional(),
            }),
        })
        updateData: {
            addressIndex: number,
            title?: string,
            receiver?: {
                name: string,
                family: string,
                phoneNumber: string
            },
            country?: string,
            province?: string,
            city?: string,
            district?: string,
            street?: string,
            details?: string,
            postalCode?: string,
            location?: {
                lat: number,
                lng: number
            },
            isDefault?: boolean,
        }
    ): Promise<Response> {
        try {
            const userAddress = await this.repository.findOne({ user: user.id as string });
            
            if (!userAddress || !userAddress.addressList[updateData.addressIndex]) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }

            // کامنت: اعتبارسنجی آدرس (فقط فیلدهای به‌روزرسانی شده)
            const addressToUpdate = userAddress.addressList[updateData.addressIndex] as any;
            const validationData: any = {
                province: updateData.province || addressToUpdate.province,
                city: updateData.city || addressToUpdate.city,
                postalCode: updateData.postalCode || addressToUpdate.postalCode,
                location: updateData.location || addressToUpdate.location,
                receiver: updateData.receiver || addressToUpdate.receiver,
                details: updateData.details || addressToUpdate.details,
            };

            const validationResult = this.addressValidationService.validateAddress(validationData);

            // کامنت: اگر خطاهای جدی وجود دارد، درخواست را رد می‌کنیم
            if (!validationResult.isValid) {
                return {
                    status: 400,
                    message: "خطا در اعتبارسنجی آدرس",
                    data: {
                        errors: validationResult.errors,
                        warnings: validationResult.warnings,
                    },
                };
            }

            // کامنت: اگر هشدار وجود دارد، به کاربر اطلاع می‌دهیم اما ادامه می‌دهیم
            if (validationResult.warnings.length > 0) {
                console.warn("هشدارهای اعتبارسنجی آدرس:", validationResult.warnings);
            }
            
            // اگر آدرس جدید به عنوان پیش‌فرض تنظیم می‌شود، بقیه را غیرفعال می‌کنیم
            if (updateData.isDefault === true) {
                userAddress.addressList.forEach((addr: any, idx) => {
                    if (idx !== updateData.addressIndex) {
                        addr.isDefault = false;
                    }
                });
            }

            // اعمال تغییرات
            Object.assign(addressToUpdate, {
                ...updateData,
                updatedAt: new Date(),
            });

            await this.repository.editById(userAddress._id, {
                $set: { addressList: userAddress.addressList }
            });

            return {
                status: 200,
                message: "آدرس با موفقیت بروزرسانی شد",
                data: {
                    address: userAddress,
                    validation: {
                        warnings: validationResult.warnings,
                    },
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * توضیح فارسی: حذف یک آدرس خاص از لیست آدرس‌های کاربر. index آدرس در addressList باید ارسال شود.
     */
    @Delete("/", {
        loginRequired: true,
    })
    async deleteAddress(
        @User() user: UserInfo,
        @Body({
            schema: z.object({
                addressIndex: z.number().int().min(0), // ایندکس آدرس در addressList
            }),
        })
        deleteData: {
            addressIndex: number,
        }
    ): Promise<Response> {
        try {
            const userAddress = await this.repository.findOne({ user: user.id as string });
            
            if (!userAddress || !userAddress.addressList[deleteData.addressIndex]) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }

            const addressToDelete = userAddress.addressList[deleteData.addressIndex] as any;
            const wasDefault = addressToDelete.isDefault;

            // حذف آدرس از لیست
            userAddress.addressList.splice(deleteData.addressIndex, 1);

            // اگر آدرس حذف شده پیش‌فرض بود و آدرس دیگری وجود دارد، اولین آدرس را پیش‌فرض می‌کنیم
            if (wasDefault && userAddress.addressList.length > 0) {
                (userAddress.addressList[0] as any).isDefault = true;
            }

            await this.repository.editById(userAddress._id, {
                $set: { addressList: userAddress.addressList }
            });

            return {
                status: 200,
                message: "آدرس با موفقیت حذف شد"
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * توضیح فارسی: تنظیم یک آدرس خاص به عنوان پیش‌فرض. index آدرس در addressList باید ارسال شود.
     */
    @Put("/default", {
        loginRequired: true,
    })
    async setDefaultAddress(
        @User() user: UserInfo,
        @Body({
            schema: z.object({
                addressIndex: z.number().int().min(0), // ایندکس آدرس در addressList
            }),
        })
        defaultData: {
            addressIndex: number,
        }
    ): Promise<Response> {
        try {
            const userAddress = await this.repository.findOne({ user: user.id as string });
            
            if (!userAddress || !userAddress.addressList[defaultData.addressIndex]) {
                return {
                    status: 404,
                    message: "آدرس مورد نظر یافت نشد"
                };
            }

            // همه آدرس‌ها را غیرفعال می‌کنیم
            userAddress.addressList.forEach(addr => {
                addr.isDefault = false;
            });

            // آدرس انتخاب شده را پیش‌فرض می‌کنیم
            userAddress.addressList[defaultData.addressIndex].isDefault = true;

            await this.repository.editById(userAddress._id, {
                $set: { addressList: userAddress.addressList }
            });

            return {
                status: 200,
                message: "آدرس پیش‌فرض با موفقیت تنظیم شد",
                data: userAddress
            };
        } catch (error) {
            throw error;
        }
    }
}

const address = new AddressController("/address", new AddressRepository(), {
    insertSchema: z.object({
        addressList: z.array(
            z.object({
                title: z.string(),
                receiver: z.object({
                    name: z.string(),
                    family: z.string(),
                    phoneNumber: z.string()
                }),
                country: z.string(),
                province: z.string(),
                city: z.string(),
                district: z.string(),
                street: z.string(),
                details: z.string(),
                postalCode: z.string(),
                location: z.object({
                    lat: z.number(),
                    lng: z.number()
                }).optional(),
                // isDefault: z.boolean().optional().default(false),
            }),
        ),
    }),
});
export default address;
