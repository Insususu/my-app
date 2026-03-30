import { Router, Request, Response } from 'express';
import { fetchBestPosts, fetchPostDetail, debugPostPage } from './scraper.js';

const router = Router();

// 디버그 엔드포인트: 페이지 HTML 구조 분석
router.get('/api/debug/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const debug = await debugPostPage(id);
    res.json(debug);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/api/posts', async (_req: Request, res: Response) => {
  try {
    const posts = await fetchBestPosts();
    res.json(posts);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    res.status(500).json({ error: '게시글 목록을 가져올 수 없습니다.' });
  }
});

router.get('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const post = await fetchPostDetail(id);
    res.json(post);
  } catch (error) {
    console.error(`Failed to fetch post ${req.params.id}:`, error);
    res.status(500).json({ error: '게시글을 가져올 수 없습니다.' });
  }
});

export default router;
