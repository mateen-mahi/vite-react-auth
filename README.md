# Learnix — LMS Frontend (React + Vite)

The client for **Learnix**, a full-featured Learning Management System: course catalog & enrollment, video lectures with progress tracking, auto-graded quizzes, auto-issued PDF certificates, Stripe checkout, real-time chat, an AI support chatbot, and a full role-based admin dashboard with live analytics.

Built with **React 19 + Vite 8 + React Router v7**, talking to the [`complete-auth-in-express-main`](https://github.com/mateen-mahi/complete-auth-in-express-main) backend over REST + Socket.IO.

> This README replaces the default Vite/React template README that shipped with the project — everything below documents the actual application.

**Backend companion repo:** [`complete-auth-in-express-main`](https://github.com/mateen-mahi/complete-auth-in-express-main)

---

## 🧰 Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19, Vite 8 |
| Routing | React Router v7 (nested layouts + role guards) |
| HTTP | Axios (cookie-based auth, `withCredentials: true`) |
| Real-time | Socket.IO Client (two connections: main + `/admin` namespace) |
| Payments | Stripe.js + `@stripe/react-stripe-js` |
| Rich text | TipTap (`starter-kit`, underline, link, placeholder extensions) — used in Notes |
| Markdown rendering | `react-markdown` + `remark-gfm` + `remark-breaks` — used in the AI chatbot |
| Charts | Recharts — admin analytics |
| Image cropping | `react-easy-crop` — avatar upload |
| Icons | `lucide-react`, `react-icons` |
| Linting | ESLint 10 (flat config) + `eslint-plugin-react-hooks` / `react-refresh` |

---

## 📁 Project Structure

```
src/
├── main.jsx                     # Entry point
├── App.jsx                      # All route definitions
├── index.css / App.css          # Global reset + shared styles
│
├── context/
│   ├── AuthContext.jsx          # Session state, drives socket connect/disconnect
│   └── SideBarContext.jsx       # Sidebar open/collapsed state
│
├── routes/
│   └── RouteGuards.jsx          # GuestRoute / ProtectedRoute / RoleRoute
│
├── services/
│   ├── api.jsx                  # Axios instance (baseURL from env, credentials on)
│   └── stripeClient.js          # Stripe.js loader
│
├── socket/
│   ├── socket.js                # Main Socket.IO connection (chat, presence)
│   └── adminSocket.js           # Separate connection to the /admin namespace
│
├── custom-hooks/
│   ├── useSocket.js             # Wraps socket.js — connection state + presence set
│   └── useAdminSocket.js        # Wraps adminSocket.js — live admin event feed
│
├── config/
│   └── appConfig.js             # App name/logos, sourced from env + assets
│
├── components/
│   ├── Layout.jsx                # Sidebar + Navbar + <Outlet/> + floating ChatWidget
│   ├── Navbar.jsx / Sidebar.jsx
│   ├── AuthLayout.jsx, Button.jsx, Input.jsx, LoadingScreen.jsx
│   ├── Lecture/                  # LectureList, LectureVideoPanel, LectureProgressHeader
│   ├── Quiz/                     # QuizIntro, QuizQuestionCard, QuizNavigatorBubbles, QuizResult, QuizReviewModal
│   ├── chat/                     # ChatAvatar (with presence dot), NewConversationModal
│   ├── Admin/                    # KpiCards, AdminCharts, SystemUsagePanel, LiveActivityPanel,
│   │                              #   ComplaintQueue, UserTable/CourseTable/LectureTable/QuizTable,
│   │                              #   ManagementShortcuts, NotificationsPage, DangerZonePanel, Pagination, EditModal
│   └── admin-shared/             # Reusable admin UI kit — see below
│
├── pages/
│   ├── Signup.jsx, Signin.jsx, VerifyUserMail.jsx, OtpVerification.jsx,
│   │   Forgot-password.jsx, Reset-password.jsx
│   ├── Courses.jsx, LectureAndQuizContainer.jsx, LectureWatching.jsx, QuizPage.jsx
│   ├── Notes.jsx, Certificate.jsx, Complaints.jsx, Profile.jsx, AvatarCropModal.jsx
│   ├── PaymentGateway.jsx
│   ├── chat.jsx, chatWidget.jsx
│   ├── Admin.jsx, superAdmin/Dashboard.jsx
│   ├── Unauthorized.jsx, Error404page.jsx
│   └── admin/                    # One folder per admin management module (see below)
│       ├── UserManagement/, CourseManagement/, LectureManagement/, QuizManagement/,
│       ├── NotesManagement/, BookManagement/, CertificateManagement/,
│       ├── ComplaintManagement/, DangerZone/
│
├── data/
│   └── dummyAdminData.js         # Deterministic mock data for admin UI development
│
└── utils/
    ├── chatHelpers.js            # Time/day formatting, conversation sorting, "deleted" placeholder
    ├── cropImage.js               # Canvas-based crop logic for react-easy-crop output
    ├── loadYoutubeApi.js          # Lazy-loads the YouTube IFrame API for lecture video
    └── withTimeout.js
```

---

## 🗺️ Route Map

Routing is defined in `App.jsx` using three guard layers from `RouteGuards.jsx`:

- **`GuestRoute`** — only accessible when logged out; redirects an already-authenticated user to their role's dashboard.
- **`ProtectedRoute`** — requires any authenticated session; redirects to `/login` otherwise.
- **`RoleRoute`** — requires the user's role to be in an `allowedRoles` list; redirects to `/unauthorized` otherwise.

### Public / guest-only (no sidebar)

| Path | Page | Notes |
|---|---|---|
| `/` | `Courses` | Public course catalog (also reachable as `/courses` when logged in) |
| `/login` | `Signin` | |
| `/signup` | `Signup` | |
| `/verify-user-mail` | `VerifyUserMail` | Prompts for the OTP-verification email |
| `/verify-otp` | `OtpVerification` | 6-digit OTP entry |
| `/forgot-password` | `ForgotPassword` | |
| `/reset-password/:token` | `ResetPassword` | Token comes from the emailed reset link |

### Authenticated (inside `Layout` — sidebar + navbar + floating chat widget)

| Path | Page | Notes |
|---|---|---|
| `/dashboard` | `superAdmin/Dashboard` | Student/instructor dashboard |
| `/courses` | `Courses` | Browse/enroll |
| `/activities/:courseId` | `LectureAndQuizContainer` | Tab switcher between a course's lectures and quizzes |
| `/lectures/:courseId` | `LectureWatching` | Video player + progress tracking |
| `/grand-quiz/:courseId` | `QuizPage` | Timed quiz attempt flow |
| `/profile` | `Profile` | Account info, avatar, login history, password change |
| `/notes` | `Notes` | Personal rich-text notes |
| `/certificate` | `Certificate` | View/generate/download earned certificates |
| `/complaints` | `Complaints` | Submit & track support tickets |
| `/payment-gateway` | `PaymentGateway` | Stripe checkout |
| `/socket-test` | `chat.jsx` | The full chat page (global + DMs) |

### Admin-only (`RoleRoute` → `admin`, `super-admin`)

| Path | Page |
|---|---|
| `/admin` | `Admin` — dashboard shell (KPIs, charts, live activity, system usage, shortcuts) |
| `/admin/user-management` | `UserManagement` |
| `/admin/courses` | `CourseManagement` |
| `/admin/lectures` | `LectureManagement` |
| `/admin/quizzes` | `QuizManagement` |
| `/admin/notes` | `NotesManagement` |
| `/admin/certificates` | `CertificateManagement` |
| `/admin/complaints` | `ComplaintManagement` |
| `/admin/danger-zone` | `DangerZone` — bulk-wipe collections, gated behind a type-to-confirm dialog |

### Fallback

| Path | Page |
|---|---|
| `/unauthorized` | `Unauthorized` |
| `*` | `Error404Page` |

> ⚠️ **Known quirk:** in `RouteGuards.jsx`, `getDashboardPath("super-admin")` currently returns `/payment-gateway` instead of `/admin`. Worth fixing if a super-admin's post-login landing page should be the admin dashboard.

---

## 🧩 Feature Breakdown by Page

### Auth (Signup / Signin / OTP / Forgot / Reset)
Cookie-based session (the backend sets httpOnly JWT cookies — the frontend never touches the token directly). `AuthContext` calls `GET /users/check-auth` on load to hydrate the session and drives the Socket.IO connection lifecycle: connects the socket the moment a user is authenticated, disconnects it the moment they aren't.

### Courses (`Courses.jsx`)
Public catalog (also the `/` landing page for guests), with enroll/unenroll actions once logged in.

### Lectures & Quizzes
- `LectureAndQuizContainer.jsx` — a tab switcher between a course's Lectures and Quiz sections.
- `LectureWatching.jsx` + `components/Lecture/*` — video panel (lazy-loads the YouTube IFrame API via `utils/loadYoutubeApi.js`), a lecture list sidebar, and a progress header; watch progress is saved incrementally.
- `QuizPage.jsx` + `components/Quiz/*` — timed quiz attempt with a question navigator (bubbles showing answered/flagged/unanswered), a review modal before submission, and a results screen.

### Notes (`Notes.jsx`)
Rich-text note-taking using TipTap (bold/underline/links/placeholder), with pin-to-top support.

### Certificates (`Certificate.jsx`)
Shows earned / eligible / locked certificates per course, with a self-serve "generate" action for eligible-but-not-yet-issued certificates.

### Complaints (`Complaints.jsx`)
Submit a support ticket and track its status (pending → in progress → resolved).

### Payment (`PaymentGateway.jsx` + `services/stripeClient.js`)
Stripe Elements checkout flow — fetches a price quote (with promo code support) before creating a PaymentIntent.

### Profile (`Profile.jsx` + `AvatarCropModal.jsx`)
Account details, login-history timeline, password change, and an avatar upload flow that opens a crop modal (`react-easy-crop`, circular crop + zoom) before the image is sent to the backend — cropping math lives in `utils/cropImage.js`.

### Chat (`pages/chat.jsx` full page + `pages/chatWidget.jsx` floating widget)
- **Global chat** — one shared room for every logged-in user.
- **Direct messages** — search and start a 1-to-1 conversation via `NewConversationModal`.
- **Presence** — `ChatAvatar`'s `AvatarWithPresence` variant shows a live online/offline dot, driven by the app-wide `onlineUserIds` set from `useSocket`.
- **Delete for me / delete for everyone**, clear conversation, typing indicators, "seen" receipts, and day-grouped message history — helpers for formatting/grouping/sorting live in `utils/chatHelpers.js`.
- The floating `ChatWidget` (mounted once in `Layout.jsx`, visible on every authenticated page) gives quick access without leaving the current page; `/socket-test` is the full dedicated chat page.

### Admin Dashboard (`pages/Admin.jsx` + `components/Admin/*`)
- **KPI cards** (`KpiCards.jsx`) and **charts** (`AdminCharts.jsx`, via Recharts) — users, revenue, growth.
- **Live system usage panel** (`SystemUsagePanel.jsx`) — CPU/RAM/disk/network, pushed from the backend.
- **Live activity feed** (`LiveActivityPanel.jsx`) — powered by `useAdminSocket`, which connects to a dedicated `/admin` Socket.IO namespace and maintains a rolling feed of the last 50 events (new signups, enrollments, complaints, logins), each with a human-readable label.
- **Management shortcuts grid** (`ManagementShortcuts.jsx`) linking to each admin sub-module.
- **Notifications** (`NotificationsPage.jsx`).

### Admin Management Modules (`pages/admin/*`)
Each of **Users, Courses, Lectures, Quizzes, Notes, Books, Certificates, Complaints** gets its own folder with a table view, search/pagination, and add/edit modals — all built on the shared `admin-shared` component kit (see below) rather than one-off implementations per module. Certificate management additionally includes an **issue certificate** modal and a **verify certificate** modal (checks a certificate number against the public verify endpoint).

### Danger Zone (`pages/admin/DangerZone/`)
Bulk-wipe entire collections (users, courses, lectures, quizzes, etc.), each action behind `DangerConfirmDialog` — a type-to-confirm dialog requiring the admin to type an exact phrase before the wipe proceeds.

### Shared Admin Component Kit (`components/admin-shared/`)
A small internal design system reused across every admin management page instead of being rebuilt per module:

| Component | Purpose |
|---|---|
| `DataTable` | Generic sortable/paginated table |
| `Modal` | Base modal shell |
| `ConfirmDialog` / `DangerConfirmDialog` | Standard confirm vs. type-to-confirm destructive actions |
| `Pagination` | Reusable pager |
| `SearchBar` | Debounced search input |
| `Toast` / `ToastContainer` / `toast.js` | App-wide toast notification system |
| `EmptyState` | Consistent "nothing here yet" placeholder |
| `Spinner` | Loading indicator |
| `BulkJsonUploadModal` | Paste a JSON array to bulk-create records in any module |

---

## 🔍 Sorting, Pagination & Filtering (Backend Contract)

Every list-returning endpoint on the backend now follows **one consistent query-param contract** — `page`, `limit`, `sortBy`, `order`, plus endpoint-specific filters. The shared `DataTable` / `SearchBar` / `Pagination` components in `admin-shared/`, and any page that lists data (`Courses`, `Notes`, `Certificate`, `Complaints`, every `admin/*Management` page), should drive their requests off this same contract rather than sorting/filtering/paginating client-side.

```
?page=<number>        (default 1)
&limit=<number>        (default varies per endpoint, most capped at 50)
&sortBy=<field>        (whitelisted per endpoint — see table below)
&order=asc|desc        (default varies per endpoint — see table below)
&<filter params>       (endpoint-specific — see table below)
```

**Contract rules the UI should account for:**
- `sortBy` only accepts the whitelisted field names below — sending anything else doesn't error, it just silently falls back to that endpoint's default sort. Make sure any "sort by" dropdown only offers whitelisted values.
- `order` accepts `asc`/`desc` only; anything else is treated as `desc`.
- Exact-match filters (`role`, `status`, `gender`, `isPinned`, `completed`, `featured`, etc.) only accept the whitelisted values below — an unrecognized value is silently ignored (not an error), so a stale dropdown value just returns the unfiltered list.
- `search` does a case-insensitive partial match server-side — safe to wire directly to a search box with no client-side escaping needed.
- Filters combine freely (ANDed) with each other and with `sortBy`/`order`/`page`/`limit`.
- **Two endpoints keep pagination opt-in**: lectures-by-course and quizzes-by-course. Leave `page`/`limit` out entirely on `LectureManagement`'s and `QuizManagement`'s per-course views (and `LectureList`) unless a course genuinely has enough lectures/quizzes to warrant paging — sending nothing returns the full list in curriculum order, exactly as before.

### Quick reference

| Endpoint | Sortable fields | Filters | Default sort | Paginated |
|---|---|---|---|---|
| `GET /admin/users` | `username`, `email`, `role`, `gender`, `isVerified`, `createdAt`, `updatedAt` | `role`, `gender`, `isVerified`, `search` | `createdAt desc` | always |
| `GET /books` | `title`, `createdAt`, `updatedAt` | `courseId`, `search` | `createdAt desc` | always |
| `GET /books/course/:courseId` | `title`, `createdAt`, `updatedAt` | *(scoped to courseId in URL)* | `createdAt desc` | always |
| `GET /books/search?q=` | `title`, `createdAt`, `updatedAt` | `q` (required search term) | `createdAt desc` | always |
| `GET /courses` | `title`, `price`, `duration`, `level`, `category`, `createdAt` | `category`, `level`, `featured`, `search` | `createdAt desc` | always |
| `GET /courses/featured` | same as above | `category`, `level`, `search` | `createdAt desc` | ✅ always **(NEW)** |
| `GET /courses/student/:studentId` | same as above | `category`, `level`, `search` | `createdAt desc` | ✅ always **(NEW)** |
| `GET /lectures` | `title`, `duration`, `createdAt` | `courseId`, `search` | `createdAt desc` | always |
| `GET /lectures/course/:courseId` | `title`, `duration`, `createdAt`, `order` | *(scoped to courseId in URL)* | `order asc` (curriculum) | opt-in **(NEW)** |
| `GET /notes` | `title`, `createdAt`, `updatedAt` | `isPinned`, `search` | `isPinned desc, updatedAt desc` | always |
| `GET /notes/user/:userId` | `title`, `createdAt`, `updatedAt` | `isPinned`, `search` | `isPinned desc, updatedAt desc` | ✅ always **(NEW)** |
| `GET /quizzes` | `title`, `subject`, `totalTime`, `createdAt` | `courseId`, `subject`, `search` | `createdAt desc` | always |
| `GET /quizzes/course/:courseId` | `title`, `subject`, `totalTime`, `createdAt`, `order` | *(scoped to courseId in URL)* | `order asc` (curriculum) | opt-in **(NEW)** |
| `GET /admin/complaints` | `status`, `subject`, `createdAt`, `updatedAt` | `status`, `search` | `createdAt desc` | always |
| `GET /complaints/mine` | `status`, `subject`, `createdAt`, `updatedAt` | `status`, `search` | `createdAt desc` | ✅ always **(NEW)** |
| `GET /admin/certificates` | `status`, `grade`, `issuedAt`, `certificateNumber` | `courseId`, `studentId`, `status` | `issuedAt desc` | always |
| `GET /certificates/student/:studentId` | same as above | `status`, `courseId` | `issuedAt desc` | ✅ always **(NEW)** |
| `GET /admin/progress/course/:courseId` | `overallProgress`, `completed`, `updatedAt` | `completed` | `overallProgress desc` | always |
| `GET /progress` (own progress) | `overallProgress`, `completed`, `updatedAt` | `completed` | `updatedAt desc` | opt-in **(NEW)** |

**Filter value whitelists** (must match exactly, case-sensitive): `role` — `student`/`instructor`/`admin`/`super-admin` · `gender` — `male`/`female`/`other` · `isVerified`/`isPinned`/`completed`/`featured` — `true`/`false` · complaint `status` — `pending`/`in progress`/`resolved` (note the **space**, not `in-progress`) · certificate `status` — `active`/`revoked`.

### ⚠️ Response shape changes to account for

These four endpoints changed their response shape (request params were purely additive everywhere else):

1. **`GET /courses/featured`** (used by `Courses.jsx`) — now also returns `total`/`page`/`pages` alongside `data`. Fine if you read `response.data.data` directly; update any code that assumed a bare array or checked the response's key count.
2. **`GET /courses/student/:studentId`** ("my courses") — same as above.
3. **`GET /lectures/course/:courseId`** and **`GET /quizzes/course/:courseId`** (`LectureList`, `LectureManagement`, `QuizManagement`) — now always include a `total` field, even unpaginated. `page`/`pages` only appear once you send `page`/`limit`.
4. **`GET /progress`** (student dashboard) — same opt-in `total`/`page`/`pages` pattern as #3.

### Implementation notes for this frontend

1. **Keep a per-list sort-options config** mapping table columns → `sortBy` value, e.g. for `UserManagement`:
   ```js
   const USER_SORT_OPTIONS = [
     { label: "Name",   value: "username" },
     { label: "Role",   value: "role" },
     { label: "Joined", value: "createdAt" },
   ];
   ```

2. **Clickable `DataTable` headers should toggle order on repeat clicks**, not just re-sort ascending every time:
   ```js
   if (currentSortBy === field) {
     setOrder(order === "asc" ? "desc" : "asc");
   } else {
     setSortBy(field);
     setOrder("asc");
   }
   ```

3. **Build filters as a single state object**, and only append keys that have a real value:
   ```js
   const params = new URLSearchParams();
   if (filters.role) params.set("role", filters.role);
   if (filters.isVerified !== "") params.set("isVerified", filters.isVerified);
   if (filters.search) params.set("search", filters.search);
   params.set("sortBy", sortBy);
   params.set("order", order);
   params.set("page", page);
   params.set("limit", limit);
   ```

4. **Always reset `page` to `1`** whenever any filter, `sortBy`, or `order` changes in a page/component's state — otherwise you can land on an out-of-range page against the new (usually smaller) filtered result set. This applies to every admin management page and to `Notes`/`Complaints`/`Certificate`.

5. **Debounce free-text search** (`SearchBar`, ~300–400ms) before firing the request. Exact-match filter dropdowns and `sortBy`/`order` changes can fire immediately — no debounce needed.

6. **Leave `page`/`limit` out entirely** for the two curriculum-ordered views (lecture/quiz lists scoped to a single course) unless you specifically add "load more" / pagination UI there — the no-params call is simplest and matches the existing default behavior.

7. **Match filter/sort values to the whitelist exactly**, case-sensitive — e.g. any `<select>` for complaint status must use the literal value `"in progress"` (with the space), not `"in-progress"` or `"inProgress"`, or the filter is silently dropped server-side.

8. **Drive `Pagination` off `total`/`pages` (or `totalPages`) from the response**, never compute page count client-side — the server value reflects the *filtered* result count, not the full collection.

9. **Filters and search combine (ANDed)** — e.g. in `UserManagement`, a role tab + a search box can be active together and the request just includes both params.

---

## 🔌 Real-Time Architecture (Socket.IO)

Two independent client connections:

1. **`socket/socket.js`** — the main app socket (chat, presence). `autoConnect: false`; `AuthContext` explicitly connects it once `check-auth` confirms a session, and disconnects it on logout. Wrapped by `useSocket()`, which owns:
   - connection state (`isConnected`, `socketId`, `connectionError`)
   - a live `onlineUserIds` Set, updated via `user-online` / `user-offline` / `online-users` (snapshot on connect) events — registered once at the hook level (not per-page) so presence is never missed for a page that mounts later.

2. **`socket/adminSocket.js`** — a separate connection to the backend's `/admin` namespace, used only by `useAdminSocket()`. Only connected once the frontend already knows the user's role is `admin`/`super-admin` — though, as noted in the hook's own comments, this is a UX nicety only; the actual authorization boundary is enforced server-side.

> ⚠️ **Known quirk:** both `socket.js` and `adminSocket.js` currently hardcode the backend URL (`https://complete-auth-in-express-main.onrender.com`) instead of reading it from `VITE_BACKEND_URI`. If you point `api.jsx` at a different backend (e.g. `localhost:8080` for local dev), remember to update these two files too, or sockets will silently keep talking to the deployed backend.

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/mateen-mahi/vite-react-auth.git
cd vite-react-auth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=Learnix
VITE_BACKEND_URI=http://localhost:8080/api/v1
VITE_STRIPE_ACC_KEY=pk_test_your_stripe_publishable_key
```

- `VITE_BACKEND_URI` — base URL for the Axios instance in `services/api.jsx`. Point this at your running instance of the [backend repo](https://github.com/mateen-mahi/complete-auth-in-express-main).
- `VITE_STRIPE_ACC_KEY` — your Stripe **publishable** key (safe for the client — never put a secret key here).
- `VITE_APP_NAME` — used by `config/appConfig.js` for display purposes.
- Remember the Socket.IO URLs are currently hardcoded (see above) — update `src/socket/socket.js` and `src/socket/adminSocket.js` manually if your backend isn't the deployed Render instance.

### 4. Run the dev server

```bash
npm run dev
```

Vite will print a local dev URL (typically `http://localhost:5173`).

### Other scripts

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # run ESLint
```

---

## 🔐 How Auth Ties the App Together

- The backend issues JWT access/refresh tokens as **httpOnly cookies** — this frontend never stores a token in `localStorage`/`sessionStorage`; every request just relies on `withCredentials: true` in `services/api.jsx`.
- `AuthContext` is the single source of truth for `{ user, role, loading }`, fetched via `check-auth` on app load, and exposes `refreshAuth()` for components to re-sync after a profile update.
- Role changes propagate automatically: `RouteGuards.jsx` reads `role` straight from context on every navigation, so a role change takes effect without a manual page reload once `refreshAuth()` runs.

---

## 🎨 Styling

Component-scoped CSS files live in `src/styles/`, on top of two global stylesheets:
- **`index.css`** — the app-wide color palette as CSS custom properties (single source of truth for every color used anywhere in the app).
- **`App.css`** — shared reset, base typography, and common utility classes/keyframes (spinner, scrollbar, etc.).

Every page/component stylesheet references colors via `var(--...)` from `index.css` rather than hardcoding hex values, so the whole app's theme can be changed from one file.

---

## 🤝 Support

Questions or issues? Open an issue on this repository or reach out directly:
📞 +92 304 1418406