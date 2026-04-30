const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const session = require("express-session");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const albumsFilePath = path.join(dataDir, "albums.json");
const defaultAlbumsFilePath = path.join(__dirname, "data", "albums.json");

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));

function isLikelyGooglePhotosLink(url) {
  try {
    const parsedUrl = new URL(url);
    const validHosts = ["photos.google.com", "photos.app.goo.gl"];
    return validHosts.includes(parsedUrl.hostname.toLowerCase());
  } catch (error) {
    return false;
  }
}

function normalizeAlbum(album) {
  const title = String(album.title || "").trim();
  const description = String(album.description || "").trim();
  const googlePhotosUrl = String(album.googlePhotosUrl || "").trim();
  const coverImage = String(album.coverImage || "").trim();

  if (!title || !googlePhotosUrl || !isLikelyGooglePhotosLink(googlePhotosUrl)) {
    return null;
  }

  return {
    title,
    description: description || "No description provided.",
    googlePhotosUrl,
    coverImage:
      coverImage ||
      "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80",
  };
}

async function readAlbums() {
  try {
    const content = await fs.readFile(albumsFilePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function writeAlbums(albums) {
  await fs.writeFile(albumsFilePath, JSON.stringify(albums, null, 2), "utf8");
}

async function ensureAlbumsStorage() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(albumsFilePath);
  } catch (_error) {
    const defaultContent = await fs.readFile(defaultAlbumsFilePath, "utf8");
    await fs.writeFile(albumsFilePath, defaultContent, "utf8");
  }
}

function requireAdmin(req, res, next) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

app.get("/api/albums", async (_req, res) => {
  const albums = await readAlbums();
  res.json(albums);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin });
});

app.post("/api/admin/albums", requireAdmin, async (req, res) => {
  const normalizedAlbum = normalizeAlbum(req.body);
  if (!normalizedAlbum) {
    return res.status(400).json({ error: "Invalid album data" });
  }

  const albums = await readAlbums();
  albums.unshift(normalizedAlbum);
  await writeAlbums(albums);
  return res.json({ ok: true, album: normalizedAlbum });
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

async function startServer() {
  await ensureAlbumsStorage();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
