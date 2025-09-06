# ALX Polly - Interactive Polling Application

A modern, secure polling application built with Next.js 15 that allows users to create polls, share them via unique links and QR codes, and collect votes in real-time.

## 🚀 Project Overview

ALX Polly is a full-stack web application that enables users to:
- Create and manage interactive polls with multiple options
- Share polls via unique URLs and QR codes
- Vote on polls with duplicate prevention
- View real-time voting results
- Manage polls through a user-friendly dashboard
- Admin panel for poll oversight and user management

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database & Authentication**: Supabase
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Server Components with React Server Actions
- **QR Code Generation**: qrcode.react
- **Security**: DOMPurify for XSS prevention
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Git

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 2. Supabase Configuration

#### Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to Settings > API to get your project credentials

#### Database Schema Setup
Run the following SQL in your Supabase SQL Editor:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, poll_id)
);

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create their own polls" ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own polls" ON polls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own polls" ON polls FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all user roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage user roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard > Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard > Settings > API > Project API keys > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard > Settings > API > Project API keys > service_role (keep secret!)

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 📖 Usage Examples

### Creating a Poll

1. **Register/Login**: Create an account or sign in
2. **Navigate to Create**: Click "Create Poll" in the dashboard
3. **Fill Poll Details**:
   ```
   Question: "What's your favorite programming language?"
   Options: 
   - JavaScript
   - Python
   - TypeScript
   - Go
   ```
4. **Submit**: Click "Create Poll" to generate your poll
5. **Share**: Use the generated URL or QR code to share

### Voting on a Poll

1. **Access Poll**: Click on a poll link or scan QR code
2. **Select Option**: Choose your preferred option
3. **Submit Vote**: Click "Vote" (one vote per user per poll)
4. **View Results**: See real-time voting results

### Managing Polls

- **View All Polls**: Dashboard shows all your created polls
- **Edit Poll**: Click "Edit" to modify question/options
- **Delete Poll**: Click "Delete" to remove a poll
- **View Analytics**: See vote counts and percentages

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Poll creation with validation
- [ ] Poll editing and deletion
- [ ] Voting functionality
- [ ] Duplicate vote prevention
- [ ] QR code generation
- [ ] Admin panel access (if admin role)
- [ ] Responsive design on mobile/desktop

## 🔧 Development

### Project Structure

```
alx-polly/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   ├── lib/               # Utilities and actions
│   │   ├── actions/       # Server Actions
│   │   ├── utils/         # Utility functions
│   │   └── supabase/      # Supabase clients
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── ui/               # shadcn/ui components
├── lib/                  # Additional utilities
└── public/               # Static assets
```

### Key Features

- **Server Components**: Data fetching happens on the server
- **Server Actions**: Form submissions use Next.js Server Actions
- **Type Safety**: Full TypeScript coverage
- **Security**: Input validation, XSS prevention, RLS policies
- **Real-time**: Automatic data revalidation

### Code Style

- Use Server Components by default
- Client Components only when interactivity is needed
- Server Actions for all mutations
- Comprehensive error handling
- Input validation and sanitization

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) policies
- **Input Validation**: Server-side validation with DOMPurify
- **XSS Prevention**: HTML sanitization
- **CSRF Protection**: Built-in Next.js protection
- **Environment Variables**: Secure credential management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Build Errors**
- Ensure all environment variables are set
- Check Supabase connection
- Verify Node.js version (18+)

**Authentication Issues**
- Verify Supabase project URL and keys
- Check RLS policies are enabled
- Ensure user_roles table exists

**Database Errors**
- Run the SQL schema setup
- Check table permissions
- Verify RLS policies

### Getting Help

- Check the [Issues](../../issues) page
- Review Supabase documentation
- Check Next.js 15 documentation

---

**Built with ❤️ using Next.js 15 and Supabase**
