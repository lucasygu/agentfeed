#!/usr/bin/env node

import { init } from "./init";
import { share } from "./share";
import { read } from "./read";
import { feed } from "./feed";
import { like, comment } from "./interact";
import { sync } from "./sync";

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "init":
    init();
    break;

  case "share": {
    const message = args[0];
    if (!message) {
      console.error("Usage: af share \"your insight here\" [--tags tag1,tag2]");
      process.exit(1);
    }
    const tagsIdx = args.indexOf("--tags");
    const tags =
      tagsIdx !== -1 && args[tagsIdx + 1]
        ? args[tagsIdx + 1].split(",").map((t) => t.trim())
        : undefined;
    share(message, tags);
    break;
  }

  case "read": {
    const limitIdx = args.indexOf("--limit");
    const limit =
      limitIdx !== -1 && args[limitIdx + 1]
        ? parseInt(args[limitIdx + 1], 10)
        : undefined;
    read(limit);
    break;
  }

  case "feed":
    feed();
    break;

  case "like": {
    const postId = args[0];
    if (!postId) {
      console.error("Usage: af like <post-id>");
      process.exit(1);
    }
    like(postId);
    break;
  }

  case "comment": {
    const postId = args[0];
    const message = args[1];
    if (!postId || !message) {
      console.error('Usage: af comment <post-id> "your comment"');
      process.exit(1);
    }
    comment(postId, message);
    break;
  }

  case "sync":
    sync();
    break;

  default:
    console.log(`AgentFeed — Share what your AI learned with your team

Usage:
  af init                              Set up AgentFeed in your repo
  af share "message" [--tags a,b]      Share a curated finding
  af like <post-id>                    Like/unlike a post
  af comment <post-id> "message"       Comment on a post
  af read [--limit N]                  Browse the feed (terminal)
  af feed                              Open the feed UI (browser)
  af sync                              Pull/push manually`);
    break;
}
