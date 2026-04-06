/**
 * Cloudflare Worker - Remove.bg API Proxy
 * Handles image background removal without exposing API key to frontend
 */

export interface Env {
  REMOVE_BG_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Parse form data
      const formData = await request.formData();
      const imageFile = formData.get('image') as File | null;

      if (!imageFile) {
        return new Response(JSON.stringify({ success: false, error: '请上传图片' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Size limit: 10MB
      if (imageFile.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, error: '图片太大，请压缩到 10MB 以下' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const apiKey = env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ success: false, error: '服务器未配置 API Key' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Convert file to base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Call Remove.bg API
      const removeBgFormData = new FormData();
      removeBgFormData.append('image_file_b64', base64Image);
      removeBgFormData.append('size', 'auto');
      removeBgFormData.append('output_format', 'png');
      removeBgFormData.append('output_type', 'preview');

      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: removeBgFormData,
      });

      if (!removeBgResponse.ok) {
        const errorText = await removeBgResponse.text();
        console.error('Remove.bg API error:', errorText);
        return new Response(JSON.stringify({ success: false, error: '去背服务出错，请重试' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get result as base64
      const resultBuffer = await removeBgResponse.arrayBuffer();
      const resultBase64 = btoa(String.fromCharCode(...new Uint8Array(resultBuffer)));
      const resultDataUrl = `data:image/png;base64,${resultBase64}`;

      return new Response(JSON.stringify({ success: true, resultUrl: resultDataUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ success: false, error: '处理失败，请重试' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
} satisfies ExportedHandler<Env>;
