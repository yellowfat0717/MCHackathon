// ContactBook.js
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { renderDashboard } from "./fundamental.js";

// ✅ 不再自己初始化 Firebase，db 由外部傳進來
export default async function renderContactBook(container, user, db) {
  container.innerHTML = "";

  const backBtn = document.createElement("button");
  backBtn.textContent = "🏠 回首頁";
  backBtn.className = "btn";
  backBtn.onclick = () => {
    renderDashboard(container, user); // 回首頁
  };
  container.appendChild(backBtn);

  const role = sessionStorage.getItem("role");

  if (role === "teacher") {
    renderTeacherView(container, user, db);
  } else {
    renderStudentParentView(container, user, db);
  }
}

// 👨‍🏫 教師畫面
function renderTeacherView(container, user, db) {
  const wrapper = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = "👨‍🏫 教師聯絡簿填寫";
  wrapper.appendChild(title);

  const textarea = document.createElement("textarea");
  textarea.id = "contactNote";
  textarea.className = "input";
  textarea.placeholder = "輸入今日事項與學生狀況...";
  wrapper.appendChild(textarea);

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "📤 送出";
  submitBtn.className = "btn";
  wrapper.appendChild(submitBtn);

  const result = document.createElement("p");
  result.id = "contactResult";
  wrapper.appendChild(result);

  submitBtn.onclick = async () => {
    const content = textarea.value.trim();
    if (!content) return alert("❗請輸入內容");

    const today = new Date().toISOString().split("T")[0];
    try {
      await setDoc(doc(db, "contactBooks", today), {
        date: today,
        teacherEmail: user.email,
        content: content,
        status: "尚未確認"
      });
      result.textContent = "✅ 聯絡簿已儲存";
      result.style.color = "green";
    } catch (err) {
      result.textContent = "❌ 儲存失敗：" + err.message;
      result.style.color = "red";
    }
  };

  container.appendChild(wrapper);
}

// 👨‍👩‍👧 家長／學生畫面
async function renderStudentParentView(container, user, db) {
  const today = new Date().toISOString().split("T")[0];
  const docRef = doc(db, "contactBooks", today);
  const docSnap = await getDoc(docRef);

  const wrapper = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = "📘 今日聯絡簿內容";
  wrapper.appendChild(title);

  if (docSnap.exists()) {
    const data = docSnap.data();

    const infoBlock = document.createElement("div");
    infoBlock.innerHTML = `
      <p><strong>教師：</strong>${data.teacherEmail}</p>
      <p><strong>內容：</strong>${data.content}</p>
      <p><strong>完成狀態：</strong>${data.status}</p>
    `;
    wrapper.appendChild(infoBlock);

    const completeBtn = document.createElement("button");
    completeBtn.className = "btn";
    completeBtn.textContent = "✅ 已完成";
    completeBtn.onclick = async () => {
      try {
        await setDoc(docRef, {
          ...data,
          status: "已完成"
        });
        alert("✅ 回應成功！");
        location.reload();
      } catch (err) {
        alert("❌ 更新失敗：" + err.message);
      }
    };
    wrapper.appendChild(completeBtn);

  } else {
    const msg = document.createElement("p");
    msg.textContent = "⚠️ 今日尚未有聯絡簿內容。";
    wrapper.appendChild(msg);
  }

  container.appendChild(wrapper);
}
