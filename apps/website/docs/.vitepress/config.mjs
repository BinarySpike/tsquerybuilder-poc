import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

export default defineConfig({
  title: "TopHeavy",
  description: "Query Builder and Type Validation Library",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/README' }
    ],
    sidebar: generateSidebar({
      documentRootPath: 'docs',
      useTitleFromFileHeading: true,
      useTitleFromFrontmatter: true,
      excludePattern: ['index.md'],
      collapseDepth: 2
    })
  }
})
