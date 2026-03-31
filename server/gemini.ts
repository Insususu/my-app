import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA0sKy2U3FStAvPoIEXjPQUmM7GkfkfBwg';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

export interface WebtoonScene {
  sceneText: string;
  imageBase64: string;
  mimeType: string;
}

// 본문을 3~6개 장면으로 그룹화
function groupIntoScenes(title: string, paragraphs: string[]): string[] {
  const scenes: string[] = [];

  // 제목 장면
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
  if (sceneIndex === 0) {
    return `한국 웹툰 스타일로 그림을 그려줘. 이것은 웹툰의 제목 장면이야.
제목: "${sceneText}"
- 세로형 웹툰 패널 (가로 800px, 세로 600px 비율)
- 한국 웹툰/만화 스타일 (깔끔한 선, 파스텔 컬러)
- 제목에 어울리는 분위기의 캐릭터와 배경
- 텍스트는 넣지 마. 이미지만 그려줘.
- 귀엽고 표현력 있는 캐릭터`;
  }

  return `한국 웹툰 스타일로 이 장면의 그림을 그려줘.
장면 내용: "${sceneText.substring(0, 300)}"
- 세로형 웹툰 패널 (가로 800px, 세로 600px 비율)
- 한국 웹툰/만화 스타일 (깔끔한 선, 파스텔 컬러)
- 장면의 감정과 상황을 시각적으로 표현
- 텍스트는 넣지 마. 이미지만 그려줘.
- 대화 장면이면 캐릭터가 대화하는 모습
- 귀엽고 표현력 있는 캐릭터`;
}

async function generateImage(prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  try {
    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      },
      { timeout: 60000 },
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return {
          imageBase64: part.inlineData.data || '',
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    }
    return null;
  } catch (error) {
    const msg = (error as Error).message;
    console.error(`[gemini] API 호출 실패: ${msg}`);
    return null;
  }
}

export async function generateWebtoonImages(
  title: string,
  paragraphs: string[],
): Promise<WebtoonScene[]> {
  const scenes = groupIntoScenes(title, paragraphs);
  const results: WebtoonScene[] = [];

  console.log(`[gemini] ${scenes.length}개 장면 이미지 생성 시작`);

  for (let i = 0; i < scenes.length; i++) {
    const sceneText = scenes[i];
    const prompt = buildPrompt(sceneText, i);

    console.log(`[gemini] 장면 ${i + 1}/${scenes.length} 생성 중...`);

    const image = await generateImage(prompt);

    if (image) {
      results.push({ sceneText, imageBase64: image.imageBase64, mimeType: image.mimeType });
      console.log(`[gemini] 장면 ${i + 1} 이미지 생성 성공`);
    } else {
      results.push({ sceneText, imageBase64: '', mimeType: '' });
      console.log(`[gemini] 장면 ${i + 1} 이미지 생성 실패`);
    }

    // API 속도 제한 방지
    if (i < scenes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  console.log(`[gemini] 완료: ${results.filter((r) => r.imageBase64).length}/${scenes.length}개 이미지 생성`);
  return results;
}
