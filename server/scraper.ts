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

// ── 샘플 데이터 (외부 접속 불가 시 폴백) ──────────────────────────
const SAMPLE_POSTS: ScrapedPost[] = [
  { id: '1001', title: '오늘 카페에서 있었던 소름돋는 일', author: '커피좋아', date: '03.30', hits: 45230, likes: 1823, comments: 342 },
  { id: '1002', title: '남자친구가 갑자기 프로포즈했는데 반응이 이랬음', author: '달콤한하루', date: '03.30', hits: 38920, likes: 2156, comments: 521 },
  { id: '1003', title: '회사에서 잘린 썰 (반전주의)', author: '직장인A', date: '03.30', hits: 52100, likes: 3201, comments: 678 },
  { id: '1004', title: '소개팅 나갔다가 전 남친을 만남', author: '운명이란', date: '03.29', hits: 31450, likes: 1567, comments: 423 },
  { id: '1005', title: '편의점 알바하면서 겪은 레전드 손님', author: '알바왕', date: '03.29', hits: 29800, likes: 1342, comments: 289 },
  { id: '1006', title: '친구 결혼식에서 생긴 일...진짜 어이없음', author: '하객후기', date: '03.29', hits: 41200, likes: 2890, comments: 567 },
  { id: '1007', title: '길고양이 구조했더니 집사가 된 후기', author: '냥집사', date: '03.28', hits: 27650, likes: 4102, comments: 312 },
  { id: '1008', title: '대학 면접에서 면접관이 울었던 사연', author: '수험생', date: '03.28', hits: 35400, likes: 2678, comments: 445 },
  { id: '1009', title: '이사한 집에서 발견한 전 세입자의 편지', author: '새집이사', date: '03.28', hits: 22100, likes: 1890, comments: 234 },
  { id: '1010', title: '10년 친구랑 절교하게 된 이유', author: '외로운밤', date: '03.27', hits: 48300, likes: 2345, comments: 789 },
];

