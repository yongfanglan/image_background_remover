'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传 JPG 或 PNG 图片');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveBg = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      // Convert data URL to File
      const res = await fetch(image);
      const blob = await res.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.resultUrl);
      } else {
        setError(data.error || '处理失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = 'bgremover-result.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-400">🎯 BgRemover</h1>
        <p className="mt-2 text-gray-400">一键去除图片背景，下载透明 PNG</p>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-16">
        {/* Upload Area */}
        {!image && (
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-emerald-400 bg-emerald-400/10'
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-5xl mb-4">🖼️</div>
            <p className="text-lg text-gray-300">拖拽图片到这里</p>
            <p className="text-gray-500 mt-1">或点击上传 · JPG/PNG 最大 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        )}

        {/* Preview */}
        {image && !result && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-4">
              <img
                src={image}
                alt="Preview"
                className="max-h-80 mx-auto rounded-lg"
              />
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setImage(null);
                  setError(null);
                }}
                className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                重新上传
              </button>
              <button
                onClick={handleRemoveBg}
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '处理中...' : '✨ 开始去除背景'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-400">AI 正在去除背景，约 3 秒...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-center text-gray-400 mb-4 text-sm">处理结果</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result}
                alt="Result"
                className="max-h-80 mx-auto rounded-lg"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              />
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setImage(null);
                  setResult(null);
                }}
                className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                处理下一张
              </button>
              <button
                onClick={handleDownload}
                className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors font-medium"
              >
                📥 下载结果
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-6">
            <p className="text-red-400 mb-4">⚠️ {error}</p>
            <button
              onClick={() => setError(null)}
              className="px-6 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              重试
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm">
        © 2026 BgRemover · 完全免费使用
      </footer>
    </div>
  );
}
