const fallbackCoverImage =
  "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80";

let allAlbums = [];
let filteredAlbums = [];
let supabase = null;
try {
  supabase = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );
} catch (err) {
  console.warn("Supabase failed to initialize. Using offline/hardcoded mode.");
}

function createAlbumCard(album) {
  const article = document.createElement("article");
  article.className = "album-card";

  const img = document.createElement("img");
  img.className = "album-thumb";
  img.src = album.coverImage || fallbackCoverImage;
  img.alt = `${album.title} cover`;
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "album-body";

  const title = document.createElement("h3");
  title.className = "album-title";
  title.textContent = album.title;

  const description = document.createElement("p");
  description.className = "album-description";
  description.textContent = album.description || "No description provided.";

  const actions = document.createElement("div");
  actions.className = "album-actions";

  const openLink = document.createElement("a");
  openLink.className = "album-link album-link-primary";
  openLink.href = album.google_photos_url;
  openLink.target = "_blank";
  openLink.rel = "noopener noreferrer";
  openLink.textContent = "Open Album";
  openLink.setAttribute("aria-label", `Open ${album.title} album in Google Photos`);

  const copyButton = document.createElement("button");
  copyButton.className = "album-link album-link-secondary";
  copyButton.type = "button";
  copyButton.textContent = "Copy Link";
  copyButton.setAttribute("aria-label", `Copy ${album.title} album link`);
  copyButton.addEventListener("click", async () => {
    const originalText = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(album.google_photos_url);
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }
    window.setTimeout(() => {
      copyButton.textContent = originalText;
    }, 1500);
  });

  actions.append(openLink, copyButton);
  body.append(title, description, actions);
  article.append(img, body);

  article.addEventListener("click", (event) => {
    if (event.target.closest(".album-link-secondary")) {
      return;
    }
    window.open(album.google_photos_url, "_blank", "noopener,noreferrer");
  });

  return article;
}

function renderAlbums() {
  const albumGrid = document.getElementById("album-grid");
  const albumCount = document.getElementById("album-count");
  albumGrid.innerHTML = "";
  filteredAlbums.forEach((album) => albumGrid.appendChild(createAlbumCard(album)));
  albumCount.textContent = `${filteredAlbums.length} of ${allAlbums.length} albums`;
}

function setupSearch() {
  const input = document.getElementById("album-search");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      filteredAlbums = [...allAlbums];
    } else {
      filteredAlbums = allAlbums.filter((album) => {
        return (
          String(album.title || "").toLowerCase().includes(query) ||
          String(album.description || "").toLowerCase().includes(query)
        );
      });
    }
    renderAlbums();
  });
}

function setupInfoModal() {
  const infoButton = document.getElementById("info-btn");
  const infoModal = document.getElementById("info-modal");
  if (!infoButton || !infoModal) {
    return;
  }

  infoButton.addEventListener("click", () => {
    infoModal.showModal();
  });

  infoModal.addEventListener("click", (event) => {
    const bounds = infoModal.getBoundingClientRect();
    const insideDialog =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!insideDialog) {
      infoModal.close();
    }
  });
}

async function loadAlbums() {
  const customAlbum = {
    title: "A Family Feast Like No Other",
    description: "Enjoy our memorable family feast moments.",
    google_photos_url: "https://photos.app.goo.gl/irSUqdXhfr8bHaaw6",
    coverImage: fallbackCoverImage
  };

  // Render immediately to prevent any blank screen issues
  allAlbums = [customAlbum];
  filteredAlbums = [...allAlbums];
  renderAlbums();

  // If Supabase isn't initialized or still has dummy config, skip fetching
  if (!supabase) return;
  if (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL.includes("YOUR-PROJECT-ID")) return;

  try {
    const { data, error } = await supabase
      .from("albums")
      .select("title, description, google_photos_url, cover_image, created_at")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      allAlbums = data.map((album) => ({
        ...album,
        coverImage: album.cover_image || fallbackCoverImage,
      }));
      allAlbums.unshift(customAlbum);
      filteredAlbums = [...allAlbums];
      renderAlbums();
    }
  } catch (err) {
    console.warn("Supabase fetch error:", err);
  }
}

setupSearch();
setupInfoModal();
loadAlbums();
