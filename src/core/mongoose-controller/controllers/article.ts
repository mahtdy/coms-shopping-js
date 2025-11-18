import { Response } from "../../controller";
import BaseController, { ControllerOptions } from "../controller";
import Article, { ArticleModel } from "../repositories/article/model";
import ArticleRepository from "../repositories/article/repository";
import CategoryRepository from "../repositories/category/repository";
import ContentRepository, {
  categoryUrlBuilder,
  contentUrlBuilder,
} from "../repositories/content/repository";
import FileManagerConfigRepository from "../repositories/fileManagerConfig/repository";
import SystemConfigRepository from "../repositories/system/repository";
import SeoTaskRepository from "../repositories/seoTask/repository";

import ArcticleContentProccessor from "../../services/articleProccessing";
import ConfigService from "../../services/config";
import * as _ from 'lodash';

import {
  Admin,
  Body,
  Files,
  FromReq,
  Query,
  Req,
  Session,
} from "../../decorators/parameters";
import { AdminInfo } from "../auth/admin/admin-logIn";

import { JSDOM } from "jsdom";
import { z } from "zod";
import CDN_Manager, {
  CDN_File_Path,
  DiskFileManager,
} from "../../services/fileManager";
import path from "path";
import CacheService from "../../cache";
import VideoProccessor from "../../services/videoProccessing";
import Content from "../repositories/content/model";
import ImageProccessesor from "../../services/imageProccessing";
import { Get, Post, Put } from "../../decorators/method";
import { styles } from "../style";
import { BasePageController, seoSchema } from "../basePage/controller";
import AdminRepository from "../repositories/admin/repository";
import { BaseAdmin } from "../repositories/admin/model";
import RedisCache from "../../redis-cache";
import TemplateConfigRepository from "../repositories/templateConfig/repository";
import PublishQueueRepository from "../repositories/publishQueue/repository";
import LanguageRepository from "../repositories/language/repository";
import DomainRepository from "../repositories/domain/repository";
import DomainVideoConfigRepository from "../repositories/domainVideoConfig/repository";
import DomainImageConfigRepository from "../repositories/domainImageConfig/repository";
import { Types } from "mongoose";
import { QueryInfo } from "../repository";
import LanguageCommentRepository from "../repositories/languageComment/repository";

// import { FileManager } from "./fileManager";
// import { Route } from "src/core/application";

// interface ArticelExtra extends Article {
//   mainKeyWord: string;
//   // content :Content
// }


export var excelConfig = {
  title: {
    displayName: "Title",
    headerStyle: styles.headerOdd,
    cellStyle: styles.cellOdd,
    width: 120,
  },
  author: {
    displayName: "Author",
    headerStyle: styles.headerOdd,
    cellStyle: styles.cellOdd,
    width: 120,
  },
  category: {
    displayName: "Category",
    headerStyle: styles.headerEven,
    cellFormat: function (value: any, row: any) {
      return decodeURI(value);
    },
    cellStyle: styles.cellEven,
    width: 400,
  },
  type: {
    displayName: "Type",
    headerStyle: styles.headerOdd,
    cellStyle: styles.cellOdd,
    cellFormat: function (value: any, row: any) {
      return decodeURI(value);
    },
    width: 120,
  },
  comment: {
    displayName: "Comment",
    headerStyle: styles.headerEven,
    cellStyle: styles.cellEven,
    width: 120,
  },
  date: {
    displayName: "Date",
    headerStyle: styles.headerOdd,
    cellStyle: styles.cellOdd,
    width: 120,
  },
};

export var csvConfig = {
  fields: ["title", "author", "category", "type", "comment", "date"],
  fieldNames: ["Title", "Author", "Category", "Type", "Comment", "Date"],
};

export var pdfConfig = {
  path: "src/core/mongoose-controller/pdf.ejs",
  options: {
    height: "90.25in",
    width: "45.5in",
    header: {
      height: "20mm",
    },
    footer: {
      height: "20mm",
    },
    childProcessOptions: {
      env: {
        OPENSSL_CONF: "/dev/null",
      },
    },
  },
  titles: ["Title", "Author", "Category", "Type", "Comment", "Date"],
  dataMap: ["title", "author", "category", "type", "comment", "date"],
};

export var insertSchema = z.object({
  isLandingPage: z.boolean().default(false),
  type: z.enum([
    "general",
    "gallery",
    "video",
    "podcast",
    "category_faq",
    "increamental",
  ]),
  suggestArticles: z.array(
    z.object({
      status: z.boolean(),
      content: BaseController.id
    })).default([]),
  contentType: z.enum(["article", "page"]),
  language: BaseController.id.optional(),
  title: z.string(),
  mainImage: z.string().optional(),
  summary: z.string(),
  content: z.string().optional(),
  files: z.array(z.string()).default([]),
  fileUses: z.array(z.string()).default([]),
  viewMode: z.enum(["public", "forUsers", "private"]),
  viewCategory: BaseController.id.optional(),
  category: BaseController.id.optional(),
  categories: z.array(BaseController.id).default([]),
  isPublished: z.boolean().default(false),
  istop: z.boolean().default(false),
  topDate: z.coerce.date().optional(),
  needProccess: z.boolean().default(false),
  commentStatus: z.boolean().default(false),
  commentShow: z.boolean().default(false),
  commentImportant: z.boolean().default(false),
  publishDate: z.coerce.date().optional(),
  commonQuestions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      publishAt: z.coerce.date().optional(),
      cycle: BaseController.id.optional(),
    })
  ),
  noIndex: z.boolean().default(false),
  seo: seoSchema.optional(),
  social: z
    .array(
      z.object({
        socialName: z.enum(["twitter", "facebook"]),
        title: z.string(),
        description: z.string(),
        image: z.string(),
      })
    )
    .optional(),
  resolutionConfig: z
    .object({
      source: z.string().optional(),
      conf: BaseController.search.optional(),
      deletePrevious: z.boolean().optional(),
      srcChanged: z.boolean().optional()
    })
    .optional(),
  template: BaseController.id.optional(),
  videos: z.array(BaseController.id).optional().default([]),
  video: BaseController.id.optional(),
  Refrences: z.array(z.object({
    title: z.string(),
    url: z.string().url()
  })).optional(),
  tags: z.array(z.string()),
  contentNumber: z.coerce.number().int().positive().optional(),
  contentLanguages: z.array(z.object({
    content: BaseController.id,
    language: BaseController.id
  })).default([])
});

const confRepo = new SystemConfigRepository();

interface ChunkedData {
  chunk: string;
  fileName: string;
  chunkNumber: number;
  isfinished?: boolean;
  language: string
}


