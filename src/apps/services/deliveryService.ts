import Order from "../../repositories/admin/order/model";
import Package, { PackageModel } from "../../repositories/admin/package/model";
import Courier from "../../repositories/admin/courier/model";
import Address from "../../repositories/admin/address/model";
import OrderRepository from "../../repositories/admin/order/repository";
import PackageRepository from "../../repositories/admin/package/repository";
import CourierRepository from "../../repositories/admin/courier/repository";
import AddressRepository from "../../repositories/admin/address/repository";
import OrderStatusService from "./orderStatusService";
import { Types } from "mongoose";

/**
 * توضیح فارسی: سرویس مدیریت ارسال و پیک
 * این سرویس مسئولیت ایجاد بسته، تخصیص پیک و مدیریت وضعیت ارسال را بر عهده دارد.
 */
export default class DeliveryService {
    private orderRepo: OrderRepository;
    private packageRepo: PackageRepository;
    private courierRepo: CourierRepository;
    private addressRepo: AddressRepository;
    private orderStatusService: OrderStatusService;

    constructor() {
        this.orderRepo = new OrderRepository();
        this.packageRepo = new PackageRepository();
        this.courierRepo = new CourierRepository();
        this.addressRepo = new AddressRepository();
        this.orderStatusService = new OrderStatusService();
    }

    /**
     * توضیح فارسی: ایجاد بسته از سفارش
     * پس از ثبت سفارش، این متد بسته ارسالی را ایجاد می‌کند.
     */
    async createPackageFromOrder(order: Order): Promise<Package> {
        // کامنت: بررسی وجود آدرس در سفارش
        if (!order.address) {
            throw {
                status: 400,
                message: "آدرس ارسال برای سفارش مشخص نشده است.",
            };
        }

        // کامنت: دریافت اطلاعات آدرس
        const address = await this.addressRepo.findById(order.address as string);
        if (!address) {
            throw {
                status: 404,
                message: "آدرس ارسال یافت نشد.",
            };
        }

        // کامنت: یافتن آدرس پیش‌فرض یا اولین آدرس از لیست
        const deliveryAddress = address.addressList.find(addr => addr.isDefault) || address.addressList[0];
        if (!deliveryAddress) {
            throw {
                status: 400,
                message: "هیچ آدرس معتبری برای ارسال یافت نشد.",
            };
        }

        // کامنت: تولید کد رهگیری
        const trackingCode = this.generateTrackingCode(order._id as string);

        // کامنت: ایجاد بسته
        const packageData: Partial<Package> = {
            order: order._id as Types.ObjectId,
            recipientName: `${deliveryAddress.receiver.name} ${deliveryAddress.receiver.family}`,
            recipientPhone: deliveryAddress.receiver.phoneNumber,
            destination: {
                lat: deliveryAddress.location?.lat || 0,
                lng: deliveryAddress.location?.lng || 0,
                address: `${deliveryAddress.country}, ${deliveryAddress.province}, ${deliveryAddress.city}, ${deliveryAddress.street}, ${deliveryAddress.details}`,
            },
            status: "pending",
            trackingCode,
        };

        const packageDoc = await this.packageRepo.insert(packageData as Package);

        // کامنت: به‌روزرسانی سفارش با اطلاعات بسته و وضعیت ارسال
        await this.orderRepo.editById(order._id as string, {
            $set: {
                package: packageDoc._id,
                deliveryStatus: "preparing",
            },
        });

        return packageDoc;
    }

    /**
     * توضیح فارسی: تخصیص بسته به پیک
     * این متد بسته را به یک پیک تخصیص می‌دهد.
     */
    async assignPackageToCourier(
        packageId: string,
        courierId: string
    ): Promise<{ package: Package; courier: Courier }> {
        // کامنت: بررسی وجود بسته
        const packageDoc = await this.packageRepo.findById(packageId);
        if (!packageDoc) {
            throw {
                status: 404,
                message: "بسته یافت نشد.",
            };
        }

        // کامنت: بررسی وضعیت بسته
        if (packageDoc.status !== "pending") {
            throw {
                status: 400,
                message: `بسته در وضعیت "${packageDoc.status}" است و نمی‌توان آن را تخصیص داد.`,
            };
        }

        // کامنت: بررسی وجود پیک
        const courier = await this.courierRepo.findById(courierId);
        if (!courier) {
            throw {
                status: 404,
                message: "پیک یافت نشد.",
            };
        }

        // کامنت: بررسی وضعیت پیک
        if (courier.status !== "available") {
            throw {
                status: 400,
                message: `پیک در وضعیت "${courier.status}" است و نمی‌توان بسته را به او تخصیص داد.`,
            };
        }

        // کامنت: به‌روزرسانی بسته
        const updatedPackage = await this.packageRepo.editById(packageId, {
            $set: {
                courier: new Types.ObjectId(courierId),
                status: "assigned",
                assignedAt: new Date(),
            },
        });

        // کامنت: به‌روزرسانی وضعیت سفارش
        if (packageDoc.order) {
            await this.orderRepo.editById(packageDoc.order as string, {
                $set: {
                    deliveryStatus: "assigned",
                },
            });
            // کامنت: همگام‌سازی وضعیت سفارش با وضعیت ارسال
            try {
                await this.orderStatusService.syncStatusWithDelivery(packageDoc.order as string);
            } catch (error: any) {
                console.error("خطا در همگام‌سازی وضعیت سفارش:", error);
            }
        }

        // کامنت: به‌روزرسانی وضعیت پیک (در صورت نیاز)
        // می‌توانید منطق پیچیده‌تری برای مدیریت ظرفیت پیک اضافه کنید

        return {
            package: updatedPackage as Package,
            courier,
        };
    }

