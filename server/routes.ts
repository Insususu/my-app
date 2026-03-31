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

    console.log(`[route] 썰툰 요청 body:`, JSON.stringify({ title, contentLength: content?.length }));

    if (!title || !content || content.length === 0) {
      console.log(`[route] 제목/본문 누락`);
      res.status(400).json({ error: '제목과 본문이 필요합니다.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[route] GEMINI_API_KEY 설정 여부: ${apiKey ? '있음 (' + apiKey.substring(0, 10) + '...)' : '없음!'}`);

    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
      return;
    }

    console.log(`[route] generateWebtoonImages 호출 시작...`);
    const scenes = await generateWebtoonImages(title, content);
    console.log(`[route] generateWebtoonImages 완료: ${scenes.length}개 장면`);
    res.json({ scenes });
  } catch (error) {
    console.error('[route] 썰툰 생성 실패:', (error as Error).message);
    console.error('[route] 스택:', (error as Error).stack);
    res.status(500).json({ error: `썰툰 생성에 실패했습니다: ${(error as Error).message}` });
  }
});

export default router;
