# Friendsbook

A social network. Users can sign up, build a profile, add friends, post status updates (text + images) on timelines, like and comment, and search for people.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (credentials — email + password)
- **Images**: AWS S3 (presigned upload URLs)
- **Styling**: Tailwind CSS

## Features

- Email/password signup & login
- Profile with cover photo, profile picture, bio, hometown, birthday
- Timeline — post text + images on your own or a friend's timeline
- News feed — posts from friends only (+ your own)
- Like & comment on posts
- Friend requests (send, accept, decline, unfriend)
- Search people by name

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (with public read access disabled; objects served via presigned URLs)

### 2. Install dependencies

```bash
cd friendsbook
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | Your S3 bucket name |

### 4. AWS S3 Setup

1. Create an S3 bucket (e.g. `friendsbook-uploads`)
2. Create an IAM user with **programmatic access** and attach this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

3. Add a CORS policy to your bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

### 5. Set up the database

```bash
npx prisma db push
# or for migrations:
npx prisma migrate dev --name init
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login        # Login page
│   ├── (auth)/signup       # Signup page
│   ├── (main)/feed         # News feed
│   ├── (main)/profile/[id] # User profile + timeline
│   ├── (main)/friends      # Friend requests + friends list
│   ├── (main)/search       # Search people
│   └── api/                # All API routes
│       ├── auth/           # NextAuth + signup
│       ├── users/          # Profile GET/PATCH + search
│       ├── friends/        # Friend system
│       ├── posts/          # Posts, feed, timeline, likes, comments
│       └── upload/         # S3 presigned URL generation
├── components/
│   ├── auth/               # Login/Signup forms, landing page
│   ├── layout/             # Navbar
│   ├── posts/              # PostCard, PostComposer, CommentSection
│   ├── profile/            # EditProfileModal
│   ├── friends/            # FriendRequestsSidebar
│   └── ui/                 # Avatar
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth config
│   ├── s3.ts               # S3 presigned URL helper
│   └── utils.ts            # Utility functions
└── types/                  # TypeScript types
```

## Deployment

For production deployment (e.g. Vercel):

1. Push to GitHub
2. Connect repo in Vercel
3. Add all env vars in Vercel dashboard
4. Update `NEXTAUTH_URL` to your production URL
5. Update S3 CORS `AllowedOrigins` to include your production domain
