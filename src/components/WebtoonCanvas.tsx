import { useRef, useEffect, useState } from 'react';
import type { WebtoonPanel } from '../types';
import { renderWebtoon, downloadWebtoon } from '../utils/webtoonGenerator';

interface Props {
  panels: WebtoonPanel[];
  title: string;
}

export default function WebtoonCanvas({ panels, title }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    setRendered(false);
  }, [panels]);

  const handleRender = async () => {
    if (!canvasRef.current || panels.length === 0) return;
    setRendering(true);
    try {
      await renderWebtoon(canvasRef.current, panels);
      setRendered(true);
    } finally {
      setRendering(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current || !rendered) return;
    const safeName = title.replace(/[^가-힣a-zA-Z0-9]/g, '_').slice(0, 50);
    downloadWebtoon(canvasRef.current, `썰툰_${safeName}`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        <button
          onClick={handleRender}
          disabled={rendering || panels.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          {rendering ? '생성 중...' : '썰툰 생성하기'}
        </button>
        {rendered && (
          <button
            onClick={handleDownload}
            className="px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
          >
            PNG 다운로드
          </button>
        )}
      </div>

      <div className="w-full overflow-auto bg-gray-100 rounded-xl p-4 border border-gray-200">
        <canvas
          ref={canvasRef}
          className="mx-auto block rounded-lg shadow-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {!rendered && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🎨</p>
            <p className="text-lg font-medium">위 버튼을 눌러 썰툰을 생성하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
