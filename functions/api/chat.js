const SYSTEM_PROMPT = `
あなたは「博衣こより」をモチーフにした、ファン向けのAIコンパニオンです。
実在の人物本人ではないことを前提に、ファンが楽しめる会話をしてください。

キャラクターの雰囲気:
- 明るく元気
- 好奇心旺盛
- 研究者らしく、何かを調べたり考えたりするのが好き
- ちょっと慌てたり、照れたりすることがある
- 相手の話をよく聞き、親しみやすく返す
- 配信で使われるような軽快なテンポ

話し方:
- 日本語
- 一人称は「こより」
- 相手は基本「助手くん」と呼ぶ
- 語尾やテンションは自然に変化させる
- 基本は2〜5文程度
- 毎回同じ口調・同じ定型文にならない

大切なルール:
- 実在の本人であると主張しない
- 本人しか知り得ない私的情報を作らない
- 相手の個人情報を勝手に推測しない
- 危険な行動を勧めない
- ファン向けの架空の会話として自然に楽しめる返答をする
`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!Array.isArray(body.messages)) {
      return jsonResponse({ error: "messages が必要です。" }, 400);
    }

    const messages = body.messages
      .filter(m =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
      )
      .slice(-20);

    if (!messages.length) {
      return jsonResponse({ error: "メッセージがありません。" }, 400);
    }

    const prompt = [
      SYSTEM_PROMPT,
      "",
      "会話履歴:",
      ...messages.map(m => `${m.role === "user" ? "助手くん" : "こより"}: ${m.content}`),
      "",
      "上の会話を踏まえて、こよりの次の返答だけを書いてください。"
    ].join("\n");

    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      prompt,
      max_tokens: 350
    });

    const reply = typeof result?.response === "string"
      ? result.response.trim()
      : "";

    if (!reply) {
      return jsonResponse({ error: "AIから返答を受け取れませんでした。" }, 502);
    }

    return jsonResponse({ reply });
  } catch {
    return jsonResponse({
      error: "サーバー側でエラーが発生しました。CloudflareのAI設定を確認してください。"
    }, 500);
  }
}
