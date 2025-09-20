// login.js

// ✅ 引入 Firebase App 和 Auth 模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// ✅ 引入 firebaseConfig 與 renderDashboard 方法
import { firebaseConfig, renderDashboard } from "./fundamental.js";

// ✅ 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ 監聽使用者登入狀態
onAuthStateChanged(auth, (user) => {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "";

  if (user) {
    renderDashboard(appDiv, user);
  } else {
    renderLoginForm(appDiv);
  }
});

// ✅ 建立登入畫面
function renderLoginForm(container) {
  container.innerHTML = `
    <select id="role" class="input">
      <option value="">請選擇身分</option>
      <option value="student">學生</option>
      <option value="teacher">老師</option>
      <option value="parent">家長</option>
    </select><br>
    <input type="email" id="email" class="input" placeholder="Email"><br>
    <input type="password" id="password" class="input" placeholder="密碼"><br>
    <button class="btn" id="loginBtn">登入</button>
    <button class="btn" id="googleLoginBtn">使用 Google 登入</button>
    <p id="result"></p>
  `;

  // ✨ Email/Password 登入
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const resultEl = document.getElementById("result");

    if (!role || !email || !password) {
      return alert("請輸入所有欄位");
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      resultEl.textContent = `✅ 登入成功（${role}）`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ 登入失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });

  // ✨ Google 登入
  document.getElementById("googleLoginBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;
    const resultEl = document.getElementById("result");

    if (!role) {
      return alert("請選擇身分才能用 Google 登入！");
    }

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      resultEl.textContent = `✅ Google 登入成功：${user.email}，身分：${role}`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ Google 登入失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });
}
export { renderLoginForm };
