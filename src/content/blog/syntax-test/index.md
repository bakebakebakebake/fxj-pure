---
title: 'Astro Pure 主题语法测试'
description: '测试 Markdown、Obsidian 与 AnyBlock 的基础语法功能'
publishDate: '2025-10-06T00:00:00Z'
draft: true
tags: ['测试', 'Markdown', 'Obsidian', '语法']
heroImage: { src: './test.jpeg', alt: 'an image targetting my article', color: '#E63946' }
---

# Astro Pure 主题语法测试

> 本文用于验证基础兼容语法。

## 1. 文本与列表

**粗体文本** 和 *斜体文本* 以及 `行内代码`

- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2

1. 第一项
2. 第二项
3. 第三项

## 2. 提示块

> [!note] 普通提示
> 这是一个说明性质的提示块。

> [!tip]- 折叠提示
> 这里测试折叠 callout 的显示效果。

## 3. Tabs

::: tabs

@tab 站点

- 保持 Astro 构建效果
- 保持代码高亮

@tab Obsidian

- 使用同一份 Markdown
- 依赖 AnyBlock 预览 tabs

:::

## 4. 时间线

[timeline]

- 准备
  先统一语法，确保内容层没有 JSX 依赖。

- 迁移
  批量把文章改成 Markdown。

- 验证
  在网站和 Obsidian 中分别检查渲染结果。

## 5. 图片与链接

![[test.jpeg#pic_center|360]]

[[interview-computer-network|查看网络文章]]

## 6. 代码与数学

```javascript title="demo.js"
function greet(name) {
  return `Hello, ${name}`;
}
```

行内公式：$a^2 + b^2 = c^2$
