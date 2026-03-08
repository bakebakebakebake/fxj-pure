export type Locale = 'zh' | 'en'

export const DEFAULT_LOCALE: Locale = 'zh'
export const ENGLISH_PREFIX = '/en'

export const localeLabels: Record<Locale, string> = {
  zh: '中文',
  en: 'English'
}

export const localeMeta: Record<
  Locale,
  { htmlLang: string; ogLocale: string; dateLocale: string }
> = {
  zh: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    dateLocale: 'zh-CN'
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    dateLocale: 'en-US'
  }
}

export const ui = {
  zh: {
    nav: {
      home: '首页',
      blog: '博客',
      about: '关于',
      projects: '项目',
      links: '友链',
      search: '搜索'
    },
    common: {
      back: '返回',
      more: '更多',
      viewAll: '查看全部',
      viewMore: '查看更多',
      language: '语言',
      sourceCode: '源码',
      readInEnglish: 'English',
      readInChinese: '中文'
    },
    home: {
      title: '首页',
      about: '关于我',
      posts: '最新文章',
      education: '教育经历',
      websiteList: 'Website List',
      skills: 'Skills Label',
      moreAbout: '更多关于我',
      morePosts: '更多文章',
      role: 'Developer / ACMer',
      introLines: [
        '一位小菜鸡，正在学习中...',
        '西南石油大学就读于计算机科学与技术专业。',
        '就业方向在后端开发方向。',
        '我的兴趣主要是在算法竞赛/数学/优化/理解本质上。'
      ]
    },
    blog: {
      title: '博客',
      description: '博客文章与归档',
      noPosts: '还没有文章。',
      pageSummary: (current: number, size: number, total: number) =>
        `第 ${current} 页 · 当前显示 ${size} 篇，共 ${total} 篇`,
      viewArchives: '查看年度归档 →',
      tags: '标签',
      viewTags: '查看全部 →',
      prev: '← 上一页',
      next: '下一页 →',
      placeholderTitle: '英文版尚未发布',
      placeholderDescription: 'This post has not been translated into English yet.'
    },
    archives: {
      title: '归档',
      description: '按年份查看博客归档',
      noPosts: '还没有文章。'
    },
    tags: {
      title: '标签',
      description: '全部标签',
      empty: '还没有标签。'
    },
    search: {
      title: '搜索',
      description: '搜索博客内容',
      intro: '输入关键词开始搜索。',
      disabled: 'Pagefind 已关闭。'
    },
    about: {
      title: '关于',
      hobbies: '兴趣',
      tools: '工具',
      socialNetworks: '社交媒体',
      gossips: '随便聊聊',
      aboutBlog: '关于博客',
      websiteServices: '站点服务说明',
      futureServices: '未来服务规划'
    },
    projects: {
      title: '项目'
    },
    links: {
      title: '友链'
    },
    terms: {
      title: '站点政策',
      description: '站点政策说明'
    },
    notFound: {
      title: '页面未找到',
      subtitle: '抱歉，我们找不到这个页面。',
      backHome: '回到首页'
    },
    footer: {
      credits: '基于 Astro 构建，主题改造自 astro-theme-pure'
    }
  },
  en: {
    nav: {
      home: 'Home',
      blog: 'Blog',
      about: 'About',
      projects: 'Projects',
      links: 'Links',
      search: 'Search'
    },
    common: {
      back: 'Back',
      more: 'More',
      viewAll: 'View all',
      viewMore: 'View more',
      language: 'Language',
      sourceCode: 'Source code',
      readInEnglish: 'English',
      readInChinese: '中文'
    },
    home: {
      title: 'Home',
      about: 'About',
      posts: 'Latest Posts',
      education: 'Education',
      websiteList: 'Website List',
      skills: 'Skills',
      moreAbout: 'More about me',
      morePosts: 'More posts',
      role: 'Developer / ACMer',
      introLines: [
        'Backend-oriented developer, ACM participant, and note-heavy learner.',
        'I study Computer Science and Technology at Southwest Petroleum University.',
        'I care a lot about algorithms, systems, and understanding how things really work.',
        'This site is my long-term knowledge base and writing space.'
      ]
    },
    blog: {
      title: 'Blog',
      description: 'Posts and archives from FXJ Wiki',
      noPosts: 'No posts yet.',
      pageSummary: (current: number, size: number, total: number) =>
        `Page ${current} · Showing ${size} of ${total} posts`,
      viewArchives: 'View yearly archives →',
      tags: 'Tags',
      viewTags: 'View all →',
      prev: '← Previous Posts',
      next: 'Next Posts →',
      placeholderTitle: 'English version is coming soon',
      placeholderDescription: 'This post is available in Chinese now. The English version will be added later.'
    },
    archives: {
      title: 'Archives',
      description: 'Yearly blog archives',
      noPosts: 'No posts yet.'
    },
    tags: {
      title: 'Tags',
      description: 'All tags',
      empty: 'No tags yet.'
    },
    search: {
      title: 'Search',
      description: 'Search the blog',
      intro: 'Enter a search term or phrase to search the site.',
      disabled: 'Pagefind is disabled.'
    },
    about: {
      title: 'About',
      hobbies: 'Focus',
      tools: 'Tools',
      socialNetworks: 'Social Networks',
      gossips: 'Notes',
      aboutBlog: 'About Blog',
      websiteServices: 'Current Site Services',
      futureServices: 'Planned Services'
    },
    projects: {
      title: 'Projects'
    },
    links: {
      title: 'Links'
    },
    terms: {
      title: 'Site Policy',
      description: 'Site policy documentation'
    },
    notFound: {
      title: 'Oops, something went wrong.',
      subtitle: "Sorry, we couldn't find your page.",
      backHome: 'Back to home'
    },
    footer: {
      credits: 'Built with Astro, customized from astro-theme-pure'
    }
  }
} as const

export function getLocaleFromPathname(pathname: string): Locale {
  return pathname === ENGLISH_PREFIX || pathname.startsWith(`${ENGLISH_PREFIX}/`) ? 'en' : 'zh'
}

export function stripLocalePrefix(pathname: string) {
  if (pathname === ENGLISH_PREFIX) return '/'
  if (pathname.startsWith(`${ENGLISH_PREFIX}/`)) return pathname.slice(ENGLISH_PREFIX.length)
  return pathname
}

export function withLocalePath(locale: Locale, pathname: string) {
  if (locale === 'zh') return stripLocalePrefix(pathname)
  const normalized = stripLocalePrefix(pathname)
  return normalized === '/' ? ENGLISH_PREFIX : `${ENGLISH_PREFIX}${normalized}`
}

export function getLocaleMeta(locale: Locale) {
  return localeMeta[locale]
}

export function t(locale: Locale) {
  return ui[locale]
}

export function isEnglishContent(language?: string) {
  if (!language) return false
  return /^(en|english)\b/i.test(language.trim())
}
