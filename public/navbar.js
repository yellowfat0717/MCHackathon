import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { checkUpcomingEvents } from "./calendar.js"; // 🔔 匯入行事曆提醒

// 匯出函式
export function loadNavbar(auth, user) {
  const navbarContainer = document.getElementById("navbar");

  // 從 sessionStorage 取名字和角色
  const displayName =
    sessionStorage.getItem("name") ||
    user?.displayName ||
    user?.email ||
    "訪客";
  const role = sessionStorage.getItem("role") || "未設定角色";

  navbarContainer.innerHTML = `
    <nav>
      <div style="display:flex; align-items:center; gap:15px;">
        <a href="index.html">學習網站</a>
        <a href="index.html">🏠 回首頁</a>
      </div>
      <div style="display:flex; align-items:center; gap:15px; padding-right:30px;">
        <span id="datetime"></span>
        ${user ? `<span>👤 ${displayName}（${role}）</span>` : ""}
        <a href="chatroom.html">聊天室</a>
        <button id="bellBtn">🔔 提醒</button>
        ${user ? `<button id="logoutBtn">登出</button>` : ""}
      </div>
    </nav>
  `;

  // 🚪 登出功能
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      sessionStorage.clear(); // ✅ 登出後清掉暫存
      window.location.href = "index.html";
    });
  }

  // 🔔 鈴鐺提醒
  const bellBtn = document.getElementById("bellBtn");
  if (bellBtn) {
    bellBtn.addEventListener("click", async () => {
      await checkUpcomingEvents(3); // 預設檢查 3 天內的事件
    });
  }

  // ⏰ 每秒更新時間
  function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const datetimeEl = document.getElementById("datetime");
    if (datetimeEl) datetimeEl.textContent = formatted;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);
}
