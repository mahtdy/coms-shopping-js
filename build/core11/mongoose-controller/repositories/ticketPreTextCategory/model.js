"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPreTextCategoryModel = void 0;
const mongoose_1 = require("mongoose");
var ObjectId = mongoose_1.Types.ObjectId;
const ticketPreTextCategorySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
});
exports.TicketPreTextCategoryModel = (0, mongoose_1.model)('ticketPreTextCategory', ticketPreTextCategorySchema);
