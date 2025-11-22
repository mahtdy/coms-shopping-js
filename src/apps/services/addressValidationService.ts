/**
 * توضیح فارسی: سرویس اعتبارسنجی آدرس
 * این سرویس آدرس‌ها را از نظر فرمت، مختصات، کد پستی و ... اعتبارسنجی می‌کند.
 */

/**
 * توضیح فارسی: استان‌های ایران
 */
const IRAN_PROVINCES = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
];

/**
 * توضیح فارسی: محدوده مختصات جغرافیایی ایران
 */
const IRAN_BOUNDS = {
  minLat: 25.0,
  maxLat: 40.0,
  minLng: 44.0,
  maxLng: 63.5,
};

/**
 * توضیح فارسی: نتیجه اعتبارسنجی
 */
export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * توضیح فارسی: اطلاعات آدرس برای اعتبارسنجی
 */
export interface AddressValidationInput {
  province?: string;
  city?: string;
  postalCode?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  receiver?: {
    phoneNumber?: string;
  };
  details?: string;
}

/**
 * توضیح فارسی: سرویس اعتبارسنجی آدرس
 */
export default class AddressValidationService {
  /**
   * توضیح فارسی: اعتبارسنجی کامل آدرس
   */
  validateAddress(address: AddressValidationInput): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // کامنت: اعتبارسنجی استان
    if (address.province) {
      const provinceValid = this.validateProvince(address.province);
      if (!provinceValid.isValid) {
        errors.push(...provinceValid.errors);
      }
    } else {
      errors.push("استان الزامی است.");
    }

    // کامنت: اعتبارسنجی شهر
    if (address.city) {
      if (address.city.length < 2) {
        errors.push("نام شهر باید حداقل 2 کاراکتر باشد.");
      }
    } else {
      errors.push("شهر الزامی است.");
    }

    // کامنت: اعتبارسنجی کد پستی
    if (address.postalCode) {
      const postalCodeValid = this.validatePostalCode(address.postalCode);
      if (!postalCodeValid.isValid) {
        errors.push(...postalCodeValid.errors);
      }
    } else {
      warnings.push("کد پستی توصیه می‌شود.");
    }

    // کامنت: اعتبارسنجی مختصات جغرافیایی
    if (address.location) {
      const locationValid = this.validateLocation(address.location);
      if (!locationValid.isValid) {
        errors.push(...locationValid.errors);
        warnings.push(...locationValid.warnings);
      }
    } else {
      warnings.push("مختصات جغرافیایی توصیه می‌شود برای محاسبه دقیق‌تر هزینه ارسال.");
    }

    // کامنت: اعتبارسنجی شماره تلفن گیرنده
    if (address.receiver?.phoneNumber) {
      const phoneValid = this.validatePhoneNumber(address.receiver.phoneNumber);
      if (!phoneValid.isValid) {
        errors.push(...phoneValid.errors);
      }
    } else {
      errors.push("شماره تلفن گیرنده الزامی است.");
    }