    /**
     * توضیح فارسی: تخصیص خودکار بسته به نزدیک‌ترین پیک
     * این متد نزدیک‌ترین پیک را پیدا کرده و بسته را به او تخصیص می‌دهد.
     */
    async autoAssignPackage(packageId: string): Promise<{ package: Package; courier: Courier }> {
        const packageDoc = await this.packageRepo.findById(packageId);
        if (!packageDoc) {
            throw {
                status: 404,
                message: "بسته یافت نشد.",
            };
        }

        // کامنت: یافتن نزدیک‌ترین پیک در دسترس
        const nearestCourier = await this.findNearestAvailableCourier(
            packageDoc.destination.lat,
            packageDoc.destination.lng
        );

        if (!nearestCourier) {
            throw {
                status: 404,
                message: "هیچ پیک در دسترسی یافت نشد.",
            };
        }

        return this.assignPackageToCourier(packageId, nearestCourier._id as string);
    }

    /**
     * توضیح فارسی: یافتن نزدیک‌ترین پیک در دسترس
     */
    private async findNearestAvailableCourier(lat: number, lng: number): Promise<Courier | null> {
        // کامنت: در حال حاضر ساده‌ترین روش: اولین پیک در دسترس
        // در آینده می‌توان از GeoJSON queries استفاده کرد
        const availableCouriers = await this.courierRepo.find({
            status: "available",
        });

        if (availableCouriers.length === 0) {
            return null;
        }

        // کامنت: در حال حاضر اولین پیک را برمی‌گردانیم
        // TODO: محاسبه فاصله و انتخاب نزدیک‌ترین
        return availableCouriers[0] as Courier;
    }

    /**
     * توضیح فارسی: به‌روزرسانی وضعیت بسته
     */
    async updatePackageStatus(
        packageId: string,
        status: Package["status"],
        notes?: string
    ): Promise<Package> {
        const updateData: any = {
            status,
        };

        if (status === "delivered") {
            updateData.deliveredAt = new Date();
        }

        if (notes) {
            updateData.notes = notes;
        }

        const updatedPackage = await this.packageRepo.editById(packageId, {
            $set: updateData,
        });

        // کامنت: به‌روزرسانی وضعیت سفارش
        if (updatedPackage?.order) {
            const orderStatusMap: Record<Package["status"], Order["deliveryStatus"]> = {
                pending: "pending",
                assigned: "assigned",
                in_transit: "in_transit",
                delivered: "delivered",
                failed: "failed",
            };

            await this.orderRepo.editById(updatedPackage.order as string, {
                $set: {
                    deliveryStatus: orderStatusMap[status],
                },
            });
            // کامنت: همگام‌سازی وضعیت سفارش با وضعیت ارسال
            try {
                await this.orderStatusService.syncStatusWithDelivery(updatedPackage.order as string);
            } catch (error: any) {
                console.error("خطا در همگام‌سازی وضعیت سفارش:", error);
            }
        }

        return updatedPackage as Package;
    }

