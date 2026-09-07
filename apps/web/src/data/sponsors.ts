export interface SponsorItem {
  id: string
  name: string
  label: string
  logoUrl: string
  websiteUrl?: string
}

export const sponsorList: SponsorItem[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    label: 'Cursor AI Code Editor',
    logoUrl: '/brand/sponsors/icons8-cursor.svg',
    websiteUrl: 'https://www.cursor.com',
  },
  {
    id: 'claude',
    name: 'Claude',
    label: 'Anthropic Claude AI',
    logoUrl: '/brand/sponsors/icons8-claude.svg',
    websiteUrl: 'https://claude.ai',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    label: 'Google Gemini AI',
    logoUrl: '/brand/sponsors/icons8-gemini-ai.svg',
    websiteUrl: 'https://gemini.google.com',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    label: 'OpenAI ChatGPT',
    logoUrl: '/brand/sponsors/icons8-chatgpt.svg',
    websiteUrl: 'https://openai.com',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    label: 'DeepSeek AI',
    logoUrl: '/brand/sponsors/icons8-deepseek.svg',
    websiteUrl: 'https://www.deepseek.com',
  },
  {
    id: 'grok',
    name: 'Grok',
    label: 'xAI Grok',
    logoUrl: '/brand/sponsors/icons8-grok.svg',
    websiteUrl: 'https://x.ai',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    label: 'Microsoft Copilot',
    logoUrl: '/brand/sponsors/icons8-microsoft-copilot.svg',
    websiteUrl: 'https://copilot.microsoft.com',
  },
]
