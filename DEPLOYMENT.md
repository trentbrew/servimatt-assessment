# Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Environment Variables**: Have these ready:
   - `NEXT_PUBLIC_INSTANTDB_ID` - Your InstantDB App ID
   - `INSTANTDB_ADMIN_SECRET` - Your InstantDB Admin Token
   - `OPENAI_API_KEY` - Your OpenAI API Key

## Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub** (already done ✅)
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Vercel will auto-detect the Next.js project

3. **Configure Environment Variables**
   - In the Vercel dashboard, go to Settings → Environment Variables
   - Add all three required variables:
     ```
     NEXT_PUBLIC_INSTANTDB_ID=your_app_id
     INSTANTDB_ADMIN_SECRET=your_admin_token
     OPENAI_API_KEY=your_openai_key
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Future pushes to `main` will auto-deploy

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_INSTANTDB_ID
   vercel env add INSTANTDB_ADMIN_SECRET
   vercel env add OPENAI_API_KEY
   ```

5. **Redeploy with Variables**
   ```bash
   vercel --prod
   ```

## Project Structure

```
app-v1/
├── apps/
│   └── web/              # Main Next.js application
│       ├── app/          # App router pages
│       ├── components/   # React components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utility libraries
├── packages/
│   ├── agent-core/       # OpenAI Agent configuration
│   └── ui/               # Shared UI components
└── package.json          # Monorepo configuration
```

## Features Deployed

✅ **Multi-Agent Chat System**
- Custom agent creation with personalities
- Avatar upload and display
- Agent-specific chat threads

✅ **RAG File Analysis**
- CSV, JSON, Markdown, XLSX, TXT support
- Real-time streaming responses
- Tool usage indicators

✅ **InstantDB Integration**
- Real-time data sync
- File storage and retrieval
- Message persistence

✅ **Modern UI**
- Dark/light mode support
- Responsive design
- Markdown rendering with proper typography
- Fixed sticky input form

## Post-Deployment Checklist

- [ ] Test agent creation
- [ ] Upload a test avatar
- [ ] Upload a CSV file and ask questions
- [ ] Verify streaming responses work
- [ ] Check all agent types (Math, History, Custom)
- [ ] Test on mobile devices

## Troubleshooting

### Build Errors
- Check that all environment variables are set
- Ensure `pnpm` is used (Vercel auto-detects from `pnpm-lock.yaml`)

### Runtime Errors
- Check Vercel Function Logs for detailed errors
- Verify OpenAI API key has sufficient credits
- Ensure InstantDB app is active

### File Upload Issues
- Verify `INSTANTDB_ADMIN_SECRET` is set correctly
- Check file size limits (10MB max)
- Ensure supported file types only

## Support

If issues persist:
1. Check Vercel deployment logs
2. Review browser console errors
3. Verify all environment variables in Vercel dashboard

## Success! 🎉

Your RAG-enhanced multi-agent chat system is now live on Vercel!
