---
title: Astro Pure 主题完整语法测试
description: 全面测试 Markdown、Obsidian、AnyBlock 和代码高亮的兼容效果
publishDate: 2025-10-06T00:00:00Z
draft: true
tags:
  - 测试
  - Markdown
  - Obsidian
  - AnyBlock
  - 语法
  - 代码高亮
heroImage:
  src: ./syntax-test/test.jpeg
  alt: an image targetting my article
  color: " #F2E1CD "
---
	
# Astro Pure 主题完整语法测试

> 本文用于同时验证网站渲染和 Obsidian 预览。

## 1. 基础 Markdown

**粗体文本**、*斜体文本*、~~删除线文本~~、`行内代码`

这是 ==高亮文本== 的示例。%%这段注释在网站里不应该出现。%%

- 无序列表
- 第二项

1. 有序列表
2. 第二项

## 2. Callout 与折叠块

> [!tip] 普通提示
> 这是一个普通的 callout，用于测试网站和 Obsidian 的双端显示。

> [!warning]- 折叠提示
> 这是一个默认折叠的 callout。
>
> - 支持列表
> - 支持 **加粗**
> - 支持 `行内代码`

## 3. Tabs

::: tabs

@tab JavaScript

```javascript title="hello.js"
const message = 'Hello from JavaScript';
console.log(message); // [!code highlight]
```

@tab Python

```python title="hello.py"
message = "Hello from Python"
print(message)
```

@tab TypeScript

```typescript title="hello.ts"
const message: string = 'Hello from TypeScript!';
console.log(message)
```

:::

## 4. Timeline

[timeline]

- 2025-10-04
  开始整理博客内容与写作规范。

- 2025-10-05
  完成主题配置、域名配置与首批文章迁移。

- 2025-10-06
  补齐 Obsidian / 网站双端兼容语法测试。

## 5. Card

[card]

- FXJ Wiki
  个人博客主页，保留项目介绍与文章索引。

- Docs
  技术文档站点，用于沉淀说明文档和搭建记录。

- Notes
  学习笔记集合，方便后续拆分到独立知识库。

## 6. 图片、链接与 Obsidian 语法

标准 Markdown 图片：

![[syntax-test/test.jpeg#pic_center|420]]

Markdown 链接：[访问 FXJ Wiki](https://fxj.wiki)

Obsidian 链接：[[interview-operating-system|操作系统文章]]

Obsidian 嵌入：![[interview-computer-network]]

## 7. 数学公式与代码

行内公式：$E = mc^2$

块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

```diff title="deploy.sh"
bun check
bun lint
bun format # [!code ++]
bun run build # [!code --]
git push
```

## 8. 总结

这篇文章应当验证：

- 网站可以识别 Obsidian callout
- 网站可以渲染 AnyBlock 高频语法
- Obsidian 可以直接预览同一份 Markdown
- 代码块标题、数学公式、图片尺寸与对齐都能正常工作
