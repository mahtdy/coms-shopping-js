import {Query, Body, User} from "../../../core/decorators/parameters";
import {Response} from "../../../core/controller";
import {Get, Post, Put, Delete} from "../../../core/decorators/method";

import AddressRepository from "../../../repositories/admin/address/repository";
import BaseController, {
    ControllerOptions,
} from "../../../core/mongoose-controller/controller";
import {UserInfo} from "../../../core/mongoose-controller/auth/user/userAuthenticator";

import Address from "../../../repositories/admin/address/model";
import z from "zod";


export class AddressController extends BaseController<Address> {
    addressRepo: AddressRepository;

    constructor(
        baseRoute: string,
        repo: AddressRepository,
        options?: ControllerOptions
    ) {
        super(baseRoute, repo, options);
        this.addressRepo = new AddressRepository();
    }

    // initApis() {
    //     super.initApis();
    // }


    @Get("/test")

    async test(
        // @User() user: UserInfo,
    ): Promise<Response> {
        console.log("user.id12");

        return {status: 200, message: "Basket updated successfully"};

    }


    /**
     * توضیح فارسی: دریافت تمام آدرس‌های کاربر از طریق توکن احراز هویت.
     */
    @Get("/user", {
        loginRequired: true,
    })
    async getUserAddresses(
        @User() user: UserInfo,
    ): Promise<Response> {
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

    /**
     * توضیح فارسی: افزودن آدرس جدید برای کاربر. اگر اولین آدرس باشد، به صورت پیش‌فرض تنظیم می‌شود.
     */
    @Post("/user", {
        loginRequired: true,
    })
    async addUserAddress(
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
                data: userAddress
            };
        } catch (error) {
            throw error;
        }
    }
    /**
     * توضیح فارسی: ویرایش یک آدرس خاص از لیست آدرس‌های کاربر. index آدرس در addressList باید ارسال شود.
     */
    @Put("/user", {
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

            // به‌روزرسانی آدرس در ایندکس مشخص شده
            const addressToUpdate = userAddress.addressList[updateData.addressIndex] as any;
            
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
                data: userAddress
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * توضیح فارسی: حذف یک آدرس خاص از لیست آدرس‌های کاربر. index آدرس در addressList باید ارسال شود.
     */
    @Delete("/user", {
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

    // جستجوی آدرس‌ها
    @Get("/search", {
        apiDoc: {
            security: [
                {
                    AdminAuth: [],
                },
            ],
        },
    })
    async searchAddresses(
        @Body({
            schema: z.object({
                userId: BaseController.id.optional(),
                province: z.string().optional(),
                city: z.string().optional(),
                postalCode: z.string().optional()
            })
        }) searchParams: any,
        @User() user: UserInfo
    ): Promise<Response> {
        try {
            const query: any = {};

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
        } catch (error) {
            throw error;
        }
    }
}

const address = new AddressController("/address", new AddressRepository(), {
    insertSchema: z.object({
        user: BaseController.id,
        addressList: z.array(
            z.object({
                title: z.string().default('Home'),
                receiver: z.object({
                    name: z.string().default('first name'),
                    family: z.string().default('last name'),
                    phoneNumber: z.string().default('09123456789')
                }),
                country: z.string().default('iran'),
                province: z.string().default('Qazvin'),
                city: z.string().default('Qazvin'),
                district: z.string().default('Qazvin'),
                street: z.string().default('naderi'),
                details: z.string().default('ساختمان 333 پلاک 11'),
                postalCode: z.string().default('3414633222'),
                location: z.object({
                    lat: z.number().optional(),
                    lng: z.number().optional()
                }).optional(),
                // isDefault: z.boolean().optional().default(false),
            }),
        ),
    }),
});
export default address;
