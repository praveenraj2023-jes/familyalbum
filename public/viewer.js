const fallbackCoverImage =
  "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80";

let allAlbums = [];
let filteredAlbums = [];

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
  openLink.href = album.googlePhotosUrl;
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
      await navigator.clipboard.writeText(album.googlePhotosUrl);
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

async function loadAlbums() {
  const response = await fetch("/api/albums");
  const albums = await response.json();
  allAlbums = Array.isArray(albums) ? albums : [];
  filteredAlbums = [...allAlbums];
  renderAlbums();
}

setupSearch();
loadAlbums();
