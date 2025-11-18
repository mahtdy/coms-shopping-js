"use strict";
// import CdnLogRepository from "./repository/cdnLog"
// import CdnLog from '../database/models/cdnLog';
// async function addCdnLog(options: CdnLog_I) {
//     try {
//         await new CdnLogRepository().insert({
//             cdn: options.cdn,
//             type: options.type,
//             files: options.files,
//             operation: options.operation,
//             info: options.info
//         } as unknown as CdnLog)
//     } catch (error) {
//         console.log("error")
//         return
//         throw error
//     }
// }
// function addFilesInfo(filesInfo: any, files: string[]) {
//     for (let i = 0; i < files.length; i++) {
//         var type = path.extname(files[i]).substring(1)
//         if (filesInfo[type]) {
//             try {
//                 filesInfo[type].count += 1
//             } catch (error) { }
//             continue
//         }
//         filesInfo[type] = {
//             count: 1,
//             mimetype: filesType[type] || type
//         }
//     }
//     return filesInfo
// }
// function deleteFilesInfo(filesInfo: any, files: string[]) {
//     for (let i = 0; i < files.length; i++) {
//         var type = path.extname(files[i]).substring(1)
//         if (filesInfo[type] && filesInfo[type].count && filesInfo[type].count > 0) {
//             try {
//                 filesInfo[type].count -= 1
//             } catch (error) { }
//         }
//     }
//     return filesInfo
// }
// async function UpdateCdnConfig(cdnMg: CDN_Manager, query: any, files?: string[]) {
//     try {
//         await cdnMg.fileManagerRepo.updateOne({
//             _id: cdnMg.CDN_id
//         }, query)
//         if (files) {
//             try {
//                 var fileManager = await cdnMg.fileManagerRepo.findById(cdnMg.CDN_id as string)
//                 if (fileManager != null) {
//                     var info: any = fileManager.filesInfo || {}
//                     if (query['$inc']?.usedSize > 0) {
//                         info = addFilesInfo(info, files)
//                     }
//                     else {
//                         info = deleteFilesInfo(info, files)
//                     }
//                     await cdnMg.fileManagerRepo.updateOne({
//                         _id: cdnMg.CDN_id
//                     }, {
//                         $set: {
//                             filesInfo: info
//                         }
//                     })
//                 }
//             } catch (error) {
//             }
//         }
//     } catch (error) {
//     }
// }
// function processCDN_Upload(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as CDN_Manager;
//         try {
//             if (typeof args[0] == 'string') {
//                 var paths = [args[0]]
//             }
//             else {
//                 var paths = args[0] as string[]
//             }
//             try {
//                 var totalSize = await DiskFileManager.getFilesSize(paths.map((elem: any, i: any) => {
//                     return elem.path
//                 }))
//                 totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100
//             } catch (error) {
//                 totalSize = 0
//             }
//             var result = await originalMethod.apply(this, args);
//             try {
//                 var newFiles = result.map((elem: string, i: any) => {
//                     return elem.substring(self.cdn?.baseDir?.length || 9, elem.length)
//                 })
//             } catch (error) {
//             }
//             try {
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: totalSize
//                     }
//                 }, newFiles)
//                 await addCdnLog({
//                     cdn: self.CDN_id as string,
//                     files: newFiles,
//                     operation: 'upload',
//                     type: self.storageType as string,
//                     info: {}
//                 })
//             } catch (error) {
//                 console.log(error)
//                 // throw error
//                 // console.log(error)
//             }
//             return result;
//         } catch (err) {
//             console.log(err)
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
// function processCDN_Directory(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as CDN_Manager;
//         try {
//             var result = await originalMethod.apply(this, args);
//             if (typeof args[0] == 'string') {
//                 var paths = [args[0]]
//             }
//             else {
//                 var paths = args[0] as string[]
//             }
//             try {
//                 await addCdnLog({
//                     cdn: self.CDN_id as string,
//                     files: [args[0] + args[1]],
//                     operation: 'createDirectory',
//                     type: self.storageType as string,
//                     info: {}
//                 })
//             } catch (error) {
//                 console.log(error)
//                 // throw error
//                 // console.log(error)
//             }
//             return result;
//         } catch (err) {
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
// function processCDN_Delete(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as CDN_Manager;
//         try {
//             var folderPath = args[0]
//             var info: any = {}
//             if (args[1] != false) {
//                 info['moveToHidden'] = true
//                 var result = await originalMethod.apply(this, args);
//                 await addCdnLog({
//                     cdn: self.CDN_id as string,
//                     files: folderPath,
//                     operation: 'delete',
//                     type: self.storageType as string,
//                     info
//                 })
//                 return result
//             }
//             var totalSize = await self.cdn?.getFilesSize(folderPath) as number
//             var totalFiles = await self.cdn?.getAllFiles(folderPath)
//             totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100
//             var allFiles = []
//             var result = await originalMethod.apply(this, args);
//             try {
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: -totalSize
//                     }
//                 }, totalFiles)
//                 await addCdnLog({
//                     cdn: self.CDN_id as string,
//                     files: folderPath,
//                     operation: 'delete',
//                     type: self.storageType as string,
//                     info: {}
//                 })
//             } catch (error) {
//                 // console.log(error)
//             }
//             return result;
//         } catch (err) {
//             // console.log(err)
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
// function processCDN_Copy_Move(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as CDN_Manager;
//         try {
//             var folderPath = args[0]
//             var totalSize = propertyKey != 'move' ? await self.cdn?.getFilesSize(folderPath) as number : 0
//             var totalfiles = propertyKey != 'move' ? await self.cdn?.getAllFiles(folderPath) as string[] : []
//             totalSize = Math.round(totalSize / Math.pow(1024, 2) * 100) / 100
//             var currentCDN = self.CDN_id
//             var result = await originalMethod.apply(this, args);
//             var info: any = {}
//             var operation
//             if (propertyKey == 'copy') {
//                 operation = 'copy'
//                 info['directory'] = args[1]
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: totalSize
//                     }
//                 }, totalfiles)
//             }
//             else if (propertyKey == 'move') {
//                 operation = 'move'
//                 info['directory'] = args[1]
//             }
//             else if (propertyKey == 'copyToOther') {
//                 operation = 'copyToOther'
//                 info['directory'] = args[2]
//                 info['toCdn'] = args[1]
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: totalSize
//                     }
//                 }, totalfiles)
//                 var cdn_id = self.CDN_id
//                 // self.CDN_id = currentCDN
//             }
//             else {
//                 operation = 'moveToOther'
//                 info['directory'] = args[2]
//                 info['toCdn'] = args[1]
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: totalSize
//                     }
//                 }, totalfiles)
//                 self.CDN_id = currentCDN
//                 await self.init(true)
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: -totalSize
//                     }
//                 }, totalfiles)
//             }
//             try {
//                 await addCdnLog({
//                     cdn: cdn_id || self.CDN_id as string,
//                     files: folderPath,
//                     operation,
//                     type: self.storageType as string,
//                     info
//                 })
//             } catch (error) {
//                 // throw error
//                 // console.log(error)
//             }
//             return result;
//         } catch (err) {
//             // console.log(err)
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
// function processCDN_Zip(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as CDN_Manager;
//         try {
//             var files = args[0]
//             var result = await originalMethod.apply(this, args);
//             try {
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: Math.round(result[1] / Math.pow(1024, 2) * 100) / 100
//                     }
//                 }, [result[0].substring(self.cdn?.baseDir.length || 0, result[0].length)])
//                 await addCdnLog({
//                     cdn: self.CDN_id as string,
//                     files: [result[0].substring(self.cdn?.baseDir.length || 0, result[0].length)],
//                     operation: "zip",
//                     type: self.storageType as string,
//                     info: {
//                         files
//                     }
//                 })
//             } catch (error) {
//                 // throw error
//                 // console.log(error)
//             }
//             return result;
//         } catch (err) {
//             // console.log(err)
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
// function processCDN_UnZip(target: any,
//     propertyKey: string,
//     propertyDescriptor: PropertyDescriptor
// ): PropertyDescriptor {
//     propertyDescriptor = propertyDescriptor;
//     const originalMethod = propertyDescriptor.value;
//     propertyDescriptor.value = async function (...args: any[]) {
//         const self = this as CDN_Manager;
//         try {
//             var file = args[0]
//             var directory = args[1]
//             var result = await originalMethod.apply(this, args);
//             var newFiles = result[0].map((elem: string, i: any) => {
//                 return elem.substring(self.cdn?.baseDir.length || 0, elem.length)
//             })
//             try {
//                 await UpdateCdnConfig(self, {
//                     $inc: {
//                         usedSize: Math.round(result[1] / Math.pow(1024, 2) * 100) / 100
//                     }
//                 }, newFiles)
//                 await addCdnLog({
//                     cdn: self.CDN_id as string,
//                     files: newFiles,
//                     operation: "unzip",
//                     type: self.storageType as string,
//                     info: {
//                         file,
//                         directory
//                     }
//                 })
//             } catch (error) {
//                 // throw error
//                 // console.log(error)
//             }
//             return result;
//         } catch (err) {
//             // console.log(err)
//             throw err;
//         }
//     };
//     return propertyDescriptor;
// }
