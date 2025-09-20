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
    <button id="backBtn">🏠 返回首頁</button>
    <h2>🎓 線上家教系統</h2>
    <div id="chatBox" style="border:1px solid gray; padding:10px; min-height:300px; margin-bottom:10px; overflow-y:auto; max-height:400px;"></div>
    <input id="questionInput" placeholder="請輸入問題..." style="width:70%"/>
    <button id="sendBtn">送出</button>
  `;

  // 返回首頁
  document.getElementById("backBtn").onclick = () => {
    import("./fundamental.js").then((m) => m.renderDashboard(container, user));
  };

  const chatBox = document.getElementById("chatBox");
  const input = document.getElementById("questionInput");
  const sendBtn = document.getElementById("sendBtn");

  // 學生送出問題
  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;

    // 顯示學生問題
    chatBox.innerHTML += `<p><b>👩‍🎓 學生：</b> ${text}</p>`;
    input.value = "";

    // 🔍 從 Firestore → answers 找對應答案
    const q = query(collection(db, "answers"), where("question", "==", text));
    const snap = await getDocs(q);

    if (!snap.empty) {
      snap.forEach((doc) => {
        const data = doc.data();
        chatBox.innerHTML += `
          <p><b>👨‍🏫 家教老師：</b> ${data.answer}</p>
          ${
            data.video
              ? `<p>📺 <a href="${data.video}" target="_blank">觀看教學影片</a></p>`
              : ""
          }
        `;
      });
    } else {
      chatBox.innerHTML += `<p><b>👨‍🏫 家教老師：</b> 抱歉，目前沒有這題的答案。</p>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight; // 自動滾到最下面
  };
}
