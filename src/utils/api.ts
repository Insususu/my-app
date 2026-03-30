import type { Post, PostDetail } from '../types';

const API_BASE = '/api';

export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts`);
  if (!res.ok) throw new Error('게시글 목록을 가져올 수 없습니다.');
  return res.json();
}

export async function getPostDetail(id: string): Promise<PostDetail> {
  const res = await fetch(`${API_BASE}/posts/${id}`);
  if (!res.ok) throw new Error('게시글을 가져올 수 없습니다.');
  return res.json();
}
