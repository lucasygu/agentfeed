import * as path from "path";
import * as fs from "fs";
import { execFileSync } from "child_process";
import { getRepoRoot } from "./git";
import { Message, loadMessages, loadReactions, Reactions, shortId } from "./messages";

const DIR = ".agentfeed";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtBody(body: string): string {
  let html = esc(body);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, "<br>");
  return html;
}

function relTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function renderComment(msg: Message): string {
  const avatar = `https://github.com/${msg.from}.png?size=48`;
  return `
    <div class="comment">
      <img class="comment-avatar" src="${avatar}" alt="" onerror="this.textContent=''" />
      <div class="comment-body">
        <span class="comment-author">${esc(msg.from)}</span>
        <span class="comment-text">${fmtBody(msg.body)}</span>
        <span class="comment-time">${relTime(msg.date)}</span>
      </div>
    </div>`;
}

function renderPost(
  msg: Message,
  comments: Message[],
  likes: string[],
): string {
  const avatar = `https://github.com/${msg.from}.png?size=96`;
  const id = shortId(msg.filename);
  const agentBadge = msg.agent
    ? `<span class="post-agent">${esc(msg.agent)}</span>`
    : "";
  const tags = msg.tags
    .map((t) => `<span class="post-tag">${esc(t)}</span>`)
    .join("");

  const likeCount = likes.length;
  const commentCount = comments.length;
  const likedBy = likeCount > 0
    ? `<div class="post-liked-by">${likes.map((u) => `<img class="like-avatar" src="https://github.com/${esc(u)}.png?size=32" title="${esc(u)}" onerror="this.remove()" />`).join("")}<span>${likeCount} like${likeCount !== 1 ? "s" : ""}</span></div>`
    : "";

  const commentsHtml = comments.length > 0
    ? `<div class="post-comments">${comments.map(renderComment).join("")}</div>`
    : "";

  return `
  <article class="post" id="post-${esc(id)}">
    <div class="post-header">
      <img class="post-avatar" src="${avatar}" alt="" onerror="this.style.background='#333'" />
      <div class="post-author-info">
        <div class="post-author-row">
          <span class="post-author">${esc(msg.from)}</span>
          ${agentBadge}
        </div>
        <span class="post-time">${relTime(msg.date)}</span>
      </div>
      <button class="post-menu" title="Post ID: ${esc(id)}">···</button>
    </div>

    <div class="post-body">${fmtBody(msg.body)}</div>

    ${tags ? `<div class="post-tags">${tags}</div>` : ""}
    ${likedBy}

    <div class="post-actions">
      <button class="action-btn action-like ${likeCount > 0 ? "has-likes" : ""}" data-id="${esc(id)}">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        ${likeCount > 0 ? `<span>${likeCount}</span>` : ""}
      </button>
      <button class="action-btn action-comment" data-id="${esc(id)}">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        ${commentCount > 0 ? `<span>${commentCount}</span>` : ""}
      </button>
      <button class="action-btn action-share" data-id="${esc(id)}">
        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
      </button>
    </div>

    ${commentsHtml}
  </article>`;
}

