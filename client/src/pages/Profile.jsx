import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, MoreHorizontal, Bell, Bookmark, Camera, Video,
  UserPlus, Send, Music, BadgeCheck, Sparkles,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import apiClient from '../api/axios';
import { toast } from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DESIGN TOKENS                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const BG       = '#f3f3f3';
const CARD_BG  = '#efefef';
const TEXT     = '#222222';
const MUTED    = '#666666';

/* Neumorphic shadow for NON-clipped elements (buttons, pills) */
const NEU_UP   = '-5px -5px 12px rgba(255,255,255,0.92), 5px 5px 12px rgba(0,0,0,0.09)';
const NEU_DOWN = 'inset -3px -3px 6px rgba(255,255,255,0.88), inset 3px 3px 6px rgba(0,0,0,0.07)';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PLACEHOLDER IMAGES                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
const PROJECT_IMGS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  'https://images.unsplash.com/photo-1501386761578-eaa54b9a0a5b?w=600&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
];
const BANNER = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=90&auto=format&fit=crop';
const AVATAR_PH = 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  REUSABLE CONTAINER WITH RESPONSIVE DUAL-CLIP OUTLINE                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ClippedCard({ children, borderClass, innerClass, style = {} }) {
  return (
    <div style={{ filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.06))', ...style }}>
      {/* Outer wrapper provides the 1.5px white outline border */}
      <div className={borderClass} style={{ padding: '1.5px' }}>
        {/* Inner container with same clip-path holds card content */}
        <div className={innerClass} style={{
          background: CARD_BG,
          position: 'relative',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SMALL COMPONENTS                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DecorativeDots({ n = 9, style = {} }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, ...style }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: '#999', opacity: 0.22 }} />
      ))}
    </div>
  );
}

function CircularStamp() {
  return (
    <div style={{ position: 'relative', width: 90, height: 90 }}>
      <svg viewBox="0 0 90 90" width="90" height="90" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="45" cy="45" r="41" fill="none" stroke="rgba(180,180,180,0.5)" strokeWidth="1.2" />
        <circle cx="45" cy="45" r="33" fill="none" stroke="rgba(180,180,180,0.25)" strokeWidth="0.8" />
        <defs>
          <path id="stamp-arc" d="M 45,45 m -33,0 a 33,33 0 1,1 66,0 a 33,33 0 1,1 -66,0" />
        </defs>
        <text fontSize="8" fontWeight="600" letterSpacing="2" fill="rgba(160,160,160,0.85)">
          <textPath href="#stamp-arc" startOffset="3%">ARE · RARER · RARER ·</textPath>
        </text>
      </svg>
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900, color: 'rgba(150,150,150,0.9)', letterSpacing: 1.5,
      }}>PB</span>
    </div>
  );
}

function NeuAvatar({ src, name, size = 140 }) {
  const ring = size + 22;
  return (
    <div style={{ position: 'relative', width: ring, height: ring, flexShrink: 0 }}>
      <div style={{
        width: ring, height: ring, borderRadius: '50%',
        background: CARD_BG,
        boxShadow: '-10px -10px 24px rgba(255,255,255,0.95), 10px 10px 24px rgba(0,0,0,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          overflow: 'hidden', background: '#ddd',
          boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.6), inset 2px 2px 6px rgba(0,0,0,0.14)',
        }}>
          <img
            src={src || AVATAR_PH}
            alt={name || 'avatar'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 14, right: 2,
        width: 16, height: 16, borderRadius: '50%',
        background: CARD_BG,
        boxShadow: '-2px -2px 5px rgba(255,255,255,0.95), 2px 2px 5px rgba(0,0,0,0.10)',
        border: '1px solid rgba(255,255,255,0.6)',
      }} />
    </div>
  );
}

function TagPill({ children }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '5px 15px',
      borderRadius: 999,
      fontSize: 12, fontWeight: 500, color: MUTED,
      background: CARD_BG,
      boxShadow: NEU_UP,
    }}>
      {children}
    </span>
  );
}

