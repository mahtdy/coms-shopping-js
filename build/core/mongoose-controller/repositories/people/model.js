"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleModel = void 0;
const mongoose_1 = require("mongoose");
const peopleSchema = new mongoose_1.Schema({
    // fields
    nameAndFamily: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "address"
    },
    info: {
        type: Object,
        required: false
    },
    isReal: {
        type: Boolean,
        required: true,
        default: true
    }
});
exports.PeopleModel = (0, mongoose_1.model)("people", peopleSchema);