const cdnRepo = new FileManagerConfigRepository()
async function getContentCDN() {
  try {
    var conf = await cdnRepo.findOne({
      isDefaultContent: true
    })
    if (conf == null) {
      return ConfigService.getConfig("TEMP_FILEMANAGER")
    }
    return conf

  } catch (error) {
    return ConfigService.getConfig("TEMP_FILEMANAGER")
  }
}

const categoryTranslate: any = {
  "مقاله": "general",
  "ویدیویی": "video",
  "گالری": "gallery",
  "پادکست": "podcast",
  "جامع": "increamental",
}

export class ArticleController extends BasePageController<Article> {
  categoryRepo: CategoryRepository;
  contentRepo: ContentRepository;
  confRepo: SystemConfigRepository;
  cdnRepo: FileManagerConfigRepository;
  languageRepo: LanguageRepository
  domainRepo: DomainRepository
  domainVideoRepo: DomainVideoConfigRepository
  domainImageRepo: DomainImageConfigRepository
  types: any;
  seoTaskRepo: SeoTaskRepository;
  subPart: string;
  cache: CacheService;
  cdn: CDN_Manager;
  templateConfigRepo: TemplateConfigRepository;
  publishQueueRepo: PublishQueueRepository;
  languageCommentRepo: LanguageCommentRepository;
  constructor(
    baseRoute: string,
    repo: ArticleRepository,
    options: ControllerOptions & {
      adminRepo?: AdminRepository<BaseAdmin>;
    }
  ) {
    super(baseRoute, repo, options);
    // this.insertSchema = options.insertSchema
    this.subPart = "content";
    this.categoryRepo = new CategoryRepository();
    this.contentRepo = new ContentRepository();
    this.confRepo = confRepo;
    this.cdnRepo = new FileManagerConfigRepository();
    this.seoTaskRepo = new SeoTaskRepository();
    this.types = {
      general: "عمومی",
      gallery: "گالری",
      video: "ویدیو",
      podcast: "پادکست",
      category_faq: "دسته بندی پرسش و پاسخ",
      increamental: "افزایشی",
    };
    this.cache = new RedisCache("file_managing");
    this.cdn = new CDN_Manager();
    this.templateConfigRepo = new TemplateConfigRepository();
    this.publishQueueRepo = new PublishQueueRepository()
    this.languageRepo = new LanguageRepository()
    this.domainRepo = new DomainRepository()
    this.domainVideoRepo = new DomainVideoConfigRepository()
    this.domainImageRepo = new DomainImageConfigRepository()
    this.languageCommentRepo = new LanguageCommentRepository()
  }


  translateCategory(lst: string[]) {
    let final: string[] = []
    for (let i = 0; i < lst.length; i++) {
      // const element = array[i];
      let key = categoryTranslate[lst[i]]
      if (key) {
        final.push(key)
      }
    }
    return final
  }

  async create(
    data: Article,
    @Admin() admin: AdminInfo
  ): Promise<Response> {
    try {

      var adminPermission = await this.getPermissionData(admin._id);

      if (adminPermission.isSuperAdmin != true) {
        var res = await this.validatePermission({
          permissionData: adminPermission.permission.config,
          dataCheck: [
            {
              compration: "eqaul",
              key: "insert",
              values: true,
            },
          ],
        });
        data = await this.transformData({
          permissionData: adminPermission.permission.config,
          data,
          dataCheck: [
            {
              compration: "eqaul",
              values: true,
              key: "manageSeo",
              targetKey: "seo",
            },
            {
              compration: "eqaul",
              values: true,
              key: "questionManage",
              targetKey: "commonQuestions",
            },
            {
              compration: "eqaul",
              values: true,
              key: "socialManage",
              targetKey: "social",
            },
          ],
        });

        // data[]
        if (adminPermission.permission.config['limitTypes']) {
          let lst = this.translateCategory(adminPermission.permission.config['contentType'] || [])
          if (!lst.includes(data.type)) {
            return {
              status: 401,
              data: [],
              message: "این نوع محتوا در دسترس نیست"
            }
          }
        }

        if (adminPermission.permission.config['limitLanguage']) {

          let index = adminPermission.permission.config['manageLanguage']?.findIndex((el: any) => {
            return el._id == data.language
          })
          if (!index || index == -1) {
            return {
              status: 401,
              data: [],
              message: "این زبان برای محتوا در دسترس نیست"
            }
          }
        }

        if (adminPermission.permission.config['limitCategory']) {

          let index = adminPermission.permission.config['manageCategory']?.findIndex((el: any) => {
            return el._id == data.category
          })
          if (!index || index == -1) {
            return {
              status: 401,
              data: [],
              message: "این دسته‌بندی برای محتوا در دسترس نیست"
            }
          }
        }


        data.author = admin._id;
        var content = data.content;

        // return super.create(data, admin)
      }
      var doc = await this.repository.insert(data);

    } catch (error) {
      throw error;
    }
    try {
      var videos = await ArcticleContentProccessor.proccessVideo(
        new JSDOM(data.content)
      );
    } catch (error) {
      throw error;
    }

    if (videos.count > 0) {
      try {
        // var videosList: Video[] = await this.submitVideosList(videos.values);
        await this.repository.updateOne(
          {
            _id: doc._id,
          },
          {
            $set: {
              // videos: videosList,
            },
          }
        );
      } catch (error) {
        throw error;
      }
      return {
        status: 200,
        data: doc,
      };
    }
    try {
      var ripository = new ArticleRepository({
        model: ArticleModel,
        typeName: "article",
        selectData: {
          type: 1,
          title: 1,
          mainImage: 1,
          author: 1,
          category: 1,
          publishDate: 1,
          insertDate: 1
        },
        sort: {
          "publishDate": {
            show: "زمان انتشار"
          },
          "insertDate": {
            show: "زمان انتشار"
          },
          "view": {
            show: "بازدید"
          }
        }
      });
      await ripository.passVideoProccess(doc._id);
    } catch (error) {
      throw error;
    }
    return {
      status: 200,
      data: doc,
    };
  }


  @Get("/language/validate")
  async vlidateLanguage(
    @Query({
      destination: "language",
      schema: BaseController.id
    }) language: string
  ) {
    try {


      let lang = await this.languageRepo.findById(language)

      if (lang?.domain) {
        var domain = await this.domainRepo.findById(lang.domain as string)
      }
      else {
        var domain = await this.domainRepo.findOne({
          isDefault: true
        })
      }

      let domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id
      })

