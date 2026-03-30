import type { Post, PostDetail } from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, errorMsg: string): Promise<T> {
  const res = await fetch(url);
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
