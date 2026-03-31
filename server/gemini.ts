import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA0sKy2U3FStAvPoIEXjPQUmM7GkfkfBwg';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Imagen 4 모델 (우선순위 순)
const IMAGEN_MODELS = [
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
];

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
      scenes.push(group.join('\n'));
    }
  }

  return scenes.slice(0, 6);
}

function buildPrompt(sceneText: string, sceneIndex: number): string {
  const baseStyle = 'Korean webtoon style, manhwa illustration, clean lines, pastel colors, cute expressive characters, no text or speech bubbles';

  if (sceneIndex === 0) {
    return `${baseStyle}. Title scene for a story: "${sceneText}". Main character in a dramatic pose with colorful background.`;
  }

  return `${baseStyle}. Illustrate this scene: "${sceneText.substring(0, 200)}". Show emotions and situation visually.`;
}

async function generateImageWithImagen(prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  for (const model of IMAGEN_MODELS) {
    const url = `${BASE_URL}/${model}:predict`;
    try {
      console.log(`[imagen] 모델 ${model} 시도 중...`);
      const response = await axios.post(
        url,
        {
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '3:4',
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

      const predictions = response.data?.predictions || [];
      if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
        console.log(`[imagen] 모델 ${model} 이미지 생성 성공`);
        return {
          imageBase64: predictions[0].bytesBase64Encoded,
          mimeType: predictions[0].mimeType || 'image/png',
        };
      }

      console.log(`[imagen] 모델 ${model}: 응답에 이미지 없음, 응답:`, JSON.stringify(response.data).substring(0, 300));
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number; data?: unknown }; message?: string };
      const status = axiosErr.response?.status;
      const msg = axiosErr.message || 'unknown error';
      console.error(`[imagen] 모델 ${model} 실패 (HTTP ${status}): ${msg}`);
      if (axiosErr.response?.data) {
        console.error(`[imagen] 에러 응답:`, JSON.stringify(axiosErr.response.data).substring(0, 500));
      }
      continue;
    }
  }
  return null;
}

export async function generateWebtoonImages(
  title: string,
  paragraphs: string[],
): Promise<WebtoonScene[]> {
  const scenes = groupIntoScenes(title, paragraphs);
  const results: WebtoonScene[] = [];

  console.log(`[imagen] ${scenes.length}개 장면 이미지 생성 시작`);

  for (let i = 0; i < scenes.length; i++) {
    const sceneText = scenes[i];
    const prompt = buildPrompt(sceneText, i);

    console.log(`[imagen] 장면 ${i + 1}/${scenes.length} 생성 중... 프롬프트: ${prompt.substring(0, 100)}`);

    const image = await generateImageWithImagen(prompt);

    if (image) {
      results.push({ sceneText, imageBase64: image.imageBase64, mimeType: image.mimeType });
    } else {
      results.push({ sceneText, imageBase64: '', mimeType: '' });
    }

    // API 속도 제한 방지
    if (i < scenes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter((r) => r.imageBase64).length;
  console.log(`[imagen] 완료: ${successCount}/${scenes.length}개 이미지 생성`);
  return results;
}
