import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
import apiClient from '../api/axios';
import { toast } from 'react-hot-toast';

export default function AuthTest() {
  const navigate = useNavigate();
  const {
    isLoading,
    isAuthenticated,
    user,
    login,
    register,
    updateProfile,
    changePassword,
    uploadAvatar,
    logout,
    refetchUser
  } = useAuth();

  // ── Tabs and Form States ──────────────────────────────────────────────────
  const [activeAuthTab, setActiveAuthTab] = useState('login'); // login | register
  const [activeActionTab, setActiveActionTab] = useState('profile'); // profile | avatar | password | users | listings | notifications

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerAge, setRegisterAge] = useState('');
  const [registerGender, setRegisterGender] = useState('Not Specified');
  const [isRegistering, setIsRegistering] = useState(false);

  // Update Profile Form
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileInstitution, setProfileInstitution] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileGender, setProfileGender] = useState('Not Specified');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // File Upload Form
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // System Status
  const [serverStatus, setServerStatus] = useState('checking'); // checking | online | offline
  const [dbStatus, setDbStatus] = useState('checking');
  const [redisStatus, setRedisStatus] = useState('checking');
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [systemLogs, setSystemLogs] = useState([]);

  // Social & Project States
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const [listings, setListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingCategory, setListingCategory] = useState('dev-project');
  const [listingPrice, setListingPrice] = useState('');
  const [isCreatingListing, setIsCreatingListing] = useState(false);

  const [activeListingId, setActiveListingId] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const socketRef = useRef(null);

  // ── Add Logs Helper ───────────────────────────────────────────────────────
  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs((prev) => [{ time, message, type }, ...prev]);
  };

  // ── Run Server Health Check ───────────────────────────────────────────────
  const checkHealth = async () => {
    try {
      setServerStatus('checking');
      const { data } = await apiClient.get('/health');
      setServerStatus('online');
      setDbStatus(data.services?.database === 'connected' ? 'online' : 'offline');
      setRedisStatus(data.services?.redis === 'connected' ? 'online' : 'offline');
      addLog(`System Health Check: Server, DB & Redis are online.`, 'success');
    } catch (err) {
      setServerStatus('offline');
      setDbStatus('offline');
      setRedisStatus('offline');
      addLog(`System Health Check Failed: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Sync profile update inputs when user state changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileBio(user.bio || '');
      setProfileInstitution(user.institution || '');
      setProfileAge(user.age !== undefined && user.age !== null ? user.age : '');
      setProfileGender(user.gender || 'Not Specified');
      addLog(`Loaded profile for ${user.name} (${user.email})`, 'info');
    }
  }, [user]);

  // ── Socket.io Connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
      addLog(`Initializing Socket connection to ${socketUrl}...`, 'info');
      
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        setSocketStatus('connected');
        addLog(`Socket connected: ${socket.id}`, 'success');
        socket.emit('register-user', user._id);
      });

      socket.on('disconnect', (reason) => {
        setSocketStatus('disconnected');
        addLog(`Socket disconnected: ${reason}`, 'warning');
      });

      socket.on('connect_error', (err) => {
        setSocketStatus('error');
        addLog(`Socket connection error: ${err.message}`, 'error');
      });

      socket.on('new-notification', (notif) => {
        toast.success(notif.message, { icon: '🔔' });
        setNotifications((prev) => [notif, ...prev]);
        addLog(`[Socket Event] New Notification: ${notif.message}`, 'success');
        refetchUser(); // Refresh user following/followers stats if applicable
      });

      socketRef.current = socket;

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } else {
      setSocketStatus('disconnected');
      socketRef.current = null;
    }
  }, [isAuthenticated, user]);

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingUsers(true);
      const { data } = await apiClient.get('/users');
      setUsers(data.data || []);
      addLog('Fetched users directory', 'info');
    } catch (err) {
      addLog(`Failed to fetch users: ${err.message}`, 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchListings = async () => {
    try {
      setIsLoadingListings(true);
      const { data } = await apiClient.get('/listings');
      setListings(data.data || []);
      addLog('Fetched active project listings', 'info');
    } catch (err) {
      addLog(`Failed to fetch listings: ${err.message}`, 'error');
    } finally {
      setIsLoadingListings(false);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingNotifications(true);
      const { data } = await apiClient.get('/notifications');
      setNotifications(data.data || []);
      addLog('Fetched notification history', 'info');
    } catch (err) {
      addLog(`Failed to fetch notifications: ${err.message}`, 'error');
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Fetch contextual data when tabs switch
  useEffect(() => {
    if (activeActionTab === 'users') {
      fetchUsers();
    } else if (activeActionTab === 'listings') {
      fetchListings();
    } else if (activeActionTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeActionTab, isAuthenticated]);

  // Fetch comments when active listing changes
  const fetchComments = async (listingId) => {
    try {
      setIsLoadingComments(true);
      const { data } = await apiClient.get(`/listings/${listingId}/comments`);
      setComments(data.data || []);
      addLog(`Fetched comments for listing ${listingId}`, 'info');
    } catch (err) {
      addLog(`Failed to fetch comments: ${err.message}`, 'error');
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (activeListingId) {
      fetchComments(activeListingId);
    } else {
      setComments([]);
    }
  }, [activeListingId]);

  // ── Submit Handlers ────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoggingIn(true);
    addLog(`Attempting login for ${loginEmail}...`, 'info');
    try {
      const loggedUser = await login(loginEmail, loginPassword);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      addLog(`Login successful for ${loggedUser.email}`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Login failed: ${errMsg}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsRegistering(true);
    addLog(`Creating account for ${registerEmail}...`, 'info');
    try {
      const newUser = await register(
        registerName,
        registerEmail,
        registerPassword,
        registerAge ? parseInt(registerAge) : undefined,
        registerGender
      );
      toast.success('Registration successful!');
      addLog(`Account created: ${newUser.email}`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Registration failed: ${errMsg}`, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    addLog('Updating profile details...', 'info');
    try {
      await updateProfile({
        name: profileName,
        bio: profileBio,
        institution: profileInstitution,
        age: profileAge ? parseInt(profileAge) : null,
        gender: profileGender,
      });
      toast.success('Profile updated!');
      addLog('Profile details updated successfully', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Profile update failed: ${errMsg}`, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    setIsChangingPassword(true);
    addLog('Updating password...', 'info');
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      addLog('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Password change failed: ${errMsg}`, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      addLog(`Selected file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
    }
  };

  const handleUploadAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      toast.error('Please select an image file first');
      return;
    }
    setIsUploading(true);
    addLog('Uploading avatar image to Cloudinary...', 'info');
    try {
      await uploadAvatar(avatarFile);
      toast.success('Avatar uploaded successfully!');
      addLog('Avatar uploaded and profile updated', 'success');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Avatar upload failed: ${errMsg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    addLog('Logging out...', 'info');
    try {
      await logout();
      toast.success('Logged out successfully');
      addLog('User session cleared', 'success');
    } catch (err) {
      addLog(`Logout warning: ${err.message}`, 'warning');
    }
  };

  const handleGoogleLogin = () => {
    addLog('Redirecting to Google OAuth...', 'info');
    window.location.href = '/api/auth/google';
  };

  // ── Social Operations ──────────────────────────────────────────────────────
  const handleFollow = async (userId) => {
    try {
      addLog(`Sending follow request for user ${userId}...`, 'info');
      const { data } = await apiClient.post(`/users/${userId}/follow`);
      toast.success(data.message || 'Followed successfully');
      addLog(`Followed user ${userId}`, 'success');
      fetchUsers();
      refetchUser();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Follow failed: ${errMsg}`, 'error');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      addLog(`Sending unfollow request for user ${userId}...`, 'info');
      const { data } = await apiClient.post(`/users/${userId}/unfollow`);
      toast.success(data.message || 'Unfollowed successfully');
      addLog(`Unfollowed user ${userId}`, 'success');
      fetchUsers();
      refetchUser();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Unfollow failed: ${errMsg}`, 'error');
    }
  };

  // ── Listing Operations ─────────────────────────────────────────────────────
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!listingTitle || !listingDescription || !listingPrice) {
      toast.error('Title, description and price are required');
      return;
    }

    try {
      setIsCreatingListing(true);
      addLog('Submitting new listing data...', 'info');
      const { data } = await apiClient.post('/listings', {
        title: listingTitle,
        description: listingDescription,
        category: listingCategory,
        price: parseFloat(listingPrice),
        domain: 'Web Dev'
      });
      toast.success('Listing created successfully!');
      addLog(`Listing created: "${data.data?.title}"`, 'success');
      setListingTitle('');
      setListingDescription('');
      setListingPrice('');
      fetchListings();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Listing creation failed: ${errMsg}`, 'error');
    } finally {
      setIsCreatingListing(false);
    }
  };

  const handleLikeListing = async (listingId) => {
    try {
      addLog(`Liking listing ${listingId}...`, 'info');
      const { data } = await apiClient.post(`/listings/${listingId}/like`);
      toast.success(data.message);
      addLog(`Liked listing ${listingId}`, 'success');
      fetchListings();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Like failed: ${errMsg}`, 'error');
    }
  };

  // ── Comment Operations ─────────────────────────────────────────────────────
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      addLog(`Posting comment to listing ${activeListingId}...`, 'info');
      const { data } = await apiClient.post(`/listings/${activeListingId}/comments`, {
        text: newCommentText
      });
      toast.success('Comment posted!');
      addLog('Comment posted successfully', 'success');
      setNewCommentText('');
      fetchComments(activeListingId);
      // Update local listing comment count indicator
      fetchListings();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Failed to post comment: ${errMsg}`, 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      addLog(`Deleting comment ${commentId}...`, 'info');
      await apiClient.delete(`/listings/comments/${commentId}`);
      toast.success('Comment deleted successfully');
      addLog('Comment deleted', 'success');
      fetchComments(activeListingId);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      toast.error(errMsg);
      addLog(`Failed to delete comment: ${errMsg}`, 'error');
    }
  };

  // ── Notification Operations ────────────────────────────────────────────────
  const handleMarkNotificationsRead = async () => {
    try {
      addLog('Marking all notifications as read...', 'info');
      await apiClient.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      addLog('Notifications marked as read', 'success');
      fetchNotifications();
    } catch (err) {
      addLog(`Failed to mark notifications read: ${err.message}`, 'error');
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/30">
            PB
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ProjBazaar Diagnostics Console
            </h1>
            <p className="text-xs text-slate-500">Social, Likes, Comments & Pub/Sub Notifications Dashboard</p>
          </div>
        </div>

        {/* System Connections */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button 
            onClick={checkHealth}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            🔄 Refresh System
          </button>
          
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Server:</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${
              serverStatus === 'online' ? 'text-emerald-400' : serverStatus === 'checking' ? 'text-amber-400' : 'text-rose-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : serverStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              {serverStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Database:</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${
              dbStatus === 'online' ? 'text-emerald-400' : dbStatus === 'checking' ? 'text-amber-400' : 'text-rose-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                dbStatus === 'online' ? 'bg-emerald-400' : dbStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              {dbStatus === 'online' ? 'CONNECTED' : dbStatus === 'checking' ? 'CHECKING' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Redis:</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${
              redisStatus === 'online' ? 'text-emerald-400' : redisStatus === 'checking' ? 'text-amber-400' : 'text-rose-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                redisStatus === 'online' ? 'bg-emerald-400' : redisStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
              {redisStatus === 'online' ? 'CONNECTED' : redisStatus === 'checking' ? 'CHECKING' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">WS Socket:</span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${
              socketStatus === 'connected' ? 'text-emerald-400' : socketStatus === 'disconnected' ? 'text-slate-400' : 'text-rose-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                socketStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`} />
              {socketStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left Column: Auth Section */}
        <section className="lg:col-span-4 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col shadow-xl h-fit">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p>Checking authentication status...</p>
            </div>
          ) : !isAuthenticated ? (
            /* Unauthenticated View */
            <div className="flex-1 flex flex-col">
              {/* Form Selector Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveAuthTab('login')}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeAuthTab === 'login'
                      ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-900/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔑 Sign In
                </button>
                <button
                  onClick={() => setActiveAuthTab('register')}
                  className={`flex-1 py-4 text-center font-medium transition ${
                    activeAuthTab === 'register'
                      ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-900/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✨ Create Account
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                {activeAuthTab === 'login' ? (
                  /* Login Form */
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50"
                    >
                      {isLoggingIn ? 'Logging in...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  /* Register Form */
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="Vikas Patel"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="vikas@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Age</label>
                        <input
                          type="number"
                          placeholder="e.g. 20"
                          value={registerAge}
                          onChange={(e) => setRegisterAge(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                        <select
                          value={registerGender}
                          onChange={(e) => setRegisterGender(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition text-slate-300"
                        >
                          <option value="Not Specified">Not Specified</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50"
                    >
                      {isRegistering ? 'Registering...' : 'Register'}
                    </button>
                  </form>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950/60 px-2 text-slate-500 font-medium">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg py-2.5 text-sm transition flex items-center justify-center gap-2.5 border border-slate-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h4.01c2.34-2.16 3.68-5.32 3.68-8.75z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.95 1.19-3.05 0-5.64-2.06-6.57-4.83H1.32v3.23A12 12 0 0 0 12 24z"/>
                    <path fill="#FBBC05" d="M5.43 14.32a7.18 7.18 0 0 1 0-4.64V6.45H1.32a12 12 0 0 0 0 11.1l4.11-3.23z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 1.32 6.45l4.11 3.23c.93-2.77 3.52-4.83 6.57-4.83z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated View: User Details */
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-500 bg-slate-800"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-2xl ring-2 ring-purple-500">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {user.name}
                    </h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <span className="inline-block bg-purple-900/40 text-purple-300 border border-purple-800 text-xs px-2 py-0.5 rounded-full font-semibold mt-1">
                      Role: {user.role?.toUpperCase() || 'BUYER'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 block uppercase font-semibold">Followers</span>
                    <span className="text-lg font-bold text-white">{user.followers?.length || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 block uppercase font-semibold">Following</span>
                    <span className="text-lg font-bold text-white">{user.following?.length || 0}</span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-950/80 rounded-xl p-4 border border-slate-850 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Database ID:</span>
                    <span className="font-mono text-slate-300 select-all text-xs">{user._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-slate-300">{user.googleId ? 'Google OAuth' : 'Local Email'}</span>
                  </div>
                  {user.institution && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Institution:</span>
                      <span className="text-slate-300">{user.institution}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Age:</span>
                    <span className="text-slate-300">{user.age !== undefined && user.age !== null ? user.age : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gender:</span>
                    <span className="text-slate-300">{user.gender || 'Not Specified'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400">Bio:</span>
                    <p className="text-slate-300 text-xs italic bg-slate-900 p-2.5 rounded border border-slate-800/50">
                      {user.bio || 'No bio provided.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg py-2 text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-900/10"
                >
                  👤 View My Premium Profile UI ↗️
                </button>
                <button
                  onClick={refetchUser}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-medium rounded-lg py-2 text-sm transition"
                >
                  🔄 Refresh My Session
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-rose-950/60 border border-rose-900/60 hover:bg-rose-900 hover:border-rose-800 text-rose-200 font-medium rounded-lg py-2 text-sm transition"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Protected Management Actions */}
        <section className="lg:col-span-8 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col shadow-xl relative min-h-[500px]">
          
          {/* Overlay to disable actions if not logged in */}
          {!isAuthenticated && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-xl mb-4 border border-slate-800">
                🔒
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Protected Operations</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Authentication is required to view directory, interact with projects, post comments, or read real-time alerts.
              </p>
            </div>
          )}

          {/* Action Tabs Header */}
          <div className="flex border-b border-slate-800 overflow-x-auto select-none">
            {[
              { id: 'profile', label: '📝 Profile' },
              { id: 'avatar', label: '🖼️ Avatar' },
              { id: 'password', label: '🔒 Security' },
              { id: 'users', label: '👥 Directory' },
              { id: 'listings', label: '📁 Projects' },
              {
                id: 'notifications',
                label: (
                  <span className="relative inline-flex items-center gap-1.5">
                    🔔 Notifications
                    {unreadNotifCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-2" />
                    )}
                    {unreadNotifCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                        {unreadNotifCount}
                      </span>
                    )}
                  </span>
                )
              }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveActionTab(tab.id)}
                className={`px-4 py-4 text-center font-medium transition text-xs whitespace-nowrap flex-1 ${
                  activeActionTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-900/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Content Panel */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[600px]">
            {activeActionTab === 'profile' && (
              /* Profile Update Form */
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h3 className="text-md font-bold text-slate-200">Update Profile Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Institution</label>
                  <input
                    type="text"
                    value={profileInstitution}
                    placeholder="e.g. Stanford University"
                    onChange={(e) => setProfileInstitution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Age</label>
                    <input
                      type="number"
                      value={profileAge}
                      onChange={(e) => setProfileAge(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition text-slate-300"
                    >
                      <option value="Not Specified">Not Specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Short Bio</label>
                  <textarea
                    rows="3"
                    value={profileBio}
                    placeholder="Tell us about yourself..."
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeActionTab === 'avatar' && (
              /* Avatar Cloudinary Upload Form */
              <form onSubmit={handleUploadAvatar} className="space-y-4">
                <h3 className="text-md font-bold text-slate-200">Upload Profile Avatar (Cloudinary)</h3>
                
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-purple-500 rounded-xl p-8 transition bg-slate-950/30 text-center relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  
                  {avatarPreview ? (
                    <div className="space-y-3">
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-full object-cover mx-auto ring-2 ring-purple-500"
                      />
                      <p className="text-xs text-slate-400">Click or drag another image to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-3xl block">📁</span>
                      <p className="text-sm text-slate-300 font-medium">Click to select an image</p>
                      <p className="text-xs text-slate-500">Supports PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    {avatarFile ? `Ready to upload: ${avatarFile.name}` : 'No file chosen'}
                  </span>
                  <button
                    type="submit"
                    disabled={isUploading || !avatarFile}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading to Cloudinary...' : 'Upload Avatar'}
                  </button>
                </div>
              </form>
            )}

            {activeActionTab === 'password' && (
              /* Password Change Form */
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="text-md font-bold text-slate-200">Change Account Password</h3>
                {user?.googleId && !user?.password && (
                  <div className="p-3 bg-amber-950/40 text-amber-200 border border-amber-900/60 rounded-lg text-xs leading-relaxed">
                    ⚠️ <strong>OAuth Connected</strong>: This account is logged in via Google OAuth. You can only set or change a password if you registered via email.
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={user?.googleId && !user?.password}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition disabled:opacity-40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={user?.googleId && !user?.password}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-sm focus:outline-none transition disabled:opacity-40"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChangingPassword || (user?.googleId && !user?.password)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            )}

            {activeActionTab === 'users' && (
              /* Users Directory tab */
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-md font-bold text-slate-200">Registered Users Directory</h3>
                  <button
                    onClick={fetchUsers}
                    className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    🔄 Refresh Directory
                  </button>
                </div>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : users.length <= 1 ? (
                  <p className="text-slate-500 italic text-sm">No other users registered in database yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users
                      .filter(u => u._id !== user._id)
                      .map((u) => {
                        const isFollowing = user.following?.includes(u._id) || u.followers?.includes(user._id);
                        return (
                          <div key={u._id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col justify-between gap-3 hover:border-slate-800 transition">
                            <div className="flex gap-3">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="h-10 w-10 rounded-full object-cover bg-slate-900" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-purple-400">
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-semibold text-white truncate text-sm">{u.name}</h4>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="inline-block bg-slate-900 text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-semibold">
                                    {u.role}
                                  </span>
                                  <button
                                    onClick={() => navigate(`/profile/${u._id}`)}
                                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold transition"
                                  >
                                    View Profile ↗️
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-xs">
                              <span className="text-slate-500">
                                Followers: <strong className="text-slate-300">{u.followers?.length || 0}</strong>
                              </span>
                              {isFollowing ? (
                                <button
                                  onClick={() => handleUnfollow(u._id)}
                                  className="px-3 py-1 rounded bg-rose-950/60 border border-rose-900 text-rose-200 font-medium hover:bg-rose-900 transition text-[11px]"
                                >
                                  Unfollow
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleFollow(u._id)}
                                  className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium transition text-[11px]"
                                >
                                  Follow
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {activeActionTab === 'listings' && (
              /* Projects / Listings Sandbox */
              <div className="space-y-6">
                
                {/* Create Listing Form Gated */}
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide">📦 Publish a Test Project</h3>
                  <form onSubmit={handleCreateListing} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Chat app with Redis"
                          value={listingTitle}
                          onChange={(e) => setListingTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price (INR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 499"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition text-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                      <textarea
                        rows="2"
                        placeholder="Describe your side project stack, design and details..."
                        value={listingDescription}
                        onChange={(e) => setListingDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none transition resize-none text-slate-200"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <select
                        value={listingCategory}
                        onChange={(e) => setListingCategory(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs rounded px-2.5 py-1 focus:outline-none text-slate-400"
                      >
                        <option value="dev-project">Dev Project</option>
                        <option value="college-notes">College Notes</option>
                        <option value="school-notes">School Notes</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isCreatingListing}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs disabled:opacity-50 transition"
                      >
                        {isCreatingListing ? 'Publishing...' : 'Publish Project'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Listings Directory */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-md font-bold text-slate-200">Active Listings Directory</h3>
                    <button
                      onClick={fetchListings}
                      className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      🔄 Refresh Projects
                    </button>
                  </div>

                  {isLoadingListings ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : listings.length === 0 ? (
                    <p className="text-slate-500 italic text-sm text-center">No projects published on ProjBazaar yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {listings.map((item) => (
                        <div key={item._id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col justify-between gap-3 relative hover:border-slate-800 transition">
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-semibold uppercase">
                                {item.category}
                              </span>
                              <span className="text-xs font-bold text-emerald-400">₹{item.price}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                          </div>

                          <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">By:</span>
                              <span className="font-semibold text-slate-300 truncate max-w-[150px]">{item.seller?.name || 'Unknown Seller'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs pt-1.5">
                              {/* Likes indicator */}
                              <button
                                onClick={() => handleLikeListing(item._id)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border ${
                                  item.likes?.includes(user._id)
                                    ? 'border-purple-500 text-purple-400'
                                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                                } transition text-[11px]`}
                              >
                                💜 Like ({item.likesCount || 0})
                              </button>

                              {/* Comments trigger */}
                              <button
                                onClick={() => setActiveListingId(activeListingId === item._id ? null : item._id)}
                                className={`px-2.5 py-1 rounded border transition text-[11px] ${
                                  activeListingId === item._id
                                    ? 'bg-purple-950/40 border-purple-800 text-purple-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                💬 Comments
                              </button>
                            </div>
                          </div>

                          {/* Comments drawer inside the card */}
                          {activeListingId === item._id && (
                            <div className="mt-4 pt-4 border-t border-slate-850 space-y-3 z-10 bg-slate-950/90 rounded-b-xl">
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Comments Section</h5>
                              
                              {/* Comment List */}
                              {isLoadingComments ? (
                                <div className="h-8 flex items-center justify-center">
                                  <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              ) : comments.length === 0 ? (
                                <p className="text-slate-600 italic text-[11px]">No comments posted yet. Be the first!</p>
                              ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin pr-1 text-[11px]">
                                  {comments.map((comment) => (
                                    <div key={comment._id} className="p-2 bg-slate-900/60 rounded border border-slate-850 flex justify-between items-start gap-2">
                                      <div className="min-w-0">
                                        <span className="font-semibold text-slate-300 block">{comment.user?.name || 'User'}</span>
                                        <p className="text-slate-400 leading-relaxed mt-0.5">{comment.text}</p>
                                      </div>
                                      
                                      {/* Deletion Check */}
                                      {(comment.user?._id === user._id || item.seller?._id === user._id || user.role === 'admin') && (
                                        <button
                                          onClick={() => handleDeleteComment(comment._id)}
                                          className="text-rose-500 hover:text-rose-400 hover:scale-105 transition text-[10px]"
                                          title="Delete comment"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Comment Form */}
                              <form onSubmit={handleAddComment} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={newCommentText}
                                  onChange={(e) => setNewCommentText(e.target.value)}
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-purple-600"
                                />
                                <button
                                  type="submit"
                                  disabled={isSubmittingComment || !newCommentText.trim()}
                                  className="px-3 py-1 bg-purple-600 rounded text-xs text-white hover:bg-purple-500 disabled:opacity-40"
                                >
                                  Post
                                </button>
                              </form>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeActionTab === 'notifications' && (
              /* Notifications Center */
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-md font-bold text-slate-200">Alert Center & Notifications Feed</h3>
                  <div className="flex gap-2">
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkNotificationsRead}
                        className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                      >
                        ✔ Mark All Read
                      </button>
                    )}
                    <button
                      onClick={fetchNotifications}
                      className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      🔄 Refresh Alerts
                    </button>
                  </div>
                </div>

                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-slate-500 italic text-sm text-center">No notifications received yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                          notif.isRead
                            ? 'bg-slate-950/40 border-slate-900 text-slate-400'
                            : 'bg-purple-950/20 border-purple-900/60 text-slate-200'
                        }`}
                      >
                        <div className="text-base select-none">
                          {notif.type === 'new_listing' ? '📦' :
                           notif.type === 'new_follow' ? '👥' :
                           notif.type === 'new_comment' ? '💬' : '💜'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-purple-500 self-center" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Terminal Logger at the Bottom */}
      <footer className="max-w-7xl w-full mx-auto px-4 md:px-6 pb-6">
        <div className="bg-slate-900/60 backdrop-blur rounded-xl border border-slate-850 p-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Developer Event Console
            </h3>
            <button
              onClick={() => setSystemLogs([])}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Clear Logs
            </button>
          </div>
          <div className="h-32 overflow-y-auto font-mono text-xs space-y-1 bg-slate-950/70 p-3 rounded-lg border border-slate-900 scrollbar-thin">
            {systemLogs.length === 0 ? (
              <span className="text-slate-600 italic">No events recorded. Perform auth operations to see responses.</span>
            ) : (
              systemLogs.map((log, index) => (
                <div key={index} className="flex gap-2.5">
                  <span className="text-slate-600">{log.time}</span>
                  <span className={`font-semibold ${
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-rose-400' :
                    log.type === 'warning' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-slate-300 select-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
