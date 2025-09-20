// navbar.js
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

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
    <nav class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50">
      <!-- 左邊區塊 -->
      <div class="flex items-center gap-6 font-semibold">
        <a href="index.html" class="text-xl hover:text-yellow-300 transition">📚 學習網站</a>
        <a href="index.html" class="hover:text-yellow-300 transition">🏠 回首頁</a>
      </div>

      <!-- 右邊區塊 -->
      <div class="flex items-center gap-6">
        <span id="datetime" class="text-sm font-mono"></span>
        ${
          user
            ? `<span class="bg-white/20 px-3 py-1 rounded-lg text-sm">👤 ${displayName}（${role}）</span>`
            : ""
        }
        <a href="chatroom.html" class="hover:text-yellow-300 transition">💬 聊天室</a>
        ${
          user
            ? `<button id="logoutBtn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition">登出</button>`
            : ""
        }
      </div>
    </nav>
    <div class="h-16"></div> <!-- 增加空白，避免內容被 navbar 蓋住 -->
  `;

  // 登出功能
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      sessionStorage.clear(); // ✅ 登出後清掉暫存
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
      second: "2-digit",
    });
    const datetimeEl = document.getElementById("datetime");
    if (datetimeEl) datetimeEl.textContent = formatted;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);
}
