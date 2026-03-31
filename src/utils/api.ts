import type { Post, PostDetail } from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, errorMsg: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${errorMsg} (서버가 JSON을 반환하지 않았습니다. 백엔드 서버가 실행 중인지 확인하세요.)`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || errorMsg);
  }
  return res.json();
}

export async function getPosts(): Promise<Post[]> {
  return fetchJSON<Post[]>(`${API_BASE}/posts`, '게시글 목록을 가져올 수 없습니다.');
}

export async function getPostDetail(id: string): Promise<PostDetail> {
  return fetchJSON<PostDetail>(`${API_BASE}/posts/${id}`, '게시글을 가져올 수 없습니다.');
}

export interface WebtoonScene {
  sceneText: string;
  imageUrl: string;
}

export async function generateWebtoon(title: string, content: string[]): Promise<WebtoonScene[]> {
  const result = await fetchJSON<{ scenes: WebtoonScene[] }>(
    `${API_BASE}/generate-webtoon`,
    '썰툰 생성에 실패했습니다.',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    },
  );
  return result.scenes;
}
