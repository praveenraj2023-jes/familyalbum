const fallbackCoverImage =
  "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80";

let supabase = null;
try {
  supabase = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );
} catch (err) {
  console.warn("Supabase failed to initialize. Check config.js.");
}

function showEditorView() {
  document.getElementById("login-panel").classList.add("hidden");
  document.getElementById("editor-panel").classList.remove("hidden");
}

function showLoginView() {
  document.getElementById("login-panel").classList.remove("hidden");
  document.getElementById("editor-panel").classList.add("hidden");
}

async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
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
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      status.textContent = "Invalid email or password.";
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
      google_photos_url: String(formData.get("googlePhotosUrl") || "").trim(),
      cover_image: String(formData.get("coverImage") || "").trim(),
    };

    if (!payload.title || !payload.google_photos_url) {
      status.textContent = "Please provide title and Google Photos link.";
      return;
    }

    if (!isLikelyGooglePhotosLink(payload.google_photos_url)) {
      status.textContent = "Please provide a valid Google Photos album link.";
      return;
    }

    payload.description = payload.description || "No description provided.";
    payload.cover_image = payload.cover_image || fallbackCoverImage;

    const { error } = await supabase.from("albums").insert(payload);
    if (error) {
      if (error.message.toLowerCase().includes("row-level security")) {
        status.textContent = "Not authorized. Check Supabase RLS policies.";
      } else {
        status.textContent = "Could not save album. Please try again.";
      }
      return;
    }

    status.textContent = `Album "${payload.title}" added successfully.`;
    form.reset();
  });

  logoutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    showLoginView();
  });
}

function isLikelyGooglePhotosLink(url) {
  try {
    const parsedUrl = new URL(url);
    const validHosts = ["photos.google.com", "photos.app.goo.gl"];
    return validHosts.includes(parsedUrl.hostname.toLowerCase());
  } catch (error) {
    return false;
  }
}

setupLogin();
setupAlbumForm();
checkSession();
