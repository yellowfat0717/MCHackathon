// login.js

// ✅ 引入 Firebase App 和 Auth 模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, // ✨ 新增
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

// ✅ 引入 firebaseConfig 與 renderDashboard 方法
import { firebaseConfig, renderDashboard } from "./fundamental.js";

// ✅ 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ 設定持久性為「session」
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("✅ 登入狀態只會在這次瀏覽器 session 保存");
  })
  .catch((err) => {
    console.error("❌ 設定持久性失敗：", err);
  });

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

// ✅ 建立登入/註冊畫面
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
    <div>
      <button class="btn" id="loginBtn">登入</button>
      <button class="btn" id="signupBtn">註冊</button>
      <button class="btn" id="googleLoginBtn">使用 Google 登入</button>
    </div>
    <p id="result"></p>
  `;

  const resultEl = document.getElementById("result");

  // ✨ Email/Password 登入
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!role || !email || !password) {
      return alert("請輸入所有欄位");
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("role", role);
      resultEl.textContent = `✅ 登入成功（${role}）`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ 登入失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });

  // ✨ Email/Password 註冊
  document.getElementById("signupBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!role || !email || !password) {
      return alert("請輸入所有欄位");
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("role", role);
      resultEl.textContent = `✅ 註冊成功（${role}），已自動登入`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ 註冊失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });

  // ✨ Google 登入
  document.getElementById("googleLoginBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;

    if (!role) {
      return alert("請選擇身分才能用 Google 登入！");
    }

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      sessionStorage.setItem("role", role);
      resultEl.textContent = `✅ Google 登入成功：${user.email}，身分：${role}`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ Google 登入失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });
}

export { renderLoginForm };
