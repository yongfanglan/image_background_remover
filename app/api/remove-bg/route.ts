import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: '请上传图片' },
        { status: 400 }
      );
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '图片太大，请压缩到 10MB 以下' },
        { status: 400 }
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '服务器未配置 API Key' },
        { status: 500 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Build Remove.bg form data
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file_b64', base64Image);
    removeBgFormData.append('size', 'auto');
    removeBgFormData.append('output_format', 'png');
    removeBgFormData.append('output_type', 'preview');

    // Call Remove.bg API
    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgFormData as unknown as BodyInit,
    } as RequestInit);

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error('Remove.bg API error:', errorText);
      return NextResponse.json(
        { success: false, error: '去背服务出错，请重试' },
        { status: 500 }
      );
    }

    // Get result as base64
    const resultBuffer = await removeBgResponse.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString('base64');
    const resultDataUrl = `data:image/png;base64,${resultBase64}`;

    return NextResponse.json({
      success: true,
      resultUrl: resultDataUrl,
    });
  } catch (error) {
    console.error('Remove-bg error:', error);
    return NextResponse.json(
      { success: false, error: '处理失败，请重试' },
      { status: 500 }
    );
  }
}
