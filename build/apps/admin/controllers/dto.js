"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteSchema = void 0;
const zod_1 = require("zod");
const noteSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string()
});
exports.noteSchema = noteSchema;