    /**
     * توضیح فارسی: رهگیری بسته با کد رهگیری (پیشرفته)
     */
    async trackPackage(trackingCode: string): Promise<{
        package: Package | null;
        order?: Order;
        courier?: Courier;
        estimatedDeliveryTime?: Date;
        route?: {
            currentLocation?: { lat: number; lng: number };
            destination: { lat: number; lng: number };
            distance?: number; // فاصله به کیلومتر
        };
        statusHistory?: Array<{
            status: Package["status"];
            timestamp: Date;
            notes?: string;
        }>;
    }> {
        const packageDoc = await this.packageRepo.findOne({ trackingCode });

        if (!packageDoc) {
            return { package: null };
        }

        let order: Order | undefined;
        let courier: Courier | undefined;

        if (packageDoc.order) {
            order = await this.orderRepo.findById(packageDoc.order as string);
        }

        if (packageDoc.courier) {
            courier = await this.courierRepo.findById(packageDoc.courier as string);
        }

        // کامنت: محاسبه تخمین زمان تحویل
        let estimatedDeliveryTime: Date | undefined;
        if (packageDoc.status === "in_transit" && packageDoc.assignedAt) {
            // کامنت: فرض می‌کنیم زمان تحویل معمولاً 2-4 ساعت بعد از تخصیص است
            const estimatedHours = 3; // می‌توان از تنظیمات یا محاسبه فاصله استفاده کرد
            estimatedDeliveryTime = new Date(
                packageDoc.assignedAt.getTime() + estimatedHours * 60 * 60 * 1000
            );
        } else if (packageDoc.status === "delivered" && packageDoc.deliveredAt) {
            estimatedDeliveryTime = packageDoc.deliveredAt;
        }

        // کامنت: محاسبه مسیر و فاصله
        let route: {
            currentLocation?: { lat: number; lng: number };
            destination: { lat: number; lng: number };
            distance?: number;
        } | undefined;

        if (packageDoc.destination) {
            route = {
                destination: {
                    lat: packageDoc.destination.lat,
                    lng: packageDoc.destination.lng,
                },
            };

            // کامنت: اگر پیک تخصیص داده شده و موقعیت فعلی دارد
            if (courier && (courier as any).currentLocation) {
                route.currentLocation = {
                    lat: (courier as any).currentLocation.lat,
                    lng: (courier as any).currentLocation.lng,
                };

                // کامنت: محاسبه فاصله
                if (route.currentLocation) {
                    const dx = route.destination.lat - route.currentLocation.lat;
                    const dy = route.destination.lng - route.currentLocation.lng;
                    // کامنت: تقریب ساده (Haversine دقیق‌تر است اما اینجا برای سرعت)
                    route.distance = Math.sqrt(dx * dx + dy * dy) * 111; // تقریب به کیلومتر
                }
            }
        }

        // کامنت: تاریخچه وضعیت (از timestamps موجود در package)
        const statusHistory: Array<{
            status: Package["status"];
            timestamp: Date;
            notes?: string;
        }> = [];

        if (packageDoc.assignedAt) {
            statusHistory.push({
                status: "assigned",
                timestamp: packageDoc.assignedAt,
                notes: "بسته به پیک تخصیص داده شد",
            });
        }

        if (packageDoc.status === "in_transit") {
            statusHistory.push({
                status: "in_transit",
                timestamp: packageDoc.assignedAt || new Date(),
                notes: "بسته در حال ارسال است",
            });
        }

        if (packageDoc.deliveredAt) {
            statusHistory.push({
                status: "delivered",
                timestamp: packageDoc.deliveredAt,
                notes: "بسته تحویل داده شد",
            });
        }

        // کامنت: مرتب‌سازی بر اساس تاریخ
        statusHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        return {
            package: packageDoc,
            order,
            courier,
            estimatedDeliveryTime,
            route,
            statusHistory,
        };
    }

    /**
     * توضیح فارسی: به‌روزرسانی خودکار وضعیت بسته (برای استفاده در cron job)
     */
    async autoUpdatePackageStatus(): Promise<void> {
        // کامنت: دریافت بسته‌های در حال ارسال که بیش از 24 ساعت در این وضعیت هستند
        const packages = await this.packageRepo.find({
            status: "in_transit",
            assignedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });

        for (const pkg of packages) {
            // کامنت: بررسی اینکه آیا باید به delivered تغییر وضعیت دهد
            // در اینجا می‌توان منطق پیچیده‌تری اضافه کرد
            // مثلاً بررسی موقعیت پیک و مقایسه با مقصد
            try {
                await this.updatePackageStatus(pkg._id.toString(), "delivered", "تحویل خودکار پس از 24 ساعت");
            } catch (error) {
                console.error(`خطا در به‌روزرسانی خودکار بسته ${pkg._id}:`, error);
            }
        }
    }

    /**
     * توضیح فارسی: تولید کد رهگیری
     */
    private generateTrackingCode(orderId: string): string {
        // کامنت: تولید کد رهگیری منحصر به فرد
        const timestamp = Date.now().toString(36).toUpperCase();
        const orderHash = orderId.slice(-6).toUpperCase();
        return `TRK-${timestamp}-${orderHash}`;
    }

    /**
     * توضیح فارسی: دریافت لیست بسته‌های یک پیک
     */
    async getCourierPackages(courierId: string, status?: Package["status"]): Promise<Package[]> {
        const filter: any = { courier: courierId };
        if (status) {
            filter.status = status;
        }

        return this.packageRepo.find(filter) as Promise<Package[]>;
    }

    /**
     * توضیح فارسی: دریافت لیست بسته‌های یک سفارش
     */
    async getOrderPackages(orderId: string): Promise<Package[]> {
        return this.packageRepo.find({ order: orderId }) as Promise<Package[]>;
    }
}

