function showEditorView() {
  document.getElementById("login-panel").classList.add("hidden");
  document.getElementById("editor-panel").classList.remove("hidden");
}

function showLoginView() {
  document.getElementById("login-panel").classList.remove("hidden");
  document.getElementById("editor-panel").classList.add("hidden");
}

async function checkSession() {
  const response = await fetch("/api/admin/session");
  const data = await response.json();
  if (data.isAdmin) {
    showEditorView();
  } else {
    showLoginView();
  }
}

function setupLogin() {
  const form = document.getElementById("login-form");
  const status = document.getElementById("login-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      status.textContent = "Invalid username or password.";
      return;
    }

    form.reset();
    showEditorView();
  });
}

function setupAlbumForm() {
  const form = document.getElementById("album-form");
  const status = document.getElementById("form-status");
  const logoutButton = document.getElementById("logout-btn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      googlePhotosUrl: String(formData.get("googlePhotosUrl") || "").trim(),
      coverImage: String(formData.get("coverImage") || "").trim(),
    };

    const response = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      status.textContent = "Session expired. Please login again.";
      showLoginView();
      return;
    }

    if (!response.ok) {
      status.textContent = "Please provide a valid Google Photos album link.";
      return;
    }

    status.textContent = `Album "${payload.title}" added successfully.`;
    form.reset();
  });

  logoutButton.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    showLoginView();
  });
}

setupLogin();
setupAlbumForm();
checkSession();
