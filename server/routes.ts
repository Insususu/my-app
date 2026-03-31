import { Router, Request, Response } from 'express';
import { fetchBestPosts, fetchPostDetail, debugPostPage } from './scraper.js';
import { generateWebtoonImages } from './gemini.js';

const router = Router();

// 디버그 엔드포인트
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

// 썰툰 (AI 웹툰) 생성
router.post('/api/generate-webtoon', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body as { title: string; content: string[] };

    if (!title || !content || content.length === 0) {
      res.status(400).json({ error: '제목과 본문이 필요합니다.' });
      return;
    }

    console.log(`[route] 썰툰 생성 요청: "${title}" (${content.length}문단)`);
    const scenes = await generateWebtoonImages(title, content);
    res.json({ scenes });
  } catch (error) {
    console.error('썰툰 생성 실패:', error);
    res.status(500).json({ error: '썰툰 생성에 실패했습니다.' });
  }
});

export default router;
