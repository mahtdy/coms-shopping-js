"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentNoteModel = void 0;
const mongoose_1 = require("mongoose");
const commentNoteSchema = new mongoose_1.Schema({
    user: {
        type: String,
        required: true,
    },
    notes: {
        type: [new mongoose_1.Schema({
                text: String,
                create: {
                    type: Date,
                    default: () => new Date()
                },
                admin: {
                    type: mongoose_1.Types.ObjectId,
                    required: false,
                    ref: "admin"
                }
            })],
        required: true
    }
});
exports.CommentNoteModel = (0, mongoose_1.model)("comment-note", commentNoteSchema);
