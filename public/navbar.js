// navbar.js
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// 匯出函式
export function loadNavbar(auth, user) {
  const navbarContainer = document.getElementById("navbar");

  navbarContainer.innerHTML = `
    <nav>
      <div style="display:flex; align-items:center; gap:15px;">
        <a href="index.html">學習網站</a>
        <a href="index.html">🏠 回首頁</a>
      </div>
      <div style="display:flex; align-items:center; gap:15px; padding-right:30px;">
        <span id="datetime"></span>
        <a href="chatroom.html">聊天室</a>
        <a href="contactbook.html">聯絡簿</a>
        ${user ? `<button id="logoutBtn">登出</button>` : ""}
      </div>
    </nav>
  `;

  // 登出功能
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }

  // 每秒更新時間
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
