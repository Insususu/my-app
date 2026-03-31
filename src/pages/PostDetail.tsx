import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PostDetail as PostDetailType } from '../types';
import { getPostDetail, generateWebtoon, type WebtoonScene } from '../utils/api';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'webtoon'>('original');

  // 썰툰 상태
  const [scenes, setScenes] = useState<WebtoonScene[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getPostDetail(id)
      .then((data) => {
        console.log('[PostDetail] 데이터 수신:', { title: data.title, contentLength: data.content.length });
        setPost(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleGenerate = async () => {
    if (!post || post.content.length === 0) return;
    setGenerating(true);
    setGenError(null);
    setGenProgress('AI가 웹툰을 그리고 있습니다... (30초~1분 소요)');

    try {
      const result = await generateWebtoon(post.title, post.content);
      setScenes(result);
      console.log('[PostDetail] 썰툰 생성 완료:', result.length, '장면');
    } catch (err) {
      console.error('[PostDetail] 썰툰 생성 실패:', err);
      setGenError(err instanceof Error ? err.message : '썰툰 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
      setGenProgress('');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/4 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">😵</p>
        <p className="text-lg text-gray-600 mb-4">{error}</p>
        <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div>
      {/* 뒤로가기 */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        목록으로
      </Link>

      {/* 제목 & 메타 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 leading-snug">{post.title}</h2>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span>{post.author}</span>
          {post.date && <span>{post.date}</span>}
          {post.hits > 0 && <span>조회 {post.hits.toLocaleString()}</span>}
          {post.likes > 0 && <span>추천 {post.likes.toLocaleString()}</span>}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('original')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
            activeTab === 'original'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          원문 보기
        </button>
        <button
          onClick={() => setActiveTab('webtoon')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
            activeTab === 'webtoon'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          썰툰 변환
        </button>
      </div>

      {/* 원문 탭 */}
      {activeTab === 'original' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4 text-[15px] text-gray-800 leading-relaxed">
            {post.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {post.topComments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-600 mb-3">베스트 댓글</h3>
              <div className="space-y-3">
                {post.topComments.map((comment, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <span className="text-xs font-medium text-gray-500">{comment.author}</span>
                    <p className="text-sm text-gray-800 mt-1">{comment.text}</p>
                    {comment.likes > 0 && (
                      <span className="text-xs text-red-400 mt-1 inline-block">♥ {comment.likes}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 썰툰 탭 */}
      {activeTab === 'webtoon' && (
        <div>
          {/* 생성 버튼 */}
          {scenes.length === 0 && !generating && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-5xl mb-4">🎨</p>
              <p className="text-lg font-medium text-gray-700 mb-2">AI가 이 이야기를 웹툰으로 그려드립니다</p>
              <p className="text-sm text-gray-500 mb-6">Gemini AI가 각 장면을 웹툰 스타일로 생성합니다</p>
              <button
                onClick={handleGenerate}
                disabled={post.content.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-lg"
              >
                썰툰 만들기
              </button>
              {post.content.length === 0 && (
                <p className="text-xs text-red-400 mt-3">원문이 없어 썰툰을 생성할 수 없습니다</p>
              )}
            </div>
          )}

          {/* 생성 중 */}
          {generating && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500 mb-4" />
              <p className="text-lg font-medium text-gray-700">{genProgress}</p>
              <p className="text-sm text-gray-400 mt-2">장면별로 이미지를 생성하고 있어요</p>
            </div>
          )}

          {/* 에러 */}
          {genError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="font-medium">썰툰 생성 실패</p>
              <p className="text-sm mt-1">{genError}</p>
              <button onClick={handleGenerate} className="mt-2 text-sm text-red-600 underline hover:text-red-800">
                다시 시도
              </button>
            </div>
          )}

          {/* 생성된 썰툰 */}
          {scenes.length > 0 && (
            <div className="space-y-0">
              {/* 제목 배너 */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-6 rounded-t-xl">
                <p className="text-xs font-medium opacity-80 mb-1">썰툰</p>
                <h3 className="text-xl font-bold px-4">{post.title}</h3>
              </div>

              {/* 장면들 */}
              {scenes.map((scene, i) => (
                <div key={i} className="bg-white border-x border-gray-200">
                  {/* AI 생성 이미지 */}
                  {scene.imageBase64 ? (
                    <img
                      src={`data:${scene.mimeType};base64,${scene.imageBase64}`}
                      alt={`장면 ${i + 1}`}
                      className="w-full"
                    />
                  ) : (
                    <div className="bg-gray-100 py-20 text-center text-gray-400">
                      <p className="text-3xl mb-2">🖼️</p>
                      <p className="text-sm">이미지 생성 실패</p>
                    </div>
                  )}

                  {/* 장면 텍스트 오버레이 */}
                  <div className="px-6 py-4 bg-white border-b border-gray-100">
                    <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-line">
                      {scene.sceneText}
                    </p>
                  </div>
                </div>
              ))}

              {/* 하단 */}
              <div className="bg-gray-800 text-white text-center py-6 rounded-b-xl">
                <p className="text-sm opacity-60">- 끝 -</p>
                <p className="text-xs opacity-40 mt-1">AI가 생성한 썰툰입니다</p>
              </div>

              {/* 다시 생성 버튼 */}
              <div className="text-center mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                >
                  다시 생성하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