const SAMPLE_DETAILS: Record<string, ScrapedPostDetail> = {
  '1001': {
    id: '1001', title: '오늘 카페에서 있었던 소름돋는 일', author: '커피좋아', date: '03.30',
    hits: 45230, likes: 1823, comments: 342,
    content: [
      '오늘 단골 카페에 갔거든요',
      '항상 가던 자리에 앉아서 아메리카노 시켰는데',
      '옆 테이블에 앉은 사람이 자꾸 저를 쳐다보는 거예요',
      '"저기...혹시 OO고등학교 나오셨어요?"',
      '깜짝 놀라서 봤더니 10년 전 짝꿍이었음',
      '서로 연락처도 잃어버리고 완전 소식 끊겼었는데',
      '알고보니 이 카페 사장이 그 친구였던 거임...',
      '"나 여기 매일 왔는데 너 처음 왔을 때부터 알아봤어"',
      '"근데 확신이 없어서 말 못 걸었다ㅋㅋ"',
      '그래서 오늘부터 커피 서비스 받게 됨',
      '10년 만에 다시 만난 짝꿍이랑 3시간 수다 떨었네요',
      '세상 참 좁다...',
    ],
    topComments: [
      { author: '감동실화', text: '와 진짜 소름... 드라마도 이런 전개 없다', likes: 523 },
      { author: '커피마니아', text: '커피값 평생 무료 각이네ㅋㅋㅋ 부럽다', likes: 412 },
      { author: '인연이란', text: '이런게 진짜 인연이지... 나도 이런 일 있었으면', likes: 289 },
    ],
  },
  '1002': {
    id: '1002', title: '남자친구가 갑자기 프로포즈했는데 반응이 이랬음', author: '달콤한하루', date: '03.30',
    hits: 38920, likes: 2156, comments: 521,
    content: [
      '사귄지 3년 된 남자친구가 있는데요',
      '어제 평소처럼 저녁 먹으러 갔거든요',
      '근데 갑자기 무릎을 꿇더니 반지를 꺼내는거임',
      '"나랑 결혼해줄래?"',
      '너무 놀라서 아무 말도 못하고 있었는데',
      '옆 테이블 아저씨가 갑자기 박수를 치시는거예요',
      '그러더니 식당 전체가 박수를 치기 시작함',
      '나 눈물 콧물 다 흘리면서',
      '"응...응!!!" 했더니',
      '남자친구도 울더라고요',
      '근데 반전은...',
      '알고보니 남자친구가 식당 사장님한테 미리 말해놨던 거였음ㅋㅋ',
      '사장님이 우리 테이블에 케이크도 서비스로 보내줬어요',
      '인생에서 가장 행복한 순간이었습니다',
    ],
    topComments: [
      { author: '축하해요', text: '헐ㅠㅠㅠ 진짜 축하드려요!! 행복하세요!!', likes: 678 },
      { author: '솔로탈출기원', text: '아 부럽다... 나는 언제... 결혼 축하합니다!', likes: 445 },
      { author: '웨딩플래너', text: '준비성 있는 남친이네요 ㅋㅋ 축하드립니다!', likes: 334 },
    ],
  },
  '1003': {
    id: '1003', title: '회사에서 잘린 썰 (반전주의)', author: '직장인A', date: '03.30',
    hits: 52100, likes: 3201, comments: 678,
    content: [
      '저 3년 다니던 회사에서 잘렸습니다',
      '이유가 뭐냐면요',
      '팀장이 저한테 부당한 업무지시를 계속 했거든요',
      '주말마다 출근하라, 야근은 기본, 보고서는 매일 새벽까지',
      '"이거 노동법 위반 아닌가요?" 라고 했더니',
      '"너 잘리고 싶어?" 이러는 거예요',
      '그래서 조용히 증거를 모았습니다',
      '녹음, 카톡 캡처, 출퇴근 기록 전부',
      '그리고 노동청에 신고했어요',
      '결과는...',
      '팀장이 잘림 ㅋㅋㅋㅋㅋ',
      '저는 부당해고로 복직했고 밀린 수당도 다 받았습니다',
      '지금은 다른 팀으로 옮겨서 잘 다니고 있어요',
      '부당한 일 당하면 참지 마세요. 증거가 답입니다.',
    ],
    topComments: [
      { author: '통쾌왕', text: '아 이런 사이다 글 좋아요ㅋㅋㅋ 팀장 표정이 궁금하다', likes: 891 },
      { author: '직장인B', text: '증거 수집이 진짜 중요하죠... 고생 많으셨어요!', likes: 567 },
      { author: '노동법전문가', text: '잘 대처하셨네요. 이런 경우 3년 이내 신고하면 됩니다', likes: 423 },
    ],
  },
};

// 나머지 ID에 대한 기본 상세 데이터 생성
function getSampleDetail(id: string): ScrapedPostDetail {
  if (SAMPLE_DETAILS[id]) return SAMPLE_DETAILS[id];

  const post = SAMPLE_POSTS.find((p) => p.id === id);
  if (!post) {
    return {
      id, title: '게시글을 찾을 수 없습니다', author: '알수없음', date: '',
      hits: 0, likes: 0, comments: 0,
      content: ['해당 게시글이 존재하지 않습니다.'],
      topComments: [],
    };
  }

  return {
    ...post,
    content: [
      `${post.title}에 대한 이야기를 해볼게요.`,
      '사실 이건 정말 예상치 못한 일이었어요.',
      '"진짜 이런 일이 나한테 일어날 줄은 몰랐지..."',
      '그날 평소처럼 하루를 시작했는데요.',
      '갑자기 전화 한 통이 왔어요.',
      '"여보세요? 저 지금 급한데요..."',
      '그래서 급하게 뛰어갔더니',
      '상상도 못한 광경이 펼쳐져 있었음',
      '자세한 건 너무 길어서 다음에 이어서 쓸게요',
      '2편도 기대해주세요!',
    ],
    topComments: [
      { author: '기대중', text: '2편 빨리 올려주세요!!', likes: 234 },
      { author: '궁금', text: '와 이게 실화임?? 대박', likes: 178 },
    ],
  };
}
// ── 샘플 데이터 끝 ────────────────────────────────────────────

