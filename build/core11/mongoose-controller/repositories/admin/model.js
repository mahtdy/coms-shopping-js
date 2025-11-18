"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSchema = void 0;
const mongoose_1 = require("mongoose");
// const dbschema = new Schema({
//     collectionName: {
//         type: String,
//         required: true,
//         enum: [
//             "user",
//             "service",
//             "servicePrivider",
//             "admin"
//         ],
//     },
//     collectionSchema: {
//         type: Object,
//         required: true,
//         default: undefined
//     },
//     persianName: {
//         type: String,
//         required: true
//     },
//     subPart: {
//         type: String,
//         required: true
//     }
// }, { _id: false })
const addressSchema = new mongoose_1.Schema({
    x: {
        type: Number,
        required: true,
        // validate: function (value: number) {
        //     if (!isValidCoordinates.latitude(value)) {
        //         throw new Error("مختصات وارد شده نامعتبر است");
        //     }
        // },
    },
    y: {
        type: Number,
        required: true,
        // validate: function (value: number) {
        //     if (!isValidCoordinates.longitude(value)) {
        //         throw new Error("مختصات وارد شده نامعتبر است");
        //     }
        // },
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
        //https://github.com/ahmadazizi/iran-cities/tree/master/releases/v2.0
    },
    address: {
        type: String,
        required: true,
    },
    unit: {
        type: Number,
        required: true,
        min: 0
    },
    plaque: {
        type: String,
        required: true,
    },
}, { _id: false });
exports.adminSchema = {
    isSuperAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    role: {
        type: mongoose_1.Types.ObjectId,
        required: function () {
            return !this.isSuperAdmin;
        },
        ref: "role"
    },
    admins: {
        type: [mongoose_1.Types.ObjectId],
        required: true,
        default: []
    },
    name: {
        type: String,
        required: true,
    },
    familyName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    isEmailRegistered: {
        type: Boolean,
        required: true,
        default: false
    },
    newEmail: {
        type: String
    },
    emailHash: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    phoneRegistered: {
        type: Boolean,
        required: true,
        default: false
    },
    userName: {
        required: true,
        type: String,
        unique: true
    },
    password: {
        required: true,
        type: String
    },
    passwordLastChange: {
        type: Date,
        required: true,
        default: () => {
            return new Date(Date.now());
        }
    },
    passwords: {
        type: [String],
        requierd: true,
        default: []
    },
    validIPList: {
        required: true,
        type: [String]
    },
    createAt: {
        type: Date,
        required: true,
        default: () => {
            return new Date(Date.now());
        }
    },
    lastLogIn: {
        required: false,
        type: Date
    },
    towFactorLogIn: {
        type: Boolean,
        required: true,
        default: false
    },
    towFactorEnable: {
        type: Boolean,
        required: true,
        default: false
    },
    secretIMG: {
        type: String,
        required: false
    },
    towFactorTocken: {
        type: String,
        required: false
    },
    changePassword: {
        type: Boolean,
        required: true,
        default: true
    },
    securityQuestion: {
        type: new mongoose_1.Schema({
            question: {
                type: String,
                required: true
            },
            answer: {
                type: String,
                required: false
            }
        }),
        required: false
    },
    address: {
        type: addressSchema,
        required: [false, "آدرس وارد نشده است"]
    },
    department: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "department"
    },
    profile: {
        type: String,
        required: false
    },
    maxSize: {
        type: Number,
        required: false
    }
};
