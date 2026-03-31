import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash-image';

export interface WebtoonScene {
  sceneText: string;
  imageBase64: string;
  mimeType: string;
}

// 본문을 3~6개 장면으로 그룹화
function groupIntoScenes(title: string, paragraphs: string[]): string[] {
  const scenes: string[] = [];
  scenes.push(title);

  if (paragraphs.length <= 5) {
    for (const p of paragraphs) {
      scenes.push(p);
    }
  } else {
    const groupSize = Math.ceil(paragraphs.length / 5);
    for (let i = 0; i < paragraphs.length; i += groupSize) {
      const group = paragraphs.slice(i, i + groupSize);
      scenes.push(group.join(' '));
    }
  }

  return scenes.slice(0, 6);
}

function buildPrompt(sceneText: string, sceneIndex: number): string {
  const baseStyle = 'Korean webtoon manhwa style, clean lines, pastel colors, cute expressive characters, digital illustration, no text no words no letters';

  if (sceneIndex === 0) {
    return `${baseStyle}, title cover scene, dramatic pose, colorful background, story about: ${sceneText.substring(0, 100)}`;
  }

  return `${baseStyle}, scene illustration: ${sceneText.substring(0, 150)}`;
}

async function generateImage(prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  const url = `${BASE_URL}/${MODEL}:generateContent`;

  try {
    console.log(`[gemini] ${MODEL} 요청 중...`);
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
      },
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        console.log(`[gemini] 이미지 생성 성공`);
        return {
          imageBase64: part.inlineData.data || '',
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    }

    console.log(`[gemini] 응답에 이미지 없음:`, JSON.stringify(response.data).substring(0, 300));
    return null;
  } catch (error: unknown) {
    const axiosErr = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error(`[gemini] 실패 (HTTP ${axiosErr.response?.status}): ${axiosErr.message}`);
    if (axiosErr.response?.data) {
      console.error(`[gemini] 에러 응답:`, JSON.stringify(axiosErr.response.data).substring(0, 500));
    }
    return null;
  }
}

export async function generateWebtoonImages(
  title: string,
  paragraphs: string[],
): Promise<WebtoonScene[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const scenes = groupIntoScenes(title, paragraphs);
  const results: WebtoonScene[] = [];

  console.log(`[gemini] ${scenes.length}개 장면 이미지 생성 시작 (모델: ${MODEL})`);

  for (let i = 0; i < scenes.length; i++) {
    const sceneText = scenes[i];
    const prompt = buildPrompt(sceneText, i);

    console.log(`[gemini] 장면 ${i + 1}/${scenes.length} 생성 중...`);

    const image = await generateImage(prompt);

    if (image) {
      results.push({ sceneText, imageBase64: image.imageBase64, mimeType: image.mimeType });
    } else {
      results.push({ sceneText, imageBase64: '', mimeType: '' });
    }

    // API 속도 제한 방지 (2초 대기)
    if (i < scenes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter((r) => r.imageBase64).length;
  console.log(`[gemini] 완료: ${successCount}/${scenes.length}개 이미지 생성`);
  return results;
}