async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const response = await axios.get(url, {
    headers,
    timeout: 10000,
    responseType: 'arraybuffer',
  });

  // Content-Type 헤더에서 인코딩 감지
  const contentType = (response.headers['content-type'] || '') as string;
  let encoding = 'utf-8';

  const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
  if (charsetMatch) {
    encoding = charsetMatch[1].toLowerCase().replace(/^["']|["']$/g, '');
  }

  // 먼저 UTF-8로 디코딩 시도하고, HTML meta charset 확인
  let html = new TextDecoder('utf-8').decode(response.data);

  // <meta charset="euc-kr"> 또는 <meta content="text/html; charset=euc-kr"> 패턴 확인
  const metaCharsetMatch = html.match(/charset=["']?(euc-kr|euc_kr|ms949)["']?/i);
  if (metaCharsetMatch || encoding === 'euc-kr' || encoding === 'euc_kr') {
    html = new TextDecoder('euc-kr').decode(response.data);
  }

  return cheerio.load(html);
}

export async function fetchBestPosts(): Promise<ScrapedPost[]> {
  try {
    const $ = await fetchPage(`${BASE_URL}/talk/ranking`);
    const posts: ScrapedPost[] = [];

    $('li, tr, .post-item, .rankingList li, .listType li').each((_, el) => {
      const $el = $(el);
      const $link = $el.find('a[href*="/talk/"]').first();
      if (!$link.length) return;

      const href = $link.attr('href') || '';
      const idMatch = href.match(/\/talk\/(\d+)/);
      if (!idMatch) return;

      const title = $link.text().trim();
      if (!title) return;

      const extractNum = (text: string): number => {
        const match = text.replace(/,/g, '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };

      const author = $el.find('.nickBox, .nick, .author, .writer').first().text().trim() || '익명';
      const date = $el.find('.date, .time, .datetime').first().text().trim() || '';
      const hits = extractNum($el.find('.count, .hit, .hits, .view').first().text());
      const likes = extractNum($el.find('.like, .good, .recommend').first().text());
      const comments = extractNum($el.find('.comment, .reply, .cmt').first().text());

      posts.push({ id: idMatch[1], title, author, date, hits, likes, comments });
    });

    const seen = new Set<string>();
    const unique = posts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    if (unique.length > 0) return unique;

    // 파싱 결과가 없으면 샘플 데이터 사용
    console.log('[scraper] 파싱 결과 없음, 샘플 데이터 사용');
    return SAMPLE_POSTS;
  } catch (error) {
    console.log('[scraper] 네이트판 접속 실패, 샘플 데이터 사용:', (error as Error).message);
    return SAMPLE_POSTS;
  }
}

export async function fetchPostDetail(id: string): Promise<ScrapedPostDetail> {
  try {
    const $ = await fetchPage(`${BASE_URL}/talk/${id}`);

    const title =
      $('h3.aSubject, .post-title, #contentArea h3, .tit-area h3, h4.aSubject')
        .first()
        .text()
        .trim() || $('title').text().trim();

    const contentEl = $('#contentArea .posting, #contentArea .postContent, .content-area, .posting-area, #areaContent, .post-content, #postContent');
    let contentHtml = contentEl.first().html() || '';
    contentHtml = contentHtml.replace(/<br\s*\/?>/gi, '\n');
    const contentText = contentHtml.replace(/<[^>]+>/g, '').trim();

    const content = contentText
      .split(/\n{1,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const author = $('.nickBox, .nick, .writer, .author').first().text().trim() || '익명';
    const date = $('.date, .datetime, .time, .postDate').first().text().trim() || '';

    const extractNum = (text: string): number => {
      const match = text.replace(/,/g, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const hits = extractNum($('.count, .hit, .viewCount').first().text());
    const likes = extractNum($('.like, .good, .recommend, .likeBtnArea .count').first().text());
    const commentsCount = extractNum($('.comment, .reply, .cmt, .replyCount').first().text());

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

    if (content.length > 0) {
      return { id, title, author, date, hits, likes, comments: commentsCount, content, topComments };
    }

    console.log(`[scraper] 글 ${id} 본문 파싱 실패, 샘플 데이터 사용`);
    return getSampleDetail(id);
  } catch (error) {
    console.log(`[scraper] 글 ${id} 접속 실패, 샘플 데이터 사용:`, (error as Error).message);
    return getSampleDetail(id);
  }
}
