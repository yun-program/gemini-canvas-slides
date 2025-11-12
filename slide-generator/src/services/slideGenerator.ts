import Anthropic from '@anthropic-ai/sdk';
import type { Slide, GenerateSlideRequest } from '../types';

export async function generateSlide(request: GenerateSlideRequest): Promise<Slide> {
  const anthropic = new Anthropic({
    apiKey: request.apiKey,
    dangerouslyAllowBrowser: true, // Note: In production, API calls should be made from a backend
  });

  const prompt = `以下の記事やノートの内容を分析して、研修用のスライド1枚分の情報にまとめてください。

# 入力内容
${request.content}

# 出力形式
以下のJSON形式で出力してください：
{
  "title": "スライドのタイトル（簡潔で魅力的に）",
  "summary": "スライドの概要（2-3文で要点を説明）",
  "bulletPoints": ["要点1", "要点2", "要点3", "要点4", "要点5"],
  "speakerNotes": "発表者向けのメモ（話す内容の詳細、補足説明、質問への回答案など）"
}

# 要件
- bulletPointsは3〜5個にする
- 各箇条書きは簡潔に（1文、最大で2文まで）
- スライドとして見やすく、理解しやすい内容にする
- speakerNotesには発表時に役立つ詳細情報を含める
- JSONのみを出力し、他の説明は含めない`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse response from Claude API');
  }

  const slide: Slide = JSON.parse(jsonMatch[0]);

  // Validate the response
  if (!slide.title || !slide.summary || !slide.bulletPoints || !slide.speakerNotes) {
    throw new Error('Invalid response structure from Claude API');
  }

  return slide;
}
