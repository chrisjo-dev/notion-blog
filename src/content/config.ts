import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    notionId: z.string(),
    // 계층 구조 메타데이터
    category: z.string().optional(),           // 직계 부모 카테고리
    tags: z.array(z.string()).optional(),      // 모든 상위 카테고리 (breadcrumb용)
    hierarchy: z.array(z.string()).optional(), // 전체 경로 ["Blog", "Tech", "AWS"]
    parent: z.string().optional(),             // 부모 페이지 ID
    level: z.number().optional(),              // 깊이 레벨 (0=루트 직속)
  }),
});

export const collections = { posts };
