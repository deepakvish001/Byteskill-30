/**
 * Site configuration object for Byteskill.
 */
export const siteConfig = {
  name: "ByteSkill",
  description:
    "ByteSkill is your go-to resource for high-quality articles, tutorials, and insights on web development, software engineering, and data science. Level up your skills with expert content.",
  url: "https://www.byteskill.com", // Replace with your actual domain
  domain: "byteskill.com", // Add your base domain here (used for 'from' email)
  ogImage: "/og-image.png", // Path to your Open Graph image
  links: {
    twitter: "https://twitter.com/byteskill", // Replace with your Twitter
    github: "https://github.com/byteskill", // Replace with your GitHub
  },
  titleTemplate: "%s | ByteSkill",
  defaultTitle: "ByteSkill - Sharpen Your Tech Skills",
  keywords: [
    "web development",
    "software engineering",
    "data science",
    "programming",
    "tutorials",
    "tech articles",
    "byteskill",
    "javascript",
    "python",
    "react",
    "next.js",
  ],
  email: "your-feedback-email@example.com", // User-facing email for mailto links (if any)
  feedbackRecipientEmail: "your-actual-receiving-email@example.com", // Email address to receive feedback submissions
} as const // Using "as const" for better type inference if all values are literals

export type SiteConfig = typeof siteConfig
