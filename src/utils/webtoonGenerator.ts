import type { WebtoonPanel, PanelType } from '../types';

const PASTEL_BACKGROUNDS = [
  '#FFE4E1', // 연분홍
  '#E0F0FF', // 연파랑
  '#F0FFE0', // 연초록
  '#FFF0E0', // 연주황
  '#F0E0FF', // 연보라
  '#FFFDE0', // 연노랑
  '#E0FFF5', // 연민트
  '#FFE8F0', // 연핑크
];

const AVATAR_EMOJIS = ['😀', '😢', '😡', '😱', '🤔', '😂', '🥺', '😤', '🤭', '😊'];

export function textToPanels(title: string, paragraphs: string[], topComments?: { author: string; text: string }[]): WebtoonPanel[] {
  const panels: WebtoonPanel[] = [];

  // 제목 패널
  panels.push({ text: title, type: 'title' });

  // 본문 패널
  let colorIdx = 0;
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const isDialogue = /^[""\u201C\u201D「」'']/.test(trimmed) || /[""\u201C\u201D]/.test(trimmed);
    const type: PanelType = isDialogue ? 'dialogue' : 'narration';

    panels.push({
      text: trimmed,
      type,
      speaker: isDialogue ? AVATAR_EMOJIS[colorIdx % AVATAR_EMOJIS.length] : undefined,
    });
    colorIdx++;
  }

  // 베스트 댓글 패널
  if (topComments && topComments.length > 0) {
    for (const comment of topComments.slice(0, 3)) {
      panels.push({
        text: comment.text,
        type: 'comment',
        speaker: comment.author,
      });
    }
  }

  return panels;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const forcedLines = text.split('\n');

  for (const fLine of forcedLines) {
    if (!fLine.trim()) {
      lines.push('');
      continue;
    }

    let currentLine = '';
    for (let i = 0; i < fLine.length; i++) {
      const testLine = currentLine + fLine[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = fLine[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tailDirection: 'left' | 'right') {
  const r = 16;
  drawRoundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  // 말풍선 꼬리
  ctx.beginPath();
  const tailX = tailDirection === 'left' ? x : x + w;
  const tailY = y + h * 0.4;
  const tipX = tailDirection === 'left' ? x - 15 : x + w + 15;
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tailY + 8);
  ctx.lineTo(tailX, tailY + 16);
  ctx.closePath();
  ctx.fill();
}

const CANVAS_WIDTH = 800;
const PANEL_PADDING = 40;
const TEXT_MAX_WIDTH = CANVAS_WIDTH - PANEL_PADDING * 2;
const LINE_HEIGHT = 30;
const FONT_FAMILY = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function calculatePanelHeight(ctx: CanvasRenderingContext2D, panel: WebtoonPanel): number {
  switch (panel.type) {
    case 'title': {
      ctx.font = `bold 28px ${FONT_FAMILY}`;
      const lines = wrapText(ctx, panel.text, TEXT_MAX_WIDTH - 40);
      return Math.max(180, 80 + lines.length * 40);
    }
    case 'dialogue': {
      ctx.font = `18px ${FONT_FAMILY}`;
      const bubbleMaxW = TEXT_MAX_WIDTH - 120;
      const lines = wrapText(ctx, panel.text, bubbleMaxW - 40);
      return Math.max(160, 60 + lines.length * LINE_HEIGHT + 60);
    }
    case 'comment': {
      ctx.font = `16px ${FONT_FAMILY}`;
      const lines = wrapText(ctx, panel.text, TEXT_MAX_WIDTH - 80);
      return Math.max(120, 50 + lines.length * 26 + 50);
    }
    case 'narration':
    default: {
      ctx.font = `18px ${FONT_FAMILY}`;
      const lines = wrapText(ctx, panel.text, TEXT_MAX_WIDTH - 60);
      return Math.max(140, 50 + lines.length * LINE_HEIGHT + 50);
    }
  }
}

function drawTitlePanel(ctx: CanvasRenderingContext2D, panel: WebtoonPanel, y: number) {
  const height = calculatePanelHeight(ctx, panel);

  // 배경 그라디언트
  const gradient = ctx.createLinearGradient(0, y, CANVAS_WIDTH, y + height);
  gradient.addColorStop(0, '#FF6B6B');
  gradient.addColorStop(1, '#FFE66D');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, CANVAS_WIDTH, height);

  // 장식 요소
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH - 80, y + 60, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(60, y + height - 30, 60, 0, Math.PI * 2);
  ctx.fill();

  // 제목 텍스트
  ctx.font = `bold 28px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapText(ctx, panel.text, TEXT_MAX_WIDTH - 40);
  const totalTextHeight = lines.length * 40;
  let textY = y + (height - totalTextHeight) / 2 + 20;

  // 텍스트 그림자
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  for (const line of lines) {
    ctx.fillText(line, CANVAS_WIDTH / 2, textY);
    textY += 40;
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // "썰툰" 배지
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const badgeText = '썰툰';
  const badgeW = ctx.measureText(badgeText).width + 20;
  drawRoundRect(ctx, CANVAS_WIDTH / 2 - badgeW / 2, y + height - 40, badgeW, 28, 14);
  ctx.fillStyle = 'rgba(255,107,107,0.8)';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, CANVAS_WIDTH / 2, y + height - 36);
  ctx.textAlign = 'left';

  return height;
}

function drawNarrationPanel(ctx: CanvasRenderingContext2D, panel: WebtoonPanel, y: number, bgColor: string) {
  const height = calculatePanelHeight(ctx, panel);

  // 배경
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, y, CANVAS_WIDTH, height);

  // 텍스트 박스
  ctx.font = `18px ${FONT_FAMILY}`;
  const lines = wrapText(ctx, panel.text, TEXT_MAX_WIDTH - 60);
  const boxPadding = 25;
  const boxH = lines.length * LINE_HEIGHT + boxPadding * 2;
  const boxY = y + (height - boxH) / 2;

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, PANEL_PADDING, boxY, TEXT_MAX_WIDTH, boxH, 12);
  ctx.fill();
  ctx.stroke();

  // 텍스트
  ctx.fillStyle = '#333333';
  let textY = boxY + boxPadding;
  for (const line of lines) {
    ctx.fillText(line, PANEL_PADDING + 30, textY);
    textY += LINE_HEIGHT;
  }

  return height;
}

function drawDialoguePanel(ctx: CanvasRenderingContext2D, panel: WebtoonPanel, y: number, bgColor: string) {
  const height = calculatePanelHeight(ctx, panel);

  // 배경
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, y, CANVAS_WIDTH, height);

  // 아바타
  const avatarX = 65;
  const avatarY = y + height / 2;
  const avatarR = 30;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 이모지 아바타
  ctx.font = `28px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(panel.speaker || '😀', avatarX, avatarY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // 말풍선
  const bubbleX = 120;
  const bubbleMaxW = CANVAS_WIDTH - bubbleX - PANEL_PADDING;
  ctx.font = `18px ${FONT_FAMILY}`;
  const lines = wrapText(ctx, panel.text, bubbleMaxW - 40);
  const bubbleH = lines.length * LINE_HEIGHT + 40;
  const bubbleY = y + (height - bubbleH) / 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#D0D0D0';
  ctx.lineWidth = 1.5;
  drawSpeechBubble(ctx, bubbleX, bubbleY, bubbleMaxW, bubbleH, 'left');

  // 말풍선 텍스트
  ctx.fillStyle = '#333333';
  let textY = bubbleY + 20;
  for (const line of lines) {
    ctx.fillText(line, bubbleX + 20, textY);
    textY += LINE_HEIGHT;
  }

  return height;
}

function drawCommentPanel(ctx: CanvasRenderingContext2D, panel: WebtoonPanel, y: number) {
  const height = calculatePanelHeight(ctx, panel);

  // 배경
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, y, CANVAS_WIDTH, height);

  // 댓글 아이콘
  ctx.font = `bold 14px ${FONT_FAMILY}`;
  ctx.fillStyle = '#FF6B6B';
  ctx.fillText('💬 베스트 댓글', PANEL_PADDING, y + 15);

  // 작성자
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  ctx.fillStyle = '#666666';
  ctx.fillText(panel.speaker || '익명', PANEL_PADDING + 10, y + 42);

  // 댓글 내용
  ctx.font = `16px ${FONT_FAMILY}`;
  ctx.fillStyle = '#333333';
  const lines = wrapText(ctx, panel.text, TEXT_MAX_WIDTH - 80);
  let textY = y + 65;
  for (const line of lines) {
    ctx.fillText(line, PANEL_PADDING + 10, textY);
    textY += 26;
  }

  return height;
}

export async function renderWebtoon(canvas: HTMLCanvasElement, panels: WebtoonPanel[]): Promise<void> {
  if (panels.length === 0) {
    throw new Error('생성할 패널이 없습니다.');
  }

  // 폰트 로딩 대기
  try {
    await document.fonts.load('18px "Noto Sans KR"');
    await document.fonts.load('bold 28px "Noto Sans KR"');
  } catch {
    // 폰트 로딩 실패 시 기본 폰트로 진행
  }

  try {
    await document.fonts.ready;
  } catch {
    // fonts.ready 실패 시 무시
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
  }

  canvas.width = CANVAS_WIDTH;

  // 전체 높이 계산
  let totalHeight = 0;
  const panelHeights: number[] = [];
  for (const panel of panels) {
    const h = calculatePanelHeight(ctx, panel);
    panelHeights.push(h);
    totalHeight += h;
  }
  // 패널 간 구분선 높이
  totalHeight += (panels.length - 1) * 4;

  // 캔버스 최대 높이 제한 (브라우저별 제한 약 32767px)
  const maxCanvasHeight = 30000;
  if (totalHeight > maxCanvasHeight) {
    totalHeight = maxCanvasHeight;
  }

  canvas.height = totalHeight;

  // 전체 배경
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);

  // 패널 그리기
  let currentY = 0;
  let colorIdx = 0;

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];

    switch (panel.type) {
      case 'title':
        drawTitlePanel(ctx, panel, currentY);
        break;
      case 'dialogue':
        drawDialoguePanel(ctx, panel, currentY, PASTEL_BACKGROUNDS[colorIdx % PASTEL_BACKGROUNDS.length]);
        colorIdx++;
        break;
      case 'comment':
        drawCommentPanel(ctx, panel, currentY);
        break;
      case 'narration':
      default:
        drawNarrationPanel(ctx, panel, currentY, PASTEL_BACKGROUNDS[colorIdx % PASTEL_BACKGROUNDS.length]);
        colorIdx++;
        break;
    }

    currentY += panelHeights[i];

    // 구분선
    if (i < panels.length - 1) {
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(0, currentY, CANVAS_WIDTH, 4);
      currentY += 4;
    }
  }
}

export function downloadWebtoon(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
