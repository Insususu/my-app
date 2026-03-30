import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PostDetail as PostDetailType, WebtoonPanel } from '../types';
import { getPostDetail } from '../utils/api';
import { textToPanels } from '../utils/webtoonGenerator';
import WebtoonCanvas from '../components/WebtoonCanvas';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDetailType | null>(null);
  const [panels, setPanels] = useState<WebtoonPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'webtoon'>('original');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getPostDetail(id)
      .then((data) => {
        setPost(data);
        const generatedPanels = textToPanels(data.title, data.content, data.topComments);
        setPanels(generatedPanels);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

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
        <Link
          to="/"
          className="text-orange-500 hover:text-orange-600 font-medium"
        >
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
                      <span className="text-xs text-red-400 mt-1 inline-block">
                        ♥ {comment.likes}
                      </span>
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
          {/* 패널 미리보기 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-600 mb-3">
              생성될 패널 ({panels.length}개)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {panels.map((panel, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    panel.type === 'title'
                      ? 'bg-orange-50 text-orange-800'
                      : panel.type === 'dialogue'
                        ? 'bg-blue-50 text-blue-800'
                        : panel.type === 'comment'
                          ? 'bg-gray-50 text-gray-700'
                          : 'bg-green-50 text-green-800'
                  }`}
                >
                  <span className="shrink-0 text-xs font-mono text-gray-400 w-6">
                    {i + 1}
                  </span>
                  <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-white/60">
                    {panel.type === 'title'
                      ? '제목'
                      : panel.type === 'dialogue'
                        ? '대화'
                        : panel.type === 'comment'
                          ? '댓글'
                          : '서술'}
                  </span>
                  <span className="truncate">{panel.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 캔버스 */}
          <WebtoonCanvas panels={panels} title={post.title} />
        </div>
      )}
    </div>
  );
}