    // کامنت: اعتبارسنجی جزئیات آدرس
    if (address.details) {
      if (address.details.length < 10) {
        warnings.push("جزئیات آدرس باید کامل‌تر باشد.");
      }
    } else {
      warnings.push("جزئیات آدرس توصیه می‌شود.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * توضیح فارسی: اعتبارسنجی استان
   */
  validateProvince(province: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!province || province.trim().length === 0) {
      errors.push("استان نمی‌تواند خالی باشد.");
      return { isValid: false, errors, warnings };
    }

    // کامنت: بررسی وجود استان در لیست استان‌های ایران
    const normalizedProvince = province.trim();
    const isProvinceValid = IRAN_PROVINCES.some(
      (p) => p === normalizedProvince || p.includes(normalizedProvince) || normalizedProvince.includes(p)
    );

    if (!isProvinceValid) {
      warnings.push(`استان "${province}" در لیست استان‌های ایران یافت نشد. لطفاً بررسی کنید.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * توضیح فارسی: اعتبارسنجی کد پستی
   * فرمت کد پستی ایران: 10 رقم
   */
  validatePostalCode(postalCode: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!postalCode) {
      return { isValid: true, errors, warnings }; // کامنت: کد پستی اختیاری است
    }

    // کامنت: حذف فاصله و خط تیره
    const cleaned = postalCode.replace(/[\s-]/g, "");

    // کامنت: بررسی طول
    if (cleaned.length !== 10) {
      errors.push("کد پستی باید 10 رقم باشد.");
      return { isValid: false, errors, warnings };
    }

    // کامنت: بررسی اینکه فقط عدد باشد
    if (!/^\d+$/.test(cleaned)) {
      errors.push("کد پستی باید فقط شامل اعداد باشد.");
      return { isValid: false, errors, warnings };
    }

    // کامنت: بررسی الگوی کد پستی ایران (5 رقم اول: منطقه، 5 رقم دوم: کد پستی)
    const firstPart = cleaned.substring(0, 5);
    const secondPart = cleaned.substring(5);

    // کامنت: 5 رقم اول نباید همه صفر باشند
    if (firstPart === "00000") {
      warnings.push("کد پستی وارد شده ممکن است نامعتبر باشد.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * توضیح فارسی: اعتبارسنجی مختصات جغرافیایی
   */
  validateLocation(location: { lat?: number; lng?: number }): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!location.lat || !location.lng) {
      errors.push("هر دو مختصات lat و lng باید ارائه شوند.");
      return { isValid: false, errors, warnings };
    }

    // کامنت: بررسی محدوده مختصات ایران
    if (location.lat < IRAN_BOUNDS.minLat || location.lat > IRAN_BOUNDS.maxLat) {
      warnings.push(
        `عرض جغرافیایی (${location.lat}) خارج از محدوده ایران است. محدوده معتبر: ${IRAN_BOUNDS.minLat} تا ${IRAN_BOUNDS.maxLat}`
      );
    }

    if (location.lng < IRAN_BOUNDS.minLng || location.lng > IRAN_BOUNDS.maxLng) {
      warnings.push(
        `طول جغرافیایی (${location.lng}) خارج از محدوده ایران است. محدوده معتبر: ${IRAN_BOUNDS.minLng} تا ${IRAN_BOUNDS.maxLng}`
      );
    }

    // کامنت: بررسی اینکه مختصات عدد معتبر باشند
    if (isNaN(location.lat) || isNaN(location.lng)) {
      errors.push("مختصات باید عدد معتبر باشند.");
      return { isValid: false, errors, warnings };
    }

    // کامنت: بررسی محدوده معتبر مختصات (lat: -90 تا 90, lng: -180 تا 180)
    if (location.lat < -90 || location.lat > 90) {
      errors.push("عرض جغرافیایی باید بین -90 تا 90 باشد.");
    }

    if (location.lng < -180 || location.lng > 180) {
      errors.push("طول جغرافیایی باید بین -180 تا 180 باشد.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * توضیح فارسی: اعتبارسنجی شماره تلفن ایران
   * فرمت: 09xxxxxxxxx (11 رقم، شروع با 09)
   */
  validatePhoneNumber(phoneNumber: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!phoneNumber) {
      errors.push("شماره تلفن الزامی است.");
      return { isValid: false, errors, warnings };
    }

    // کامنت: حذف فاصله، خط تیره و پرانتز
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // کامنت: بررسی شروع با 0
    if (!cleaned.startsWith("0")) {
      errors.push("شماره تلفن باید با 0 شروع شود.");
    }

    // کامنت: بررسی شروع با 09 (موبایل)
    if (!cleaned.startsWith("09")) {
      warnings.push("شماره تلفن باید با 09 شروع شود (شماره موبایل).");
    }

    // کامنت: بررسی طول (11 رقم برای موبایل)
    if (cleaned.length !== 11) {
      errors.push("شماره تلفن موبایل باید 11 رقم باشد.");
    }

    // کامنت: بررسی اینکه فقط عدد باشد
    if (!/^\d+$/.test(cleaned)) {
      errors.push("شماره تلفن باید فقط شامل اعداد باشد.");
    }

    // کامنت: بررسی الگوی شماره موبایل (09xxxxxxxxx)
    if (cleaned.startsWith("09") && cleaned.length === 11) {
      const operatorCode = cleaned.substring(2, 4);
      // کامنت: کدهای اپراتور معتبر: 90, 91, 92, 93, 94, 99
      const validOperators = ["90", "91", "92", "93", "94", "99"];
      if (!validOperators.includes(operatorCode)) {
        warnings.push(`کد اپراتور "${operatorCode}" ممکن است نامعتبر باشد.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * توضیح فارسی: اعتبارسنجی جزئیات آدرس
   */
  validateAddressDetails(details: string): AddressValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!details) {
      warnings.push("جزئیات آدرس توصیه می‌شود.");
      return { isValid: true, errors, warnings };
    }

    if (details.length < 10) {
      warnings.push("جزئیات آدرس باید حداقل 10 کاراکتر باشد.");
    }

    if (details.length > 500) {
      warnings.push("جزئیات آدرس نباید بیشتر از 500 کاراکتر باشد.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * توضیح فارسی: دریافت لیست استان‌های ایران
   */
  getIranProvinces(): string[] {
    return [...IRAN_PROVINCES];
  }

  /**
   * توضیح فارسی: بررسی اینکه آیا مختصات در محدوده ایران است
   */
  isLocationInIran(lat: number, lng: number): boolean {
    return (
      lat >= IRAN_BOUNDS.minLat &&
      lat <= IRAN_BOUNDS.maxLat &&
      lng >= IRAN_BOUNDS.minLng &&
      lng <= IRAN_BOUNDS.maxLng
    );
  }
}