      let domainVideo = await this.domainVideoRepo.findOne({
        domain: domain?._id
      })
      var insertImage
      if (domainImage == null) {
        insertImage = Object.assign(domain || {}, {
          _id: domain?._id,
          "upload-path": {
            "fileManager": "",
            "path": ""
          },
          "valid-Suffix": [],
          "image-result-Suffixs": [],
          "nonConvert-Suffixs": [],
          "image-addressing": "",
          "convert-main": false,
          "compress-main": false,
          "make-phone-image": true,
          "phone-width": 300,
          "compress-quality": 80,
          "watermark-main": false,
          "main-watermark-config": "",
          "watermark": false,
          "watermark-config": ""
        })
      }

      var insertVideo
      if (domainVideo == null) {
        insertVideo = Object.assign(domain || {}, {
          _id: domain?._id,
          "upload-path": {
            "fileManager": "",
            "path": ""
          },
          "editor-upload-size": {
            "unit": "GB",
            "value": 1
          },
          "download-size": {
            "unit": "GB",
            "value": 1
          },
          "upload-size": {
            "unit": "GB",
            "value": 1
          },
          "save-path": {
            "fileManager": "",
            "path": ""
          },
          "quality-persent": 80,
          "save-paths": [],

          "save-main-source": false,
          "video-result-Suffixs": [],
          "valid-Suffix": [], "save-quality": [],
          "auto-save-quality": false,
          "watermark": false,
          "watermark-config": ""
        })
      }

