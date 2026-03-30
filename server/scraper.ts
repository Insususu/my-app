import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://pann.nate.com';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://pann.nate.com/',
};

export interface ScrapedPost {
  id: string;
  title: string;
  author: string;
  date: string;
  hits: number;
  likes: number;
  comments: number;
}

export interface ScrapedPostDetail extends ScrapedPost {
  content: string[];
  topComments: { author: string; text: string; likes: number }[];
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const response = await axios.get(url, {
    headers,
    timeout: 10000,
    responseType: 'arraybuffer',
  });
  const html = new TextDecoder('euc-kr').decode(response.data);
  return cheerio.load(html);
}

export async function fetchBestPosts(): Promise<ScrapedPost[]> {
  const $ = await fetchPage(`${BASE_URL}/talk/ranking`);
  const posts: ScrapedPost[] = [];

  // 네이트판 베스트 글 목록 파싱
  $('li, tr, .post-item, .rankingList li, .listType li').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a[href*="/talk/"]').first();
    if (!$link.length) return;

    const href = $link.attr('href') || '';
    const idMatch = href.match(/\/talk\/(\d+)/);
    if (!idMatch) return;

    const title = $link.text().trim();
    if (!title) return;

    // 숫자 텍스트 추출 헬퍼
    const extractNum = (text: string): number => {
      const match = text.replace(/,/g, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const allText = $el.text();
    const author = $el.find('.nickBox, .nick, .author, .writer').first().text().trim() || '익명';
    const date = $el.find('.date, .time, .datetime').first().text().trim() || '';
    const hits = extractNum($el.find('.count, .hit, .hits, .view').first().text());
    const likes = extractNum($el.find('.like, .good, .recommend').first().text());
    const comments = extractNum($el.find('.comment, .reply, .cmt').first().text());

    posts.push({
      id: idMatch[1],
      title,
      author,
      date,
      hits,
      likes,
      comments,
    });
  });

  // 중복 제거 (같은 ID)
  const seen = new Set<string>();
  return posts.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export async function fetchPostDetail(id: string): Promise<ScrapedPostDetail> {
  const $ = await fetchPage(`${BASE_URL}/talk/${id}`);

  // 제목
  const title =
    $('h3.aSubject, .post-title, #contentArea h3, .tit-area h3, h4.aSubject')
      .first()
      .text()
      .trim() || $('title').text().trim();

  // 본문
  const contentEl = $('#contentArea .posting, #contentArea .postContent, .content-area, .posting-area, #areaContent, .post-content, #postContent');
  let contentHtml = contentEl.first().html() || '';

  // br 태그를 줄바꿈으로 변환
  contentHtml = contentHtml.replace(/<br\s*\/?>/gi, '\n');
  // 나머지 HTML 태그 제거
  const contentText = contentHtml.replace(/<[^>]+>/g, '').trim();

  // 문단 분리
  const content = contentText
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // 메타 정보
  const author = $('.nickBox, .nick, .writer, .author').first().text().trim() || '익명';
  const date = $('.date, .datetime, .time, .postDate').first().text().trim() || '';

  const extractNum = (text: string): number => {
    const match = text.replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const hits = extractNum($('.count, .hit, .viewCount').first().text());
  const likes = extractNum($('.like, .good, .recommend, .likeBtnArea .count').first().text());
  const commentsCount = extractNum($('.comment, .reply, .cmt, .replyCount').first().text());

  // 댓글 파싱
  const topComments: { author: string; text: string; likes: number }[] = [];
  $('.bestComment li, .best-reply li, .comment-list li, .reply-list li, .cmt_list li')
    .slice(0, 5)
    .each((_, el) => {
      const $comment = $(el);
      const cAuthor = $comment.find('.nickBox, .nick, .author').first().text().trim() || '익명';
      const cText = $comment.find('.usertxt, .txt, .comment-text, .cmt_txt, p').first().text().trim();
      const cLikes = extractNum($comment.find('.like, .good, .recommend').first().text());
      if (cText) {
        topComments.push({ author: cAuthor, text: cText, likes: cLikes });
      }
    });

  return {
    id,
    title,
    author,
    date,
    hits,
    likes,
    comments: commentsCount,
    content,
    topComments,
  };
}
