"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { backendRequest } from "@/lib/api/backend";
import "./feed-interactions.css";

const REACTION_TYPES = [
  { value: "like", label: "Like", glyph: "👍" },
  { value: "celebrate", label: "Celebrate", glyph: "🎉" },
  { value: "support", label: "Support", glyph: "🙌" },
];

function messageFor(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function countReactions(rows) {
  return rows.reduce((counts, row) => {
    if (row?.reaction && REACTION_TYPES.some((item) => item.value === row.reaction)) {
      counts[row.reaction] = (counts[row.reaction] || 0) + 1;
    }
    return counts;
  }, {});
}

export function FeedInteractions({ postId, currentUserId }) {
  const [reactionRows, setReactionRows] = useState([]);
  const [reactionsLoading, setReactionsLoading] = useState(true);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [reactionError, setReactionError] = useState("");
  const [reactionNotice, setReactionNotice] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentNotice, setCommentNotice] = useState("");

  const loadReactions = useCallback(async () => {
    setReactionsLoading(true);
    setReactionError("");
    try {
      const rows = await backendRequest(`/api/posts/${postId}/reactions`);
      if (!Array.isArray(rows)) throw new Error("The reactions API returned an unexpected response.");
      setReactionRows(rows);
    } catch (error) {
      setReactionError(messageFor(error, "Unable to load reactions."));
    } finally {
      setReactionsLoading(false);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentError("");
    try {
      const rows = await backendRequest(`/api/posts/${postId}/comments`);
      if (!Array.isArray(rows)) throw new Error("The comments API returned an unexpected response.");
      setComments(rows);
      setCommentsLoaded(true);
    } catch (error) {
      setCommentError(messageFor(error, "Unable to load comments."));
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await backendRequest(`/api/posts/${postId}/reactions`);
        if (!Array.isArray(rows)) throw new Error("The reactions API returned an unexpected response.");
        if (active) {
          setReactionRows(rows);
          setReactionError("");
        }
      } catch (error) {
        if (active) setReactionError(messageFor(error, "Unable to load reactions."));
      } finally {
        if (active) setReactionsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [postId]);

  const ownReaction = reactionRows.find((row) => row.user_id === currentUserId)?.reaction || null;
  const counts = countReactions(reactionRows);

  async function chooseReaction(reaction) {
    if (reactionBusy) return;
    setReactionBusy(true);
    setReactionError("");
    setReactionNotice("");
    try {
      if (ownReaction === reaction) {
        await backendRequest(`/api/posts/${postId}/reaction`, { method: "DELETE" });
        setReactionRows((rows) => rows.filter((row) => row.user_id !== currentUserId));
        setReactionNotice("Your reaction was removed.");
      } else {
        const updated = await backendRequest(`/api/posts/${postId}/reaction`, {
          method: "PUT",
          body: JSON.stringify({ reaction }),
        });
        if (!updated || updated.user_id !== currentUserId || updated.post_id !== postId) {
          throw new Error("The reactions API returned an unexpected response. Refresh to verify the change.");
        }
        setReactionRows((rows) => [
          ...rows.filter((row) => row.user_id !== currentUserId),
          updated,
        ]);
        setReactionNotice("Your reaction was saved.");
      }
    } catch (error) {
      setReactionError(messageFor(error, "Unable to update your reaction."));
      // A write may have succeeded even if the response could not be read; refresh before retrying.
      await loadReactions();
    } finally {
      setReactionBusy(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (commentBusy) return;
    const content = commentDraft.trim();
    setCommentError("");
    setCommentNotice("");
    if (!content) {
      setCommentError("Write a comment before submitting.");
      return;
    }
    if (content.length > 2000) {
      setCommentError("Comments can be up to 2,000 characters.");
      return;
    }

    setCommentBusy(true);
    try {
      const created = await backendRequest(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!created || created.post_id !== postId || typeof created.content !== "string") {
        throw new Error("The comments API returned an unexpected response. Refresh to verify the comment.");
      }
      setCommentDraft("");
      setCommentNotice("Your comment was added.");
      try {
        await loadComments();
      } catch {
        // The submit succeeded, but the user can retry loading the list.
      }
    } catch (error) {
      setCommentError(messageFor(error, "Unable to add your comment."));
    } finally {
      setCommentBusy(false);
    }
  }

  async function toggleComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen && !commentsLoaded && !commentsLoading) await loadComments();
  }

  return (
    <section className="feed-interactions" aria-label="Post interactions">
      <div className="feed-interaction-summary" aria-live="polite">
        <span>{reactionsLoading ? "Loading reactions…" : Object.values(counts).reduce((sum, count) => sum + count, 0) + " reactions"}</span>
        <button className="feed-comment-count" type="button" onClick={toggleComments} aria-expanded={commentsOpen}>
          <MessageCircle size={14} /> {commentsLoaded ? comments.length : "Comments"}
        </button>
      </div>

      {reactionError && <p className="feed-interaction-error" role="alert">{reactionError}</p>}
      {reactionNotice && <p className="feed-interaction-notice" role="status">{reactionNotice}</p>}
      <div className="feed-reaction-actions" aria-label="Choose your reaction">
        {REACTION_TYPES.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`feed-reaction-button${ownReaction === item.value ? " is-selected" : ""}`}
            aria-pressed={ownReaction === item.value}
            disabled={reactionBusy || reactionsLoading || !currentUserId}
            onClick={() => chooseReaction(item.value)}
            title={item.label}
          >
            <span aria-hidden="true">{item.glyph}</span>
            <span>{item.label}</span>
            <span className="feed-reaction-count">{counts[item.value] || 0}</span>
          </button>
        ))}
        {reactionBusy && <span className="feed-interaction-pending" role="status">Saving…</span>}
      </div>

      {commentsOpen && (
        <div className="feed-comments-panel">
          <div className="feed-comments-heading">
            <h4>Comments</h4>
            <button type="button" className="feed-retry-button" onClick={loadComments} disabled={commentsLoading}>
              {commentsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>
          {commentsLoading && <p className="feed-comments-state" role="status">Loading comments…</p>}
          {commentError && <p className="feed-interaction-error" role="alert">{commentError}</p>}
          {!commentsLoading && !commentError && commentsLoaded && comments.length === 0 && (
            <p className="feed-comments-state">No comments yet. Start the conversation.</p>
          )}
          {!commentsLoading && comments.map((comment) => (
            <article className="feed-comment" key={comment.id}>
              <div className="feed-comment-author">{comment.author?.full_name || comment.author?.username || "SPORTSLINK Member"}</div>
              <p>{comment.content}</p>
              <time dateTime={comment.created_at}>{comment.created_at ? new Date(comment.created_at).toLocaleString() : ""}</time>
            </article>
          ))}
          {commentNotice && <p className="feed-interaction-notice" role="status">{commentNotice}</p>}
          <form className="feed-comment-form" onSubmit={submitComment}>
            <label className="feed-comment-label" htmlFor={`comment-${postId}`}>Add a comment</label>
            <textarea
              id={`comment-${postId}`}
              value={commentDraft}
              onChange={(event) => { setCommentDraft(event.target.value); setCommentError(""); setCommentNotice(""); }}
              maxLength={2000}
              rows={3}
              placeholder="Write a thoughtful reply…"
              disabled={commentBusy || !currentUserId}
              aria-describedby={`comment-count-${postId}`}
            />
            <div className="feed-comment-form-footer">
              <span id={`comment-count-${postId}`} className="feed-comment-character-count">{commentDraft.length}/2000</span>
              {!currentUserId && <span className="feed-comments-state">Sign in to comment.</span>}
              <button className="button button-primary" type="submit" disabled={commentBusy || !currentUserId || !commentDraft.trim() || commentDraft.trim().length > 2000}>
                {commentBusy ? "Submitting…" : "Comment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
