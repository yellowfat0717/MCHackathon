// Tutor.js
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { db } from "./fundamental.js";

export default function renderTutor(container, user) {
  container.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex flex-col">
      <div class="max-w-3xl mx-auto w-full bg-white shadow-lg rounded-xl p-6 flex flex-col flex-1">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-800">🎓 皮卡小老師</h2>
          <button id="backBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">🏠 返回首頁</button>
        </div>

        <!-- Chat Box -->
        <div id="chatBox" class="flex-1 border border-gray-300 rounded-lg p-4 mb-4 overflow-y-auto bg-gray-50 space-y-3 max-h-[500px]">
          <p class="text-gray-500 text-center">💬 請輸入問題開始對話...</p>
        </div>

        <!-- Input -->
        <div class="flex gap-2">
          <input id="questionInput" placeholder="請輸入問題..." 
            class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"/>
          <button id="sendBtn" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition">送出</button>
        </div>
      </div>
    </div>
  `;

  // 返回首頁
  document.getElementById("backBtn").onclick = () => {
    import("./fundamental.js").then((m) => m.renderDashboard(container, user));
  };

  const chatBox = document.getElementById("chatBox");
  const input = document.getElementById("questionInput");
  const sendBtn = document.getElementById("sendBtn");

  // 顯示訊息（美化）
  function appendMessage(sender, text, isLoading = false) {
    const msgDiv = document.createElement("div");
    msgDiv.className = sender === "student" ? "text-right" : "text-left";

    msgDiv.innerHTML = `
      <div class="${sender === "student"
        ? "inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg shadow"
        : "inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow"}">
        <b>${sender === "student" ? "👩‍🎓 學生" : "👨‍🏫 家教老師"}：</b> 
        <span class="msg-text">${text}</span>
      </div>
    `;

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv.querySelector(".msg-text"); // ✅ 回傳文字 span，方便更新
  }

  // 打字動畫
  async function typeText(targetEl, fullText, extraHTML = "") {
    targetEl.textContent = ""; // 清空文字
    for (let i = 0; i < fullText.length; i++) {
      targetEl.textContent += fullText[i];
      chatBox.scrollTop = chatBox.scrollHeight;
      await new Promise((r) => setTimeout(r, 30)); // 每字間隔 30ms
    }
    if (extraHTML) {
      const extraDiv = document.createElement("div");
      extraDiv.innerHTML = extraHTML;
      extraDiv.className = "mt-1";
      targetEl.parentElement.parentElement.appendChild(extraDiv);
    }
  }

  // 處理送出邏輯
  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    // 顯示學生問題
    appendMessage("student", text);
    input.value = "";

    // 顯示 Loading 提示
    const loadingEl = appendMessage("teacher", "AI 回答中... ⏳", true);

    // 🔍 從 Firestore → answers 找對應答案
    const q = query(collection(db, "answers"), where("question", "==", text));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const data = snap.docs[0].data();
      const extra = data.video
        ? `<a href="${data.video}" target="_blank" class="text-blue-600 hover:underline">📺 觀看教學影片</a>`
        : "";
      await typeText(loadingEl, data.answer, extra);
    } else {
      await typeText(loadingEl, "抱歉，目前沒有這題的答案。");
    }
  }

  // 點擊送出
  sendBtn.onclick = handleSend;

  // 按 Enter 送出（Shift+Enter 換行）
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}
