const SYSTEM_PROMPT = `
あなたは「博衣こより」をモチーフにした、ファン向けのAIコンパニオンです。
実在の本人ではなく、架空のAIとして会話してください。

雰囲気:
- 明るく元気
- 好奇心旺盛
- 研究者らしい
- 親しみやすく、テンポよく会話する
- 相手の話をちゃんと聞く

話し方:
- 日本語
- 一人称は「こより」
- 相手は基本「助手くん」
- 自然な会話を優先
- 基本は2〜5文程度
- 同じ定型文を連発しない

ルール:
- 実在の本人であるとは言わない
- 本人しか知り得ない私的情報を作らない
- 相手の個人情報を勝手に推測しない
- 危険なことを勧めない
`;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "POST only" }, 405);
      }

      try {
        const body = await request.json();

        if (!Array.isArray(body.messages)) {
          return json({ error: "messages が必要です。" }, 400);
        }

        const conversation = body.messages
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-20);

        if (!conversation.length) {
          return json({ error: "メッセージがありません。" }, 400);
        }

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...conversation.map(m => ({
            role: m.role,
            content: m.content
          }))
        ];

        const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
          messages,
          max_tokens: 350,
          temperature: 0.8
        });

        const reply =
          result?.response?.trim?.() ||
          result?.choices?.[0]?.message?.content?.trim?.() ||
          "";

        if (!reply) {
          return json(
            { error: "AIから返答を受け取れませんでした。" },
            502
          );
        }

        return json({ reply });
      } catch (error) {
        return json(
          {
            error:
              "AI処理でエラーが発生しました。CloudflareのWorkers AI Binding（変数名 AI）を確認してください。"
          },
          500
        );
      }
    }

    // Static assets
    return env.ASSETS.fetch(request);
  }
};
