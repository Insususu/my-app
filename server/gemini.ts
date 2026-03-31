import axios from 'axios';

export interface WebtoonScene {
  sceneText: string;
  imageUrl: string;
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

// Pollinations.ai - 완전 무료, API 키 불필요
function getPollinationsUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&nologo=true`;
}

async function generateImage(prompt: string): Promise<string | null> {
  const url = getPollinationsUrl(prompt);
  try {
    console.log(`[image] Pollinations 요청 중...`);
    // HEAD 요청으로 이미지 생성 가능 여부 확인
    const response = await axios.head(url, { timeout: 60000, maxRedirects: 5 });
    if (response.status === 200) {
      console.log(`[image] 이미지 URL 생성 성공`);
      return url;
    }
    return null;
  } catch {
    // HEAD 실패해도 URL 자체는 유효할 수 있음
    console.log(`[image] HEAD 확인 실패, URL 직접 반환`);
    return url;
  }
}

export async function generateWebtoonImages(
  title: string,
  paragraphs: string[],
): Promise<WebtoonScene[]> {
  const scenes = groupIntoScenes(title, paragraphs);
  const results: WebtoonScene[] = [];

  console.log(`[image] ${scenes.length}개 장면 이미지 생성 시작`);

  for (let i = 0; i < scenes.length; i++) {
    const sceneText = scenes[i];
    const prompt = buildPrompt(sceneText, i);

    console.log(`[image] 장면 ${i + 1}/${scenes.length}: ${prompt.substring(0, 80)}...`);

    const imageUrl = await generateImage(prompt);

    results.push({
      sceneText,
      imageUrl: imageUrl || '',
    });

    // 요청 간 1초 대기
    if (i < scenes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`[image] 완료: ${results.filter((r) => r.imageUrl).length}/${scenes.length}개`);
  return results;
}
