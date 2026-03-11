# FXJ Wiki

English | [简体中文](./README-zh-CN.md)

Personal blog source for [fxj.wiki](https://fxj.wiki/), built on Astro and customized from `astro-theme-pure`.

## Overview

FXJ Wiki is a bilingual personal site focused on:

- blog posts
- interview and systems notes
- algorithm writeups
- personal tools and workflow experiments

This repository is no longer a generic theme template. It is the actual source code of the deployed site, including content, custom pages, bilingual blog routing, and self-hosted service links.

## Site

- Main site: [fxj.wiki](https://fxj.wiki/)
- English site: [fxj.wiki/en](https://fxj.wiki/en)
- Status page: [status.fxj.wiki](https://status.fxj.wiki/)
- OneDrive Share: [onedrive.fxj.wiki](https://onedrive.fxj.wiki/)

## Highlights

- Bilingual blog structure for Chinese and English content
- Custom About and homepage sections
- Math rendering with KaTeX
- Obsidian-style Markdown and callouts
- Full-text search powered by Pagefind
- RSS, sitemap, SEO metadata, and Open Graph images
- Waline comments and pageview support
- Vercel deployment with Astro server output

## Stack

- Astro 5
- TypeScript
- `astro-pure`
- UnoCSS
- Waline
- Vercel

## Content Structure

Key content directories:

- `src/content/blog`: Chinese blog posts
- `src/content/blog/en`: English blog posts
- `src/content/pic`: shared hero images and article assets
- `src/pages`: custom pages such as home, about, tags, and archives

For blog posts, the common pattern is:

```text
src/content/blog/<slug>/index.md
src/content/blog/en/<slug>/index.md
```

This keeps URLs clean and makes it easy to colocate images with each article when needed.

## Local Development

Requirements:

- Node.js `22.x`
- npm or bun

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Useful commands:

```bash
npm run build
npm run preview
npm run check
npm run clean
```

## Deployment

Production is deployed on Vercel.

The project uses Astro's Vercel adapter and builds in server mode. Static assets, generated search indexes, and content collections are all part of the normal production build.

## Credits

- [Astro](https://astro.build/)
- [astro-theme-pure / astro-pure](https://github.com/cworld1/astro-theme-pure)
- [Waline](https://waline.js.org/)
- [Pagefind](https://pagefind.app/)

## License

This repository follows the [Apache 2.0 License](./LICENSE).