function StatBlock({ label, value }) {
  const fmt = (n) => {
    const num = Number(n) || 0;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 72 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.13em' }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 800, color: TEXT, lineHeight: 1 }}>
        {fmt(value)}
      </span>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 22px', borderRadius: 16,
        border: 'none', cursor: 'pointer',
        background: active ? '#e4e4e4' : CARD_BG,
        boxShadow: active ? NEU_DOWN : NEU_UP,
        fontSize: 13, fontWeight: 600, color: TEXT,
        outline: 'none', transition: 'box-shadow 0.2s',
      }}
    >
      {icon}{label}
    </motion.button>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      style={{
        padding: '6px 18px', borderRadius: 999,
        fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
        background: active ? '#fafafa' : 'transparent',
        color: active ? TEXT : MUTED,
        boxShadow: active ? NEU_UP : 'none',
        transition: 'all 0.18s',
      }}
    >
      {label}
    </motion.button>
  );
}

function ProjectCard({ project, idx, currentUser, onLike, onCommentToggle, isActive, comments, isLoadingComments, newComment, setNewComment, onSubmitComment, onDeleteComment }) {
  const ICONS = [<Video size={11} />, <Bookmark size={11} />, <Camera size={11} />];
  const isLiked = currentUser && project.likes?.includes(currentUser._id);
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      style={{
        borderRadius: 18, overflow: 'hidden',
        background: CARD_BG,
        boxShadow: '-5px -5px 12px rgba(255,255,255,0.92), 5px 5px 12px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', cursor: 'pointer',
        width: '100%',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img
          src={PROJECT_IMGS[idx % PROJECT_IMGS.length]}
          alt={project.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          {ICONS[idx % 3]}
        </div>
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '2px 8px',
          fontSize: 10, fontWeight: 700, color: '#fff',
        }}>
          ₹{project.price}
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{project.title}</p>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={e => { e.stopPropagation(); onLike(project._id); }}
            style={{
              flex: 1, fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none',
              padding: '5px 0', cursor: 'pointer',
              background: isLiked ? '#ece8f5' : CARD_BG,
              color: isLiked ? '#7c3aed' : MUTED,
              boxShadow: isLiked ? NEU_DOWN : '-2px -2px 4px rgba(255,255,255,0.9), 2px 2px 4px rgba(0,0,0,0.06)',
            }}
          >♥ {project.likesCount || 0}</button>
          <button
            onClick={e => { e.stopPropagation(); onCommentToggle(project._id); }}
            style={{
              flex: 1, fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none',
              padding: '5px 0', cursor: 'pointer',
              background: isActive ? '#e0e0e2' : CARD_BG, color: MUTED,
              boxShadow: isActive ? NEU_DOWN : '-2px -2px 4px rgba(255,255,255,0.9), 2px 2px 4px rgba(0,0,0,0.06)',
            }}
          >💬 {comments?.length || ''}</button>
        </div>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {isLoadingComments ? (
                  <p style={{ fontSize: 10, color: MUTED, textAlign: 'center', margin: 0 }}>Loading…</p>
                ) : comments.length === 0 ? (
                  <p style={{ fontSize: 10, color: MUTED, fontStyle: 'italic', margin: 0 }}>No comments yet.</p>
                ) : (
                  <div style={{ maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {comments.map(c => (
                      <div key={c._id} style={{ background: BG, borderRadius: 6, padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: NEU_DOWN }}>
                        <div>
                          <strong style={{ fontSize: 9, color: TEXT }}>{c.user?.name}</strong>
                          <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{c.text}</p>
                        </div>
                        {(c.user?._id === currentUser?._id || currentUser?.role === 'admin') && (
                          <button onClick={() => onDeleteComment(c._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05', fontSize: 11 }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={e => { e.preventDefault(); onSubmitComment(project._id); }} style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text" placeholder="Write comment…" value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    style={{ flex: 1, fontSize: 11, border: 'none', borderRadius: 6, padding: '5px 8px', background: BG, boxShadow: NEU_DOWN, outline: 'none', color: TEXT }}
                  />
                  <button type="submit" style={{ fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 6, padding: '5px 10px', background: CARD_BG, boxShadow: '-2px -2px 4px rgba(255,255,255,0.9), 2px 2px 4px rgba(0,0,0,0.06)', cursor: 'pointer', color: TEXT }}>Post</button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, refetchUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [listings,    setListings]    = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [activeFilter, setActiveFilter]       = useState('All');
  const [activeListingId, setActiveListingId] = useState(null);
  const [comments,    setComments]            = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment,  setNewComment]          = useState('');
  const [isSubmitting, setIsSubmitting]       = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const tid = id || currentUser?._id;
      if (!tid) { setIsLoading(false); return; }
      const { data } = await apiClient.get(`/users/${tid}`);
      setProfileUser(data.data?.user || null);
      setListings(data.data?.listings || []);
    } catch { toast.error('Failed to load profile'); }
    finally { setIsLoading(false); }
  };

  const fetchComments = async (lid) => {
    try {
      setIsLoadingComments(true);
      const { data } = await apiClient.get(`/listings/${lid}/comments`);
      setComments(data.data || []);
    } catch { /* noop */ }
    finally { setIsLoadingComments(false); }
  };

  useEffect(() => { fetchProfile(); }, [id, currentUser?._id]);
  useEffect(() => { if (activeListingId) fetchComments(activeListingId); else setComments([]); }, [activeListingId]);

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    const isF = profileUser.followers?.includes(currentUser._id);
    try {
      const { data } = await apiClient.post(`/users/${profileUser._id}/${isF ? 'unfollow' : 'follow'}`);
      toast.success(data.message); fetchProfile(); refetchUser();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLike = async (lid) => {
    if (!isAuthenticated) { toast.error('Please sign in'); return; }
    try {
      const { data } = await apiClient.post(`/listings/${lid}/like`);
      toast.success(data.message); fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCommentToggle = (lid) => setActiveListingId(activeListingId === lid ? null : lid);

  const onSubmitComment = async (lid) => {
    if (!newComment.trim()) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/listings/${lid}/comments`, { text: newComment });
      toast.success('Comment posted!'); setNewComment(''); fetchComments(lid);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteComment = async (cid) => {
    try {
      await apiClient.delete(`/listings/comments/${cid}`);
      toast.success('Deleted'); fetchComments(activeListingId);
    } catch { toast.error('Failed'); }
  };

  const isFollowing  = currentUser && profileUser?.followers?.includes(currentUser._id);
  const isOwnProfile = currentUser?._id === profileUser?._id;
  const FILTERS      = ['All', 'Photos', 'Videos', 'Reels'];

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '2.5px solid #ccc', borderTopColor: '#999', borderRadius: '50%' }}
      />
    </div>
  );

  if (!profileUser) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>Profile Not Found</h2>
      <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Log in or navigate from the Console.</p>
      <motion.button
        whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/')}
        style={{ padding: '10px 24px', background: CARD_BG, borderRadius: 14, border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: NEU_UP, color: TEXT, fontSize: 14 }}
      >← Return to Console</motion.button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

        /* RESPONSIVE LAYOUT STYLES */
        .profile-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px;
        }
        @media (max-width: 768px) {
          .profile-container {
            padding: 0 16px;
          }
        }

        /* Combined Card Custom Clip-Paths */
        .hero-card-border {
          background: rgba(255, 255, 255, 0.85);
          clip-path: polygon(
            0px 16px, 
            16px 0px, 
            calc(100% - 90px) 0px, 
            calc(100% - 90px) 46px, 
            100% 46px, 
            100% calc(100% - 14px - 16px), 
            calc(100% - 16px) calc(100% - 14px), 
            calc(52% + 16px) calc(100% - 14px), 
            52% calc(100% - 14px), 
            52% 100%, 
            16px 100%, 
            0px calc(100% - 16px)
          );
        }
        .hero-card-inner {
          clip-path: polygon(
            0px 16px, 
            16px 0px, 
            calc(100% - 90px) 0px, 
            calc(100% - 90px) 46px, 
            100% 46px, 
            100% calc(100% - 14px - 16px), 
            calc(100% - 16px) calc(100% - 14px), 
            calc(52% + 16px) calc(100% - 14px), 
            52% calc(100% - 14px), 
            52% 100%, 
            16px 100%, 
            0px calc(100% - 16px)
          );
        }
        @media (max-width: 768px) {
          .hero-card-border {
            clip-path: polygon(16px 0px, calc(100% - 16px) 0px, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0px calc(100% - 16px), 0px 16px);
          }
          .hero-card-inner {
            clip-path: polygon(16px 0px, calc(100% - 16px) 0px, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0px calc(100% - 16px), 0px 16px);
          }
        }

        .projects-card-border {
          background: rgba(255, 255, 255, 0.85);
          clip-path: polygon(16px 0px, calc(100% - 16px) 0px, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0px calc(100% - 16px), 0px 16px);
        }
        .projects-card-inner {
          clip-path: polygon(16px 0px, calc(100% - 16px) 0px, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0px calc(100% - 16px), 0px 16px);
        }

        /* Avatar + Profile info alignment */
        .hero-info-row {
          display: flex;
          align-items: flex-end;
          gap: 26px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .hero-info-row {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
          }
        }

        .hero-avatar-wrapper {
          margin-top: -55px;
          position: relative;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .hero-avatar-wrapper {
            margin-top: -65px;
          }
        }

        /* Name + Verified Badge alignment */
        .hero-name-container {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 3px;
        }
        @media (max-width: 768px) {
          .hero-name-container {
            justify-content: center;
          }
        }

        /* Bio & Institution text */
        .hero-bio-line {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 13px;
        }
        @media (max-width: 768px) {
          .hero-bio-line {
            justify-content: center;
            flex-wrap: wrap;
          }
        }

        /* Tags container alignment */
        .hero-tags-container {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .hero-tags-container {
            justify-content: center;
          }
        }

        /* Bookmark button & Decorative stamp */
        .hero-bookmark-btn {
          position: absolute;
          top: 18px;
          right: 110px;
        }
        @media (max-width: 768px) {
          .hero-bookmark-btn {
            right: 18px;
          }
        }

        .hero-stamp-wrapper {
          position: absolute;
          bottom: 14px;
          right: 24px;
        }
        @media (max-width: 768px) {
          .hero-stamp-wrapper {
            display: none;
          }
        }

        /* Bottom row (Stats + Buttons) alignment */
        .hero-bottom-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          padding: 0 34px 20px;
          margin-top: -6px;
        }
        @media (max-width: 768px) {
          .hero-bottom-row {
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding: 0 20px 24px;
          }
        }

        .hero-stats-container {
          display: flex;
          align-items: center;
          padding-bottom: 4px;
        }
        @media (max-width: 768px) {
          .hero-stats-container {
            justify-content: center;
            width: 100%;
          }
        }

        .hero-stats-divider {
          width: 1px;
          height: 38px;
          background: rgba(0,0,0,0.07);
          margin: 0 26px;
          box-shadow: -1px 0 2px rgba(255,255,255,0.8);
        }
        @media (max-width: 480px) {
          .hero-stats-divider {
            margin: 0 12px;
          }
        }

        .hero-buttons-container {
          display: flex;
          gap: 10px;
          padding-bottom: 16px;
        }
        @media (max-width: 768px) {
          .hero-buttons-container {
            padding-bottom: 0;
          }
        }

        /* Projects card header spacing */
        .projects-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 30px 34px 20px;
        }
        @media (max-width: 768px) {
          .projects-header {
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 24px 20px 16px;
          }
        }

        /* Projects responsive columns layout */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          padding: 0 34px 38px;
        }
        @media (max-width: 900px) {
          .projects-grid {
            grid-template-columns: repeat(2, 1fr);
            padding: 0 24px 28px;
          }
        }
        @media (max-width: 550px) {
          .projects-grid {
            grid-template-columns: 1fr;
            padding: 0 16px 24px;
            gap: 14px;
          }
        }
      `}</style>

      <div className="profile-container">

        {/* ── NAVBAR ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' }}>
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', padding: 4 }}>
            <Menu size={20} strokeWidth={1.8} />
          </motion.button>
          <div style={{ display: 'flex', gap: 20 }}>
            <motion.button whileTap={{ scale: 0.95 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
              <MoreHorizontal size={20} strokeWidth={1.8} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
              <Bell size={20} strokeWidth={1.8} />
            </motion.button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COMBINED HERO & STATS CARD                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <ClippedCard borderClass="hero-card-border" innerClass="hero-card-inner">
            {/* Banner */}
            <div style={{ position: 'relative', height: 230, overflow: 'hidden' }}>
              <img
                src={BANNER} alt="banner"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.28 }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(239,239,239,0.94) 100%)',
              }} />
              {/* Bookmark */}
              <motion.button
                whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}
                className="hero-bookmark-btn"
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(239,239,239,0.55)',
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#999',
                  zIndex: 15,
                }}
              ><Bookmark size={14} strokeWidth={1.8} /></motion.button>
              {/* Stamp */}
              <div className="hero-stamp-wrapper">
                <CircularStamp />
              </div>
              {/* Decorative dots */}
              <DecorativeDots n={9} style={{ position: 'absolute', top: 18, left: 24 }} />
            </div>

            {/* Avatar + Info */}
            <div style={{ padding: '0 34px 20px', position: 'relative', zIndex: 10 }}>
              <div className="hero-info-row">
                <div className="hero-avatar-wrapper">
                  <NeuAvatar src={profileUser.avatar} name={profileUser.name} size={130} />
                </div>
                <div style={{ paddingBottom: 6, flex: 1, minWidth: 200 }}>
                  <div className="hero-name-container">
                    <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
                      {profileUser.name}
                    </h1>
                    <BadgeCheck size={21} fill="#3b82f6" color="#fff" strokeWidth={1.5} />
                  </div>
                  <p style={{ margin: '0 0 5px', fontSize: 12, color: MUTED, fontWeight: 500 }}>
                    @{profileUser.name?.toLowerCase().replace(/\s+/g, '.') || 'user'}
                  </p>
                  <div className="hero-bio-line">
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
                      {profileUser.institution || 'ProjBazaar'}
                    </span>
                    <span style={{ color: '#bbb' }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: TEXT }}>
                      <Music size={12} style={{ color: MUTED }} />
                      {listings[0]?.title || 'Still with you'}
                    </span>
                  </div>
                  <div className="hero-tags-container">
                    {['Singer', 'Songwriter', 'Producer', ...(profileUser.isVerifiedSeller ? ['Seller'] : [])].map(t => (
                      <TagPill key={t}>{t}</TagPill>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Topo lines decoration */}
            <svg width="160" height="55" viewBox="0 0 160 55" style={{ position: 'absolute', bottom: 70, right: 160, opacity: 0.05, pointerEvents: 'none' }}>
              <ellipse cx="80" cy="27" rx="72" ry="23" fill="none" stroke="#444" strokeWidth="1" />
              <ellipse cx="80" cy="27" rx="52" ry="16" fill="none" stroke="#444" strokeWidth="1" />
              <ellipse cx="80" cy="27" rx="32" ry="10" fill="none" stroke="#444" strokeWidth="1" />
            </svg>

            {/* Divider line inside card */}
            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '10px 34px 18px', borderBottom: '1px solid rgba(255,255,255,0.8)' }} />

            {/* Stats + Buttons Row */}
            <div className="hero-bottom-row">
              {/* Stats */}
              <div className="hero-stats-container">
                <StatBlock label="Posts" value={listings.length} />
                <div className="hero-stats-divider" />
                <StatBlock label="Followers" value={profileUser.followers?.length || 0} />
                <div className="hero-stats-divider" />
                <StatBlock label="Following" value={profileUser.following?.length || 0} />
              </div>

              {/* Buttons */}
              <div className="hero-buttons-container">
                {!isOwnProfile ? (
                  <>
                    <ActionBtn
                      icon={<UserPlus size={14} strokeWidth={2} />}
                      label={isFollowing ? 'Following' : 'Follow'}
                      onClick={handleFollow}
                      active={isFollowing}
                    />
                    <ActionBtn
                      icon={<Send size={14} strokeWidth={2} />}
                      label="Message"
                      onClick={() => toast.success('Message coming soon!')}
                    />
                  </>
                ) : (
                  <div style={{ height: 42 }} />
                )}
              </div>
            </div>
          </ClippedCard>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PROJECTS SECTION                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginTop: 20 }}
        >
          <ClippedCard borderClass="projects-card-border" innerClass="projects-card-inner">
            <DecorativeDots n={9} style={{ position: 'absolute', top: 18, right: 24 }} />

            {/* Header */}
            <div className="projects-header">
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT, display: 'flex', alignItems: 'center', gap: 9 }}>
                Projects <Sparkles size={14} color={MUTED} strokeWidth={1.8} />
              </h2>
              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 2, background: '#e4e4e4', borderRadius: 999, padding: '3px 5px', boxShadow: NEU_DOWN }}>
                {FILTERS.map(f => (
                  <FilterPill key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="projects-grid">
              {listings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '55px 0', width: '100%', color: MUTED, fontSize: 14, fontStyle: 'italic' }}>
                  No projects published yet.
                </div>
              ) : (
                listings.map((p, idx) => (
                  <ProjectCard
                    key={p._id} project={p} idx={idx}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onCommentToggle={handleCommentToggle}
                    isActive={activeListingId === p._id}
                    comments={activeListingId === p._id ? comments : []}
                    isLoadingComments={isLoadingComments}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    onSubmitComment={onSubmitComment}
                    onDeleteComment={handleDeleteComment}
                  />
                ))
              )}
            </div>
          </ClippedCard>
        </motion.div>

      </div>
    </div>
  );
}
