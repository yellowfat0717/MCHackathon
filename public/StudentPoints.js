// StudentPoints.js
import { getFirestore, doc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { app } from "./fundamental.js"; // ✅ 這裡已經初始化 Firebase

const db = getFirestore(app);
const auth = getAuth(app);

// ✅ 顯示點數
async function showPoints(userId) {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const points = userSnap.data().points || 0;
    document.getElementById("pointsDisplay").innerText = `你的點數：${points}`;
  } else {
    document.getElementById("pointsDisplay").innerText = "找不到使用者資料";
  }
}

// ✅ 監聽登入狀態
onAuthStateChanged(auth, (user) => {
  if (user) {
    showPoints(user.uid);
  } else {
    document.getElementById("pointsDisplay").innerText = "請先登入";
  }
});
