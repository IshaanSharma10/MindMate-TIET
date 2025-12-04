# 🚀 Deployment Guide for MindMate

This guide explains how to deploy both the frontend and backend of MindMate.

## 📋 Overview

- **Frontend**: Deployed on Vercel (already done: mindmatetiet.vercel.app)
- **Backend**: Needs to be deployed separately (Render recommended)

---

## 🔧 Backend Deployment (Render)

### Step 1: Create a Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create a New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `IshaanSharma10/visually-alike-build`
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `mindmate-backend` |
| **Region** | Oregon (US West) or closest to you |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | Free |

### Step 3: Add Environment Variables
In Render dashboard, go to **Environment** and add:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Google AI API key |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://mindmatetiet.vercel.app` |

### Step 4: Deploy
Click **"Create Web Service"** and wait for deployment (takes 2-5 minutes).

Your backend URL will be something like:
```
https://mindmate-backend.onrender.com
```

---

## 🌐 Frontend Configuration

### Update the Backend URL

After deploying the backend, update `src/config/api.ts`:

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? "https://mindmate-backend.onrender.com"  // ← Update with your Render URL
    : "http://localhost:5001");
```

### Redeploy Frontend
Push the changes to GitHub:
```bash
git add .
git commit -m "Update backend URL for production"
git push
```

Vercel will automatically redeploy.

---

## 🔥 Firebase Configuration

Make sure these domains are added in Firebase Console → Authentication → Settings → Authorized domains:

- `localhost`
- `mindmatetiet.vercel.app`
- `mindmate-backend.onrender.com` (if needed)

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend health check: `https://mindmate-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://mindmatetiet.vercel.app`
- [ ] Google Sign-in works
- [ ] Chat with AI works
- [ ] Mood tracking works
- [ ] PDF report downloads

---

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors in browser console:
1. Check that your frontend URL is in the `allowedOrigins` array in `server.js`
2. Redeploy the backend

### API Not Responding
1. Check Render logs for errors
2. Verify `GEMINI_API_KEY` is set correctly
3. Make sure the backend is not sleeping (free tier sleeps after 15 min inactivity)

### Google Sign-in Not Working
1. Add domain to Firebase authorized domains
2. Check browser isn't blocking popups

---

## 💰 Free Tier Limitations

### Render Free Tier
- Server sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month free

### Vercel Free Tier
- Unlimited deployments
- 100GB bandwidth/month
- Serverless functions available

---

## 📝 Environment Variables Summary

### Backend (Render)
```env
GEMINI_API_KEY=your_api_key_here
NODE_ENV=production
FRONTEND_URL=https://mindmatetiet.vercel.app
PORT=10000  # Render sets this automatically
```

### Frontend (Vercel) - Optional
```env
VITE_API_URL=https://mindmate-backend.onrender.com
```

---

## 🎉 Done!

Your MindMate app should now be fully deployed and working!

If you need help, check:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