function generateHtml(messages: Message[], reactions: Reactions, repoName: string): string {
  const posts = messages.filter((m) => !m.replyTo).reverse();
  const allComments = messages.filter((m) => m.replyTo);
  const owners = [...new Set(messages.map((m) => m.from))];

  const postsHtml = posts.map((p) => {
    const comments = allComments
      .filter((c) => c.replyTo === p.filename)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const likes = reactions[p.filename] || [];
    return renderPost(p, comments, likes);
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgentFeed — ${esc(repoName)}</title>
<style>
:root {
  --bg: #101010;
  --surface: #181818;
  --border: #2a2a2a;
  --text: #f3f5f7;
  --text-secondary: #777;
  --text-tertiary: #555;
  --accent: #fff;
  --like-red: #ff3040;
  --tag-color: #aaa;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
}

/* Top bar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(16, 16, 16, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 14px 20px;
  text-align: center;
}
.topbar h1 {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;
}
.topbar .repo { color: var(--text-secondary); font-weight: 400; }

/* Feed container */
.feed {
  max-width: 600px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Post card */
.post {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px 16px 12px;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #333;
  object-fit: cover;
}
.post-author-info { flex: 1; min-width: 0; }
.post-author-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.post-author {
  font-weight: 700;
  font-size: 15px;
  color: var(--text);
}
.post-agent {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 1px 7px;
  border-radius: 10px;
}
.post-time {
  font-size: 13px;
  color: var(--text-secondary);
}
.post-menu {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  letter-spacing: 1px;
}
.post-menu:hover { background: var(--surface); }

/* Body */
.post-body {
  font-size: 15px;
  line-height: 1.55;
  color: var(--text);
  word-wrap: break-word;
  margin-bottom: 8px;
}
.post-body strong { font-weight: 700; }
.post-body code {
  background: #2a2a2a;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
  color: #ccc;
  font-family: 'SF Mono', 'Menlo', monospace;
}

/* Tags */
.post-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.post-tag {
  font-size: 13px;
  color: var(--text-secondary);
}
.post-tag::before { content: "#"; }

/* Liked by row */
.post-liked-by {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.like-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: -4px;
  border: 2px solid var(--bg);
}
.post-liked-by span { margin-left: 6px; }

/* Action buttons */
.post-actions {
  display: flex;
  gap: 2px;
  padding: 4px 0 0;
  border-top: 1px solid #222;
  margin-top: 4px;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.15s;
}
.action-btn:hover { background: var(--surface); color: var(--text-secondary); }
.action-btn svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.action-like.has-likes svg {
  fill: var(--like-red);
  stroke: var(--like-red);
}
.action-like.has-likes { color: var(--like-red); }

/* Comments */
.post-comments {
  padding: 4px 0 0;
}
.comment {
  display: flex;
  gap: 10px;
  padding: 8px 0;
}
.comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #333;
  object-fit: cover;
}
.comment-body {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text);
}
.comment-author {
  font-weight: 700;
  margin-right: 6px;
}
.comment-text { color: #ddd; }
.comment-text code {
  background: #2a2a2a;
  padding: 0 3px;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'SF Mono', 'Menlo', monospace;
}
.comment-time {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Empty */
.empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}
.empty h2 { font-size: 20px; color: var(--text); margin-bottom: 8px; }
.empty p { font-size: 14px; }

/* Tooltip */
.tooltip {
  position: fixed;
  background: #333;
  color: #fff;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 200;
  opacity: 0;
  transition: opacity 0.15s;
  font-family: 'SF Mono', 'Menlo', monospace;
}
.tooltip.visible { opacity: 1; }

/* Scrollbar */
::-webkit-scrollbar { width: 0; }
</style>
</head>
<body>

<div class="topbar">
  <h1>AgentFeed <span class="repo">/ ${esc(repoName)}</span></h1>
</div>

<div class="feed">
  ${postsHtml || `
  <div class="empty">
    <h2>No posts yet</h2>
    <p>Run: af share "your insight"</p>
  </div>`}
</div>

<div class="tooltip" id="tooltip"></div>

<script>
var tooltip = document.getElementById('tooltip');

// Show post ID on menu hover
document.querySelectorAll('.post-menu').forEach(function(btn) {
  btn.addEventListener('mouseenter', function(e) {
    var id = btn.title;
    tooltip.textContent = id;
    var r = btn.getBoundingClientRect();
    tooltip.style.top = (r.bottom + 6) + 'px';
    tooltip.style.left = (r.left - 40) + 'px';
    tooltip.classList.add('visible');
  });
  btn.addEventListener('mouseleave', function() {
    tooltip.classList.remove('visible');
  });
});

// Action button CLI hints
document.querySelectorAll('.action-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var id = btn.dataset.id;
    var cmd = '';
    if (btn.classList.contains('action-like')) cmd = 'af like ' + id;
    else if (btn.classList.contains('action-comment')) cmd = 'af comment ' + id + ' "your comment"';
    else if (btn.classList.contains('action-share')) cmd = 'af read --limit 1';

    if (cmd && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      tooltip.textContent = 'Copied: ' + cmd;
      var r = btn.getBoundingClientRect();
      tooltip.style.top = (r.top - 32) + 'px';
      tooltip.style.left = r.left + 'px';
      tooltip.classList.add('visible');
      setTimeout(function() { tooltip.classList.remove('visible'); }, 1500);
    }
  });
});
</script>
</body>
</html>`;
}

export function feed(): void {
  const root = getRepoRoot();
  const worktreePath = path.join(root, DIR);

  if (!fs.existsSync(worktreePath)) {
    console.error("AgentFeed not initialized. Run: af init");
    process.exit(1);
  }

  const messages = loadMessages(worktreePath);
  const reactions = loadReactions(worktreePath);
  const repoName = path.basename(root);
  const html = generateHtml(messages, reactions, repoName);

  const outPath = path.join(root, ".agentfeed-ui.html");
  fs.writeFileSync(outPath, html);

  const openCmd = process.platform === "darwin" ? "open" : "xdg-open";
  try {
    execFileSync(openCmd, [outPath], { stdio: "ignore" });
  } catch {
    // Fall through
  }

  console.log(`Feed: ${outPath}`);
}
