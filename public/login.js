// login.js

// ✅ 引入 Firebase App、Auth、Firestore 模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";

// ✅ 引入 firebaseConfig 與 renderDashboard
import { firebaseConfig, renderDashboard } from "./fundamental.js";

// ✅ 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ 設定持久性為「session」
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("✅ 登入狀態只會在這次瀏覽器 session 保存"))
  .catch((err) => console.error("❌ 設定持久性失敗：", err));

// ✅ 監聽使用者登入狀態
onAuthStateChanged(auth, async (user) => {
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "";

  if (user) {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      if (!data.name) {
        // 沒有名字 → 要求輸入
        renderProfileSetup(appDiv, user, data.role);
      } else {
        // 有完整資料 → 直接進 Dashboard
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("name", data.name);
        renderDashboard(appDiv, user);
      }
    } else {
      // 第一次登入 (Firestore 沒資料) → 要求輸入角色和名字
      renderProfileSetup(appDiv, user, null);
    }
  } else {
    renderLoginForm(appDiv);
  }
});

// ✅ 登入/註冊表單
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

  // ✨ Email 登入
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("請輸入所有欄位");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      resultEl.textContent = "✅ 登入成功";
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ 登入失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });

  // ✨ Email 註冊
  document.getElementById("signupBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!role || !email || !password) return alert("請輸入所有欄位");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // 註冊 → 建立 Firestore 紀錄
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        role,
        name: "" // 先空白，之後要求輸入
      });
      resultEl.textContent = `✅ 註冊成功 (${role})，請輸入姓名`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ 註冊失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });

  // ✨ Google 登入
  document.getElementById("googleLoginBtn").addEventListener("click", async () => {
    const role = document.getElementById("role").value;
    if (!role) return alert("請選擇身分才能用 Google 登入！");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✅ 寫入 Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role,
        name: user.displayName || "" // 先存 Google 提供的名字
      }, { merge: true });

      resultEl.textContent = `✅ Google 登入成功：${user.displayName || user.email} (${role})`;
      resultEl.style.color = "green";
    } catch (err) {
      resultEl.textContent = "❌ Google 登入失敗：" + err.message;
      resultEl.style.color = "red";
    }
  });
}

// ✅ 個人檔案設定 (姓名輸入)
function renderProfileSetup(container, user, role) {
  container.innerHTML = `
    <h2>👤 建立個人檔案</h2>
    <p>Email: ${user.email}</p>
    ${
      !role
        ? `<select id="roleSelect" class="input">
            <option value="">請選擇身分</option>
            <option value="student">學生</option>
            <option value="teacher">老師</option>
            <option value="parent">家長</option>
          </select><br>`
        : `<p>角色：${role}</p>`
    }
    <input id="nameInput" class="input" placeholder="輸入姓名"><br>
    <button id="saveProfileBtn" class="btn">儲存</button>
  `;

  document.getElementById("saveProfileBtn").onclick = async () => {
    const name = document.getElementById("nameInput").value.trim();
    if (!name) return alert("請輸入姓名");

    const finalRole = role || document.getElementById("roleSelect").value;
    if (!finalRole) return alert("請選擇角色");

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: finalRole,
      name
    }, { merge: true });

    sessionStorage.setItem("name", name);
    sessionStorage.setItem("role", finalRole);

    alert("✅ 個人檔案已建立");
    renderDashboard(container, user);
  };
}

export { renderLoginForm };