      return {
        status: 200,
        data: {
          insertImage,
          insertVideo
        }
      }
    }
    catch (error) {
      throw error
    }
    // }
  }

  @Get("/language/comment/validate")
  async validateCommentLanguage(
    @Query({
      destination: "language",
      schema: BaseController.id
    }) language: string
  ) {
    try {
      return {
        data: await this.languageCommentRepo.isExists({
          language
        })
      }
    } catch (error) {
      throw error
    }
  }
  // @Query({

  @Put("")
  async edit(
    @Query({
      destination: "id",
      schema: BaseController.id,
    })
    id: string,
    @Body({
      schema: z.record(z.string(), z.any()),
    })
    data: any,
    @Admin() admin: AdminInfo
  ): Promise<Response> {

    var adminPermission = await this.getPermissionData(admin._id);


    if (adminPermission.isSuperAdmin != true) {
      var res = await this.validatePermission({
        permissionData: adminPermission.permission.config,
        dataCheck: [
          {
            compration: "eqaul",
            key: "insert",
            values: true,
          },
        ],
      });
      if (res == false) {
        return {
          status: 401,
          data: [],
          message: "دسترسی شما محدود می‌باشد"
        }
      }
      data = await this.transformData({
        permissionData: adminPermission.permission.config,
        data,
        dataCheck: [
          {
            compration: "eqaul",
            values: true,
            key: "manageSeo",
            targetKey: "seo",
          },
          {
            compration: "eqaul",
            values: true,
            key: "questionManage",
            targetKey: "commonQuestions",
          },
          {
            compration: "eqaul",
            values: true,
            key: "socialManage",
            targetKey: "social",
          },
        ],
      });

      // data[]
      if (adminPermission.permission.config['limitTypes'] && data.type) {
        let lst = this.translateCategory(adminPermission.permission.config['contentType'] || [])
        if (!lst.includes(data.type)) {

          return {
            status: 401,
            data: [],
            message: "این نوع محتوا در دسترس نیست"
          }
        }
      }

      if (adminPermission.permission.config['limitLanguage'] && data.language) {

        let index = adminPermission.permission.config['manageLanguage']?.findIndex((el: any) => {
          return el._id == data.language
        })
        if (!index || index == -1) {
          return {
            status: 401,
            data: [],
            message: "این زبان برای محتوا در دسترس نیست"
          }
        }
      }

      if (adminPermission.permission.config['limitCategory'] && data.category) {

        let index = adminPermission.permission.config['manageCategory']?.findIndex((el: any) => {
          return el._id == data.category
        })
        if (!index || index == -1) {
          return {
            status: 401,
            data: [],
            message: "این دسته‌بندی برای محتوا در دسترس نیست"
          }
        }
      }


      data.author = admin._id;
      var content = data.content;

      // return super.create(data, admin)
    }

    return this.editById(id, {
      $set: data,
    });
  }

  // async submitVideosList(videos: []): Promise<Video[]> {
  //   var videoSrcs = videos.map((elem: { src: any }) => {
  //     return elem.src;
  //   });
  //   return new Promise(
  //     (
  //       resolve: (arg0: Video[]) => void | PromiseLike<void>,
  //       reject: (arg0: any) => void | PromiseLike<void>
  //     ) => {
  //       request.post(
  //         ConfigService.getConfig("videoServer") + "/videos/toQueue",
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             srcList: videoSrcs,
  //           }),
  //         },
  //         async function (error, response) {
  //           if (error) {
  //             //error
  //             // throw error
  //             return reject(error);
  //           }
  //           var viedoList: Video[] = [];
  //           var data = JSON.parse(response.body).data;
  //           try {
  //             for (let i = 0; i < data.length; i++) {
  //               viedoList.push({
  //                 mainSrc: data[i].src as string,
  //                 _id: data[i]._id,
  //                 isProccessed: false,
  //                 result: [],
  //               } as unknown as Video);
  //             }

  //             return resolve(viedoList);
  //           } catch (error) {
  //             return reject(error);
  //           }
  //         }
  //       );
  //     }
  //   );
  // }

  @Post("/api/admin/content/download", {
    absolute: true,
  })
  async download(
    @Body({
      destination: "link",
      schema: z.string().url(),
    })
    link: string
  ): Promise<Response> {
    try {
      link = decodeURI(link)
      var pp: string = (await DiskFileManager.downloadFile(link)) as string;

      var conf = await this.cdnRepo.findOne({
        isDefaultContent: true,
      });
      if (conf == null)
        return {
          status: 200,
          data: { address: pp },
        };
      var cdn = new CDN_Manager();
      cdn.initFromConfig({
        config: conf.config,
        hostUrl: conf.hostUrl || "",
        id: conf._id,
        type: conf.type,
      });
      var link: string = link;
      if (link.includes("?")) link = link.split("?")[0];
      var dest = "content/" + path.basename(link);
      var url = await cdn.upload(pp, dest);
      return {
        status: 200,
        data: url,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("/api/admin/content/download/direct", {
    absolute: true
  })
  async directDownload(
    @Body({
      destination: "link",
      schema: z.string().url(),
    })
    link: string,
    @Body({
      destination: "contentType",
      schema: z.enum(["video", "image", "document", "sound"])
    }) contentType: "video" | "image" | "sound" | "document",
    // @Body({
    //   destination: "language",



    // })
  ): Promise<Response> {
    try {
      const directory = await ArticleController.getPathResolver(contentType)()

      var conf = await this.cdnRepo.findOne({
        isDefaultContent: true,
        // _id : "647db66e8d8c7c65dce35e18"
      });
      if (conf == null)
        return {
          status: 500,
          data: {},
        };
      var cdn = new CDN_Manager();
      cdn.initFromConfig({
        config: conf.config,
        hostUrl: conf.hostUrl || "",
        id: conf._id,
        type: conf.type,
      });


      return {
        status: 200,
        data: {
          link: await cdn.drirectDownload([decodeURI(link)], directory),
          directory
        }
      }
    } catch (error) {
      throw error
    }

  }

  @Post("/api/admin/content/video/screenshot", {
    absolute: true,
  })
  async videoScreenshot(
    @Query({
      destination: "link",
      schema: z.string().url(),
    })
    link: string,
    @Query({
      destination: "time",
      schema: z.string(),
    })
    time: string
  ): Promise<Response> {
    try {
      var file = await VideoProccessor.screenshot(link, [time]);

      var conf = await this.cdnRepo.findOne({
        isDefaultContent: true,
      });
      if (conf == null)
        return {
          status: 200,
          data: { address: file },
        };
      var cdn = new CDN_Manager();
      cdn.initFromConfig({
        config: conf.config,
        hostUrl: conf.hostUrl || "",
        id: conf._id,
        type: conf.type,
      });
      var dest = (await ArticleController.getPathResolver("image")()) + path.basename(file as string)

      var url = await cdn.upload(ConfigService.getConfig("staticRoute") + "tmp/" + (file as string), dest);
      try {
        await DiskFileManager.removeFile(ConfigService.getConfig("staticRoute") + "tmp/" + (file as string))
      } catch (error) {

      }

      try {
        await this.repository.insureVideoScreenshot(link, url)
      } catch (error) {

      }


      return {
        status: 200,
        data: url,
      };
    } catch (error) {
      throw error;
    }
    //
  }



  @Post("/draft/publish-queue")
  async addPublishQueue(
    @Body({
      schema: insertSchema
    }) data: Article,
    @Admin() admin: AdminInfo,
    @Query({
      destination: "id",
      schema: BaseController.id.optional()
    }) id?: string,
    @Query({
      destination: "isRequest",
      schema: z.enum(["false", "true"]).optional()
    }) isRequest: boolean = false
  ): Promise<Response> {
    try {

      const res = await this.addDraft(data, admin, id)
      data['author'] = admin._id

      let categories = res.data.categories
      categories.push(res.data.category)
      await this.publishQueueRepo.insert({
        language: res.data.language,
        categories,
        type: "content",
        draft: res.data._id,
        author: admin._id,
        isRequest
      } as any)
      return res
    }
    catch (error) {
      throw error
    }
  }

  static getPathResolver(
    contentType: "video" | "image" | "sound" | "document",
    path: string = "content/",
    style?: string,
    contentNumber?: number
  ) {
    return async () => {
      try {
        if (contentType === "video") {
          var staticPath: any = path;
        }
        else if (contentType == "image" && style != undefined) {
          var staticPath: any = path;
        }
        else
          var staticPath = await confRepo.getConfigValue(`${contentType}-folder`);
        let dynamicPathStyle = await confRepo.getConfigValue(
          `${contentType}-folder-dynamic-style`
        );
        return this.getUploadDestination(staticPath, style || dynamicPathStyle, contentNumber);
      } catch (error) {
        throw error;
      }
    };
  }


  @Post("/api/admin/content/video", {
    absolute: true,
    contentType: "multipart/form-data"
  })
  async uploadVideo(
    @Body({
      destination: "video"
    }) video: string,
    @Files({
      destination: "video",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "video"
      },
    }) files: any[],
    @Body({
      destination: "language",
      schema: BaseController.id.optional()
    }) language: string

  ): Promise<Response> {
    try {
      let lang = await this.languageRepo.findById(language)
      if (lang?.domain) {
        var domain = await this.domainRepo.findById(lang.domain as string)
      }
      else {
        var domain = await this.domainRepo.findOne({
          isDefault: true
        })
      }

      let domainVideo = await this.domainVideoRepo.findOne({
        domain: domain?._id
      })
      if (domainVideo == null) {
        return {
          status: 400,
          data: {
            setDomain: true
          }
        }
      }
      let savePath = domainVideo?.["upload-path"]
      var conf = await this.cdnRepo.findById(savePath.fileManager)

      if (conf == null) {
        var conf = await this.cdnRepo.findOne({
          isDefaultContent: true,
          // _id :  (await confRepo.getConfigValue("save-path"))?.fileManager
        });
      }

      if (conf == null)
        return {
          status: 400,
          // data: { "address": pp }
        };

      this.cdn.initFromConfig({
        config: conf.config,
        hostUrl: conf.hostUrl || "",
        id: conf._id,
        type: conf.type,
      });

      var destinationPath = files[0].path.split("/")
      return {
        status: 200,
        data: await this.cdn.uploadWithState(
          files[0].path,
          (await ArticleController.getPathResolver("video")()) +
          destinationPath[destinationPath.length - 1],
        ),
      };
    }
    catch (error) {
      throw error
    }
  }

  async findById(id: string | Types.ObjectId, queryInfo?: QueryInfo | undefined): Promise<Response> {
    return super.findById(id, {
      fromDb: true
    })
  }

  @Post("/api/admin/content/video/small", {
    absolute: true,
    contentType: "multipart/form-data"
  })
  async uploadSmallVideo(
    @Body({
      destination: "video"
    }) video: string,
    @Files({
      destination: "video",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "video"
      },
      moveFilesToCDN: {
        name: "video",
        config: {
          path: ArticleController.getPathResolver("video"),
          customServer: async function () {
            try {
              var cdnRepo = new FileManagerConfigRepository()
              var conf = await cdnRepo.findOne({
                isDefaultContent: true
              })
              if (conf == null) {
                return ConfigService.getConfig("TEMP_FILEMANAGER")
              }
              return conf

            } catch (error) {
              return ConfigService.getConfig("TEMP_FILEMANAGER")
            }
          }
        }
      }
    }) files: any[]
  ): Promise<Response> {
    try {
      return {
        status: 200,
        data: video
      }
    }
    catch (error) {
      throw error
    }
  }


  @Get("/content/video/type")
  async getUploadType(
    @Query({
      destination: "language",
      schema: BaseController.id.optional()
    }) language: string
  ): Promise<Response> {
    try {
      let lang = await this.languageRepo.findById(language)
      // if(lang != null){
      if (lang?.domain) {
        var domain = await this.domainRepo.findById(lang.domain as string)
      }
      else {
        var domain = await this.domainRepo.findOne({
          isDefault: true
        })
      }

      // }
      let domainVideo = await this.domainVideoRepo.findOne({
        domain: domain?._id
      })
      if (domainVideo == null) {
        return {
          status: 400,
          data: {
            setDomain: true
          }
        }
      }
      let savePath = domainVideo?.["upload-path"]
      var conf = await this.cdnRepo.findById(savePath.fileManager)



      if (conf == null) {
        var conf = await this.cdnRepo.findOne({
          isDefaultContent: true
        });
      }

      if (conf == null)
        return {
          status: 400
        };

      return {
        data: Object.assign(domainVideo, { type: conf.type })
      }
    } catch (error) {
      throw error
    }
  }

  @Get("/content/image/type")
  async getImageUploadType(
    @Query({
      destination: "language",
      schema: BaseController.id.optional()
    }) language: string
  ): Promise<Response> {
    try {
      let lang = await this.languageRepo.findById(language)
      // if(lang != null){
      if (lang?.domain) {
        var domain = await this.domainRepo.findById(lang.domain as string)
      }
      else {
        var domain = await this.domainRepo.findOne({
          isDefault: true
        })
      }

      // }
      let domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id
      })
      if (domainImage == null) {
        return {
          status: 400,
          data: {
            setDomain: true
          }
        }
      }


      return {
        data: domainImage["valid-Suffix"]
      }
    } catch (error) {
      throw error
    }
  }


  @Post("/api/admin/content/video/chunked", {
    absolute: true,
    contentType: "multipart/form-data",
  })
  async chunkedUpload(
    @Body({
      schema: z.object({
        chunk: z.string().optional(),
        fileName: z.string(),
        chunkNumber: BaseController.page,
        isfinished: BaseController.booleanFromquery.optional(),
        language: BaseController.id
      }),
    })
    chunked: ChunkedData,
    @Files({
      destination: "chunk",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "chunk",
      },
      mapToBody: true,
    })
    files: any[]
  ): Promise<Response> {
    try {
      let lang = await this.languageRepo.findById(chunked.language)
      if (lang?.domain) {
        var domain = await this.domainRepo.findById(lang.domain as string)
      }
      else {
        var domain = await this.domainRepo.findOne({
          isDefault: true
        })
      }

      let domainVideo = await this.domainVideoRepo.findOne({
        domain: domain?._id
      })
      if (domainVideo == null) {
        return {
          status: 400,
          data: {
            setDomain: true
          }
        }
      }


      let savePath = domainVideo?.["upload-path"]
      var conf = await this.cdnRepo.findById(savePath.fileManager)

      if (conf == null) {
        var conf = await this.cdnRepo.findOne({
          isDefaultContent: true,
          // _id :  (await confRepo.getConfigValue("save-path"))?.fileManager
        });
      }

      if (conf == null)
        return {
          status: 400,
          // data: { "address": pp }
        };
      this.cdn.initFromConfig({
        config: conf.config,
        hostUrl: conf.hostUrl || "",
        id: conf._id,
        type: conf.type,
      });
      // this.get

      return {
        status: 200,
        data: await this.cdn.append(
          files[0].path,
          (await ArticleController.getPathResolver("video", savePath.path)()) +
          chunked.fileName,
          {
            rename: false,
            isFirst: chunked.chunkNumber == 1,
            isfinished: chunked.isfinished
          }
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("/upload/status")
  async getUploadStatus(
    @Query({
      destination: "key",
      schema: z.string(),
    })
    key: string
  ): Promise<Response> {
    try {
      return {
        status: 200,
        data: JSON.parse(await this.cache.get(key)),
      };
    } catch (error) {
      throw error;
    }
  }


  // @Get("/category/validation-config")
  // async 

  @Post("/api/admin/content/document", {
    absolute: true,
    contentType: "multipart/form-data",
  })
  async uploadDocumnet(
    @Body({ destination: "document" }) document: string,
    @Files({
      destination: "document",
      isArray: true,
      schema: z.any().optional(),
      moveFilesToCDN: {
        name: "document",
        config: {
          customServer: getContentCDN,
          path: ArticleController.getPathResolver("document")
        },
      },

      isOptional: true,
      // skip: true,
      config: {
        maxCount: 1,
        name: "document",
        types: [
          "srt",     // SubRip Subtitle
          "sub",     // SubViewer
          "ssa",     // SubStation Alpha
          "ass",     // SubStation Alpha
          "vtt",     // WebVTT
          "txt",     // MicroDVD
          "mpl",     // MPL2
          "stl",     // DVD Studio Pro
          "dfxp"     // DFXP
        ]
      }
    }) files: any[]

  ): Promise<Response> {

    return {
      status: 200,
      data: document
    }
  }


  @Post("/api/admin/content/delete", {
    absolute: true
  })
  async deleteFile(
    @Body({
      destination: "file",
      schema: z.string().url()
    }) file: string
  ): Promise<Response> {
    try {
      await this.cdn.findCdnFromUrl(file)
      await this.cdn.removeFiles([file])
      return {
        status: 200,
        data: {
          ok: true
        }
      }
    } catch (error) {
      throw error
    }
  }


  @Post("/api/admin/content/sound", {
    absolute: true,
    contentType: "multipart/form-data"
  })
  async uploadSound(
    @Body({ destination: "voice" }) voice: string,
    @Files({
      destination: "voice",
      isArray: true,
      schema: z.any().optional(),
      moveFilesToCDN: {
        name: "voice",
        config: {
          customServer: getContentCDN,
          path: ArticleController.getPathResolver("sound")
        },
      },

      isOptional: true,
      // skip: true,
      config: {
        maxCount: 1,
        name: "voice",
        types: [
          "mp3",    // MP3
          "wav",    // WAV
          "aiff",   // AIFF
          "flac",   // FLAC
          "aac",    // AAC
          "ogg",    // OGG
          "m4a",    // M4A
          "wma",    // WMA
          "opus"    // Opus
        ]
      }
    }) files: any[]

  ): Promise<Response> {
    return {
      status: 200,
      data: voice
    }

  }



  @Post("/api/admin/content/base64/save", {
    absolute: true,
  })
  async saveBase64(
    @Body({
      destination: "image",
      schema: z.string(),
    })
    image: string,
    @Body({
      destination: "cdn",
      schema: BaseController.id.optional()
    }) cdnId: string
  ): Promise<Response> {
    try {
      if (cdnId != undefined) {
        var conf = await this.cdnRepo.findOne({
          _id: cdnId
        });
      }
      else {
        var conf = await this.cdnRepo.findOne({
          isDefaultContent: true,
        });
      }
      if (conf == null)
        // return new ApiResponse.SuccessResponse("succsess", { "address": pp }).send(res)
        return {
          status: 400,
          message: "خطا",
        };

      var cdn = new CDN_Manager();
      cdn.initFromConfig({
        config: conf.config,
        hostUrl: conf.hostUrl || "",
        id: conf._id,
        type: conf.type,
      });

      var image: string = await DiskFileManager.saveBase64(image);
      var dest = "content/screenshot/" + path.basename(image);

      return {
        status: 200,
        data: await cdn.upload(image, dest),
      };
    } catch (error) {
      throw error;
    }
  }

  @Post("/seo")
  async addContentSeo(
    @Body({
      schema: seoSchema,
    })
    data: Content
  ): Promise<Response> {
    try {
      var catId: string = "";
      if (data.type == "article") {
        var article = await this.repository.findById(data.id);
        if (article == null)
          return {
            status: 404,
            message: "موردی یافت نشد",
          };
        // data.url = await this.getUrl(req.body.url, req.body.type, article.category as string, article.language as string)
        if (typeof article.category == "string") catId = article.category;
        else {
          catId = article.category._id;
        }
      } else if (data.type == "category") {
        // var cat = await this.categoryRepo.findById(data.id)
        // if (cat == null)
        //     return new ApiResponse.NotFoundResponse("یافت نشد").send(res)
        // var category = cat.parentCategory
        // data.url = await this.getUrl(data.url, data.type, cat.parentCategory as string, data.language as string)
      }

      var doc = await this.contentRepo.insert(data, {
        type: data.type,
        category: catId,
        language: data.language as string,
      });
      return {
        status: 200,
        data: doc,
        message: " عملیات موفق",
      };
    } catch (error) {
      throw error;
    }
  }

  async getUrl(
    url: string,
    type: string,
    catId: string,
    language?: string
  ): Promise<string> {
    try {
      var siteUrlStyle = await this.confRepo.getConf("content-url-style");
      var categoryUrlStyle = await this.confRepo.getConf("category-url-style");

      var content = siteUrlStyle?.value;
      var category = categoryUrlStyle?.value;
      if (type == "content") {
        return await contentUrlBuilder[content](url, catId, language);
      } else if (type == "category") {
        return await categoryUrlBuilder[category](url, catId, language);
      } else {
        return "/";
      }
    } catch (error) {
      throw error;
    }
  }

  @Get("/language/search")
  async searchLanguage(
    @Query({
      destination: "q",
      schema: z.string()
    }) q: string,
    @Admin() admin: AdminInfo,
    @Query({
      destination: "id$nin",
      schema: z.array(BaseController.id).optional()

    }) ids?: string[]
  ): Promise<Response> {

    try {
      let data = await this.getPermissionData(admin._id)
      let isSuperAdmin = false
      let langIds: string[] = []
      if (data.isSuperAdmin) {
        isSuperAdmin = true
      }

      else {
        try {
          let manageLanguage = data.permission.config.manageLanguage.value
          for (let i = 0; i < manageLanguage.length; i++) {

            langIds.push(manageLanguage[i]._id)
          }
        }
        catch (error) {

        }
      }


      let langs: any[] = await this.languageRepo.findMany({
        title: {
          $regex: new RegExp(q)
        },
      }, {}, 1, 10)
      for (let i = 0; i < langs.length; i++) {

        langs[i] = Object.assign(
          {
            "canUse": true
          }, langs[i]._doc)

        langs[i]["canUse"] = isSuperAdmin || langIds.includes(langs[i]._id.toHexString())

      }
      return {
        status: 200,
        data: langs
      }
    } catch (error) {
      throw error
    }

  }


  @Post("/validate")
  async validateCategory(
    @Body({
      destination: "categories",
      schema: z.array(BaseController.id),
    })
    categories: string[],
    @Body({
      destination: "language",
      schema: BaseController.id.optional(),
    })
    language?: string
  ): Promise<Response> {
    try {
      var checkExistsList = await this.doValidateCategory(categories, language);

      return {
        status: 200,
        data: checkExistsList,
      };
    } catch (error) {
      throw error;
    }
  }

  public async doValidateCategory(categories: string[], language?: string) {
    try {
      var notExistsList: string[] = [];
      for (let i = 0; i < categories.length; i++) {
        var isExists = await this.contentRepo.isExists({
          type: "category",
          id: categories[i],
          language,
          categoryLable: "content"
        });
        if (!isExists) notExistsList.push(categories[i]);
      }
      return notExistsList;
    } catch (error) {
      throw error;
    }
  }


  static getUploadDestination(
    staticPath: string,
    dynamicPathStyle: "y" | "y-m" | "y-m-d" | "y-n" | "n" | "y-m-n",
    contentNumber?: number
  ) {
    let secondPart = "";
    let today = new Date();
    switch (dynamicPathStyle) {
      case "y":
        secondPart = today.getFullYear().toString() + "/";
        break;
      case "y-m":
        secondPart =
          today.getFullYear().toString() +
          "/" +
          today.getMonth().toString() +
          "/";
        break;
      case "y-m-d":
        secondPart =
          today.getFullYear().toString() +
          "/" +
          today.getMonth().toString() +
          "/" +
          today.getDate().toString() +
          "/";
        break;
      case "y-n":
        secondPart = today.getFullYear().toString() +
          "/" +
          contentNumber?.toString() +
          "/";
        break;
      case "n":
        secondPart = contentNumber?.toString() + "/";
        break;
      case "y-m-n":
        secondPart =
          today.getFullYear().toString() +
          "/" +
          today.getMonth().toString() +
          "/" +
          contentNumber?.toString() +
          "/";
        break;
      default:
        break;
    }
    return staticPath + secondPart;
  }

  @Post("/api/admin/content/image", {
    contentType: "multipart/form-data",
    absolute: true,
  })
  async proccessImage(
    @Files({
      destination: "upload",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "upload",
        types: ["jpg", "jpeg", "webp", "png", ""],

      },
      mapToBody: true,
    }) files: any[],
    @Body({
      destination: "language",
      schema: BaseController.id
        .default("61079639ab97fc52395831bf")
    }) language: string,
    @Body({
      destination: "contentNumber",
      schema: z.coerce.number().optional()
    }) contentNumber: number,
    @Body({
      destination: "type",
      schema: z.string().optional()
    }) type?: string
  ): Promise<Response> {
    var path = files[0].path;
    if (path == undefined) {
      return {
        status: 400,
        message: "فایل ضمیمه نشده است",
      };
    }


    let lang = await this.languageRepo.findById(language)

    if (lang?.domain) {
      var domain = await this.domainRepo.findById(lang.domain as string)
    }
    else {
      var domain = await this.domainRepo.findOne({
        isDefault: true
      })
    }
    let domainImage: any = null
    if (type != undefined) {
      domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id,
        type
      })
    }

    if (domainImage == null)
      domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id
      })

    if (domainImage == null) {
      return {
        status: 400,
        data: {
          setDomain: true
        }
      }
    }
    let savePath = domainImage?.["upload-path"]
    var conf = await this.cdnRepo.findById(savePath.fileManager)


    if (conf == null) {
      var conf = await this.cdnRepo.findOne({
        isDefaultContent: true
      });
    }

    if (conf == null)
      return {
        status: 400,
        // data: { "address": pp }
      };


    this.cdn.initFromConfig({
      config: conf.config,
      hostUrl: conf.hostUrl || "",
      id: conf._id,
      type: conf.type,
    });

    // this.cdn.upload()

    var destinationPath = files[0].path.split("/")

    // console.log("image", savePath.path, domainImage["image-addressing"], contentNumber)
    try {
      return {
        status: 200,
        data: await this.cdn.upload(
          files[0].path,
          (await ArticleController.getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
          destinationPath[destinationPath.length - 1],
        ),
      };
    } catch (error) {
      console.log(error)
      throw error
    }

  }

  @Post("/api/admin/content/image/replace", {
    absolute: true,
  })
  async replcaeImage(
    @Body({
      schema: z.string(),
      destination: "image"
    }) image: string,
    @Body({
      schema: z.string(),
      destination: "oldImage"
    }) oldImage: string
  ): Promise<Response> {
    try {
      await this.cdn.findCdnFromUrl(oldImage)
      if (this.cdn.cdn?.baseDir == undefined) {
        return {
          status: 400
        }
      }

      let baseDir = oldImage.replace(this.cdn.cdn?.baseDir, "")
      image = await DiskFileManager.downloadFile(image)

      await this.cdn.uploadMany([{
        destination : baseDir,
        path : image
      }], {
        rename : true
      })


    } catch (error) {
      throw error
    }
    return {
      status: 200
    }
  }

  @Post("/api/admin/in-content/image/", {
    contentType: "multipart/form-data",
    absolute: true,
  })
  async proccessInContentImage(
    @Files({
      destination: "upload",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "upload",
        types: ["jpg", "jpeg", "webp", "png", ""],

      },
      mapToBody: true,
    }) files: any[],
    @Body({
      destination: "language",
      schema: BaseController.id
        .default("61079639ab97fc52395831bf")
    }) language: string,
    @Body({
      destination: "contentNumber",
      schema: z.coerce.number().optional()
    }) contentNumber: number,
    @Body({
      destination: "type",
      schema: z.string().optional()
    }) type?: string
  ): Promise<Response> {
    var path = files[0].path;
    if (path == undefined) {
      return {
        status: 400,
        message: "فایل ضمیمه نشده است",
      };
    }


    let lang = await this.languageRepo.findById(language)

    if (lang?.domain) {
      var domain = await this.domainRepo.findById(lang.domain as string)
    }
    else {
      var domain = await this.domainRepo.findOne({
        isDefault: true
      })
    }
    let domainImage: any = null
    if (type != undefined) {
      domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id,
        type
      })
    }

    if (domainImage == null)
      domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id
      })

    if (domainImage == null) {
      return {
        status: 400,
        data: {
          setDomain: true
        }
      }
    }
    let savePath = domainImage?.["upload-path"]
    var conf = await this.cdnRepo.findById(savePath.fileManager)


    if (conf == null) {
      var conf = await this.cdnRepo.findOne({
        isDefaultContent: true
      });
    }

    if (conf == null)
      return {
        status: 400,
        // data: { "address": pp }
      };


    this.cdn.initFromConfig({
      config: conf.config,
      hostUrl: conf.hostUrl || "",
      id: conf._id,
      type: conf.type,
    });

    // this.cdn.upload()

    var destinationPath = files[0].path.split("/")

    // console.log("image", savePath.path, domainImage["image-addressing"], contentNumber)
    try {
      return {
        status: 200,
        data: await this.cdn.upload(
          files[0].path,
          (await ArticleController.getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
          destinationPath[destinationPath.length - 1],
        ),
      };
    } catch (error) {
      console.log(error)
      throw error
    }

  }


  @Post("/api/admin/content/main-image/", {
    contentType: "multipart/form-data",
    absolute: true,
  })
  async proccessMainImage(
    @Files({
      destination: "upload",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "upload",
        types: ["jpg", "jpeg", "webp", "png", ""],

      },
      mapToBody: true,
    }) files: any[],
    @Body({
      destination: "language",
      schema: BaseController.id
        .default("61079639ab97fc52395831bf")
    }) language: string,
    @Body({
      destination: "contentNumber",
      schema: z.coerce.number().optional()
    }) contentNumber: number,
    @Body({
      destination: "type",
      schema: z.string().optional()
    }) type?: string
  ): Promise<Response> {
    var path = files[0].path;
    if (path == undefined) {
      return {
        status: 400,
        message: "فایل ضمیمه نشده است",
      };
    }


    let lang = await this.languageRepo.findById(language)

    if (lang?.domain) {
      var domain = await this.domainRepo.findById(lang.domain as string)
    }
    else {
      var domain = await this.domainRepo.findOne({
        isDefault: true
      })
    }
    let domainImage: any = null
    if (type != undefined) {
      domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id,
        type
      })
    }

    if (domainImage == null)
      domainImage = await this.domainImageRepo.findOne({
        domain: domain?._id
      })

    if (domainImage == null) {
      return {
        status: 400,
        data: {
          setDomain: true
        }
      }
    }
    let savePath = domainImage?.["upload-path"]
    var conf = await this.cdnRepo.findById(savePath.fileManager)


    if (conf == null) {
      var conf = await this.cdnRepo.findOne({
        isDefaultContent: true
      });
    }

    if (conf == null)
      return {
        status: 400,
        // data: { "address": pp }
      };


    this.cdn.initFromConfig({
      config: conf.config,
      hostUrl: conf.hostUrl || "",
      id: conf._id,
      type: conf.type,
    });

    // this.cdn.upload()

    var destinationPath = files[0].path.split("/")

    // console.log("image", savePath.path, domainImage["image-addressing"], contentNumber)
    try {
      return {
        status: 200,
        data: await this.cdn.uploadWithState(
          files[0].path,
          (await ArticleController.getPathResolver("image", savePath.path, domainImage["image-addressing"], contentNumber)()) +
          destinationPath[destinationPath.length - 1],
        ),
      };
    } catch (error) {
      console.log(error)
      throw error
    }

  }
  @Post("/api/admin/content/image/lable", {
    contentType: "multipart/form-data",
    absolute: true,
  })
  async uploadImageWithLable(
    @Body({
      destination: "lable",
      schema: z.string(),
    })
    lable: string,
    @Files({
      destination: "upload",
      schema: z.any().optional(),
      config: {
        maxCount: 1,
        name: "upload",
        types: ["jpg", "jpeg", "webp", "png"],
      },
      mapToBody: true,
    })
    files: any[]
  ) {
    var path = files[0].path;
    if (path == undefined) {
      return {
        status: 400,
        message: "فایل ضمیمه نشده است",
      };
    }
    try {
      var result = await ImageProccessesor.proccess(
        ConfigService.getConfig("staticRoute"),
        path,
        lable
      );
    } catch (error) {
      throw error;
    }
    var finalPaths: CDN_File_Path[] = [];
    var pathToRemove: string[] = [];
    for (let i = 0; i < result.length; i++) {
      var p = result[i].path.split("/");
      pathToRemove.push(result[i].path);
      finalPaths.push({
        path: result[i].path,
        destination: p[p.length - 1],
      });
    }

    var cdn = new CDN_Manager("62259a7787a42e7b8476beb8");

    try {
      var paths = await cdn.uploadMany(finalPaths, {
        rename: false
      });

    } catch (error) {
      throw error;
    }

    return {
      status: 200,
      data: paths[0],
    };
  }

  @Get("/api/admin/content/image/minimum-res", {
    absolute: true,
  })
  async getMinimumResolution(
    @Query({
      destination: "template",
      schema: BaseController.id,
    })
    template: string,
    @Query({
      destination: "language",
      schema: BaseController.id,
    })
    language: string
  ): Promise<Response> {
    try {
      let config = await this.templateConfigRepo.findOne({
        template,
        language,
      });
      if (config == null)
        config = await this.templateConfigRepo.findOne({
          template,
        });
      if (config == null) {
        return {
          status: 400,
          data: {
            setConfig: true,
          },
        };
      }
      for (let i = 0; i < config?.imageConfig.length; i++) {
        if (config?.imageConfig[i].name == "main") {
          return {
            status: 200,
            data: config?.imageConfig[i].resolotion,
          };
        }
      }
      return {
        status: 404,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get("/api/admin/content/image/minimum-res/all", {
    absolute: true,
  })
  async getAllResolution(
    @Query({
      destination: "template",
      schema: BaseController.id,
    })
    template: string,
    @Query({
      destination: "language",
      schema: BaseController.id,
    })
    language: string
  ): Promise<Response> {
    try {
      let config = await this.templateConfigRepo.findOne({
        template,
        language,
      });
      if (config == null)
        config = await this.templateConfigRepo.findOne({
          template,
        });
      if (config == null) {
        return {
          status: 400,
          data: {
            setConfig: true,
          },
        };
      }
      return {
        status: 200,
        data: config.imageConfig,
      };
    } catch (error) {
      throw error;
    }
  }


  @Get("/api/admin/content/number", {
    absolute: true
  })
  async getContentNumber() {
    try {
      let contentNumber = await this.confRepo.getConfigValue("content-number")
      if (contentNumber == undefined) {
        contentNumber = 100
        await this.confRepo.insert({
          key: "content-number",
          lable: "server-config",
          value: contentNumber,
          type: "Number"
        } as any)
      }

      await this.confRepo.updateOne({
        key: "content-number"
      }, {
        $set: {
          value: contentNumber + 1
        }
      })

      return {
        status: 200,
        data: contentNumber
      }

    } catch (error) {
      throw error
    }
  }

  public async dataTransform(dataList: any[]): Promise<any[]> {
    dataList = JSON.parse(JSON.stringify(dataList));
    return dataList.map((elem: any, i: any) => {
      try {
        elem.author = `${elem.author?.name} ${elem.author?.family}`;
        elem.category = elem.category?.title;
        elem.date = elem.insertDate.toLocaleString("fa-IR");
        elem.type = this.types[elem.type];
        elem.comment = 10;
      } catch (error) {
        console.log(error);
      }
      return elem;
    });
  }

  public getSearchList(): Response {
    return {
      status: 200,
      data: this.searchFilters,
    };
  }

  translatedataTableConfig() {

  }

  async getPaginationConfig(@Admin() admin: AdminInfo, @Session() session: any): Promise<Response> {
    let config = _.cloneDeep(this.paginationConfig)
    var adminPermission = await this.getPermissionData(admin._id);

    if (config != undefined)
      config.fields = await (this.adminRepo as any).translateLanguage(config?.fields, this.paginationConfig?.tableLabel, session.language)

    if (adminPermission.isSuperAdmin == true) {
      return {
        status: 200,
        data: config,
      };
    }
    var permission = adminPermission.permission.config;
    if (permission.exportPDF != true) {
      delete config?.exportpdfUrl;
    }
    if (permission.exportExcel != true) {
      delete config?.exportexelUrl;
    }
    if (permission.exportCSV != true) {
      delete config?.exportcsvUrl;
    }

    if (permission.datatableManage != true) {
      if (config) {
        config.canCustomizeTable = false;
      }
    }

    return {
      status: 200,
      data: config,
    };
  }


  public search(page: number, limit: number, reqQuery: any, admin?: any, @Session() session?: any): Promise<Response> {
    // console.log("searchg")
    if (session.language != undefined)
      reqQuery["language$eq"] = session.language
    return super.search(page, limit, reqQuery, admin)
  }

  initApis(): void {
    // this.addRoute("")
    super.initApis();
    // this.addAbsoluteRoute("/draft", "post", this.addDraft.bind(this), {
    //     meta: {
    //         "0": {
    //             index: 0,
    //             source: "body",
    //             schema: z.any()
    //         },
    //         "1": {
    //           index : 1,
    //           source: "admin",
    //         //   schema: z.any()
    //         }
    //     }

    // })

    // this.addRoute("/publish", "post", this.publish.bind(this), {
    //     meta: {
    //         "0": {
    //             index: 0,
    //             source: "body",
    //             schema: this.insertSchema?.optional()
    //         }
    //     }
    // })

    this.addRoute("s/exel", "get", this.exportExcel.bind(this));
    this.addRoute("s/csv", "get", this.exportCSV.bind(this));
    this.addRoute("s/pdf", "get", this.exportPDF.bind(this));
    this.addRouteWithMeta(
      "",
      "get",
      this.findById.bind(this),
      BaseController.findByIdMeta
    );
  }
}
