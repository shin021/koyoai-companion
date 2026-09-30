const STORAGE_KEY = "koyori_ai_companion_history_v2";

const chat = document.querySelector("#chat");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#message");
const sendBtn = document.querySelector("#sendBtn");
const typing = document.querySelector("#typing");
const clearBtn = document.querySelector("#clearBtn");

const initialHistory = [
  { role: "assistant", content: "助手くん、おかえり〜！今日は何の話をしよっか？" }
];

let history = loadHistory();
if (!history.length) {
  history = initialHistory;
  saveHistory();
}
render();

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-40) : [];
  } catch { return []; }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-40)));
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}

function now() {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit", minute: "2-digit"
  }).format(new Date());
}

function render() {
  chat.innerHTML = "";
  for (const m of history) addBubble(m.role, m.content, false);
  chat.scrollTop = chat.scrollHeight;
}

function addBubble(role, content, scroll = true) {
  const row = document.createElement("div");
  row.className = `row ${role === "user" ? "user" : "assistant"}`;
  row.innerHTML =
    `<div><div class="bubble">${escapeHtml(content)}</div><div class="time">${now()}</div></div>`;
  chat.appendChild(row);
  if (scroll) chat.scrollTop = chat.scrollHeight;
}

function setBusy(busy) {
  input.disabled = busy;
  sendBtn.disabled = busy;
  typing.classList.toggle("hidden", !busy);
}

async function sendMessage(text) {
  history.push({ role: "user", content: text });
  saveHistory();
  addBubble("user", text);
  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`APIがJSONを返していません（HTTP ${response.status}）。`);
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "通信に失敗しました。");

    const reply = String(data.reply || "もう一度送ってみてね。");
    history.push({ role: "assistant", content: reply });
    saveHistory();
    addBubble("assistant", reply);
  } catch (err) {
    addBubble("assistant", `ごめんね、今はうまく話せないみたい。\n${err.message}`);
  } finally {
    setBusy(false);
    input.focus();
  }
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;
  input.value = "";
  input.style.height = "auto";
  await sendMessage(text);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

clearBtn.addEventListener("click", () => {
  if (!confirm("この端末に保存している会話を消しますか？")) return;
  history = initialHistory;
  saveHistory();
  render();
});
