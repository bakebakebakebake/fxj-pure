# FXJ Wiki

[English](./README.md) | 简体中文

[fxj.wiki](https://fxj.wiki/) 的个人博客源码，基于 Astro 构建，并在 `astro-theme-pure` 基础上进行了较多定制。

## 项目简介

FXJ Wiki 是一个中英双语的个人站点，当前主要承载：

- 博客文章
- 面试与系统笔记
- 算法题解与思考记录
- 个人工具链与工作流实验

这个仓库已经不是单纯的主题模板，而是当前线上站点的实际源码，包含内容、页面定制、双语博客路由，以及个人服务入口。

## 站点地址

- 主站：[fxj.wiki](https://fxj.wiki/)
- 英文站：[fxj.wiki/en](https://fxj.wiki/en)
- 状态页：[status.fxj.wiki](https://status.fxj.wiki/)
- OneDrive 分享站：[onedrive.fxj.wiki](https://onedrive.fxj.wiki/)

## 当前特性

- 中英双语博客结构
- 自定义首页与 About 页面
- KaTeX 数学公式渲染
- Obsidian 风格 Markdown 与 Callout 支持
- 基于 Pagefind 的全文搜索
- RSS、Sitemap、SEO 元数据与分享图
- Waline 评论与阅读量统计
- 基于 Vercel 的 Astro 服务端部署

## 技术栈

- Astro 5
- TypeScript
- `astro-pure`
- UnoCSS
- Waline
- Vercel

## 内容结构

主要内容目录如下：

- `src/content/blog`：中文博客
- `src/content/blog/en`：英文博客
- `src/content/pic`：共享封面图与文章图片
- `src/pages`：首页、About、标签页、归档页等自定义页面

博客文章目前主要采用这种组织方式：

```text
src/content/blog/<slug>/index.md
src/content/blog/en/<slug>/index.md
```

这样可以让 URL 更简洁，也便于把文章资源和正文放在统一结构下管理。

## 本地开发

环境要求：

- Node.js `22.x`
- npm 或 bun

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

常用命令：

```bash
npm run build
npm run preview
npm run check
npm run clean
```

## 部署

生产环境部署在 Vercel。

项目使用 Astro 的 Vercel adapter，以 server 模式构建；静态资源、Pagefind 搜索索引和内容集合都会在正常构建流程里一起生成。

## 鸣谢

- [Astro](https://astro.build/)
- [astro-theme-pure / astro-pure](https://github.com/cworld1/astro-theme-pure)
- [Waline](https://waline.js.org/)
- [Pagefind](https://pagefind.app/)

## 许可证

本仓库遵循 [Apache 2.0 License](./LICENSE)。
