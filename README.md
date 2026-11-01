<!--
  SPORTSLINK — a sports-first professional network.
  Keep this README honest: update the product status as features ship.
-->

<div align="center">

<a href="https://sportslink.up.railway.app/">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:07111F,35:0B5D4B,70:10B981,100:67E8F9&height=230&section=header&text=SPORTSLINK&fontSize=64&fontColor=FFFFFF&fontAlignY=38&desc=Where%20sports%20people%20connect%2C%20grow%20%26%20move%20forward.&descSize=16&descAlignY=60&animation=fadeIn" alt="SPORTSLINK animated banner" width="100%" />
</a>

<br/>

<a href="https://sportslink.up.railway.app/">
  <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=600&size=22&duration=2800&pause=900&color=10B981&center=true&vCenter=true&width=700&lines=More+than+a+network.+A+sports+community.;Meet+athletes.+Find+opportunities.;Build+your+next+chapter+in+sport." alt="Animated SPORTSLINK tagline" />
</a>

<br/><br/>

<a href="https://sportslink.up.railway.app/"><img src="https://img.shields.io/badge/🚀_LIVE_DEMO-Visit_SPORTSLINK-10B981?style=for-the-badge&labelColor=07111F" alt="Live demo" /></a>
<a href="https://github.com/addulasaikiran-ops/SportsLink"><img src="https://img.shields.io/badge/OPEN_SOURCE-Explore_Code-0F172A?style=for-the-badge&logo=github&logoColor=white" alt="Explore source" /></a>

<br/><br/>

![Next.js](https://img.shields.io/badge/Next.js-15+-111827?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-D4A017?style=flat-square&logo=javascript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Data-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Railway](https://img.shields.io/badge/Deployed_on-Railway-8B5CF6?style=flat-square&logo=railway&logoColor=white)

<br/>

<i>Built around one simple idea: sport gets better when the right people find each other.</i>

</div>

---

## ✨ The vision

**SPORTSLINK is a sports-first professional networking platform** designed to bring the sports ecosystem closer together. It aims to make it easier for athletes, coaches, clubs, organizations, and sports professionals to build meaningful connections and discover what comes next.

Think professional networking with the energy of sport: people first, opportunities in reach, and a community that keeps moving.

<table>
<tr>
<td width="33%" align="center">

### 🤝 Connect
Find people across the sports community and build your network.

</td>
<td width="33%" align="center">

### 🧭 Discover
Explore profiles and move toward relevant people and possibilities.

</td>
<td width="33%" align="center">

### 🚀 Grow
Create a professional presence and work toward your next opportunity.

</td>
</tr>
</table>

## 🎬 A quick look

<div align="center">

| Open SPORTSLINK | Explore the code |
|:---:|:---:|
| [**Launch the live app ↗**](https://sportslink.up.railway.app/) | [**Browse the repository ↗**](https://github.com/addulasaikiran-ops/SportsLink) |

</div>

> **Product status note:** SPORTSLINK is actively being developed. The interface includes areas for Home, Network, Discover, Opportunities, Messages, Notifications, Profiles, Organizations, Events, and Settings. Not every area is fully connected to production data yet; see [Current implementation](#-current-implementation) for the distinction.

## 🧩 Product areas

- **Profiles** — sports-focused professional identity and profile management.
- **Home feed** — a community feed with post creation.
- **Discover & Network** — browse profiles and grow your network.
- **Messages** — a dedicated messaging experience is being integrated.
- **Opportunities** — a home for future roles, openings, and applications.
- **Organizations & Events** — spaces for sports organizations and events.
- **Notifications** — a central place for activity updates.
- **Responsive experience** — layouts designed to work across desktop and mobile screens.

## 🛠️ Tech stack

<div align="center">

| Layer | Technology |
|:--|:--|
| Frontend framework | Next.js App Router |
| UI | React + JavaScript / JSX |
| Authentication | Supabase Auth |
| Data & access control | Supabase + Row Level Security (RLS) |
| Optional API integration | Spring Boot API integration |
| Chat integration | Nexconn SDK (in progress) |
| Hosting | Railway |

</div>

> The frontend intentionally uses **JavaScript, not TypeScript**.

## 🚦 Current implementation

<table>
<tr><th>Area</th><th>Status</th></tr>
<tr><td>Signup, login, auth callback & session handling</td><td>✅ Implemented</td></tr>
<tr><td>Protected workspace routes</td><td>✅ Implemented when auth environment is configured</td></tr>
<tr><td>Profile reads and updates</td><td>✅ Implemented</td></tr>
<tr><td>Home feed and post creation</td><td>✅ Implemented</td></tr>
<tr><td>Discover / profile directory</td><td>🟡 Implemented; verify live data and policies</td></tr>
<tr><td>Connections, chat, notifications, opportunities, events, organizations, reactions and comments</td><td>🛠️ In progress; verify each flow before relying on it</td></tr>
</table>

Status reflects the repository's documented implementation and may change as development continues. A page existing in the UI does not necessarily mean its full backend workflow is complete.

## ⚡ Run it locally

### 1. Prerequisites

- Node.js and npm
- A Supabase project for authentication and data features

### 2. Clone the repository

```bash
git clone https://github.com/addulasaikiran-ops/SportsLink.git
cd SportsLink/Frontend/sportslink-frontend-js
```

### 3. Configure environment variables

Copy the example environment file:

**PowerShell**
```powershell
Copy-Item .env.local.example .env.local
```

**macOS / Linux**
```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values required by your Supabase project. Check the frontend's [Supabase setup guide](Frontend/sportslink-frontend-js/docs/supabase-setup.md) for configuration notes.

> 🔐 **Security:** Never commit `.env.local`, Supabase service-role keys, or any secret credentials. Browser code must use only the appropriate publishable/anonymous key, with RLS enabled and policies reviewed.

### 4. Install and start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Purpose |
|:--|:--|
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run seed:demo` | Run the repository's demo seed script |
| `npm run seed:cleanup` | Run the repository's demo cleanup script |

## 🗺️ Project structure

```text
SportsLink/
├── Frontend/
│   └── sportslink-frontend-js/
│       ├── app/                 # Next.js routes and API handlers
│       ├── components/          # Reusable UI components
│       ├── lib/                 # Supabase clients and shared utilities
│       ├── docs/                # Setup and integration notes
│       ├── design-system/       # UI guidance and design tokens
│       ├── public/              # Static assets
│       ├── middleware.js        # Session refresh and route protection
│       └── package.json
└── README.md
```

## 🧭 Roadmap

- [ ] Finish and verify connection request flows end to end.
- [ ] Make member-to-member messaging reliable across mobile and desktop.
- [ ] Connect notifications to real activity.
- [ ] Complete opportunities, applications, events, and organization workflows.
- [ ] Add end-to-end tests for key user journeys.
- [ ] Keep accessibility, responsive design, and reduced-motion support part of every UI update.

## 🤝 Contributing

Ideas, bug reports, UI feedback, and code contributions are welcome.

1. Open an issue describing the change or bug.
2. Keep changes focused and test the affected flow.
3. Avoid committing secrets, generated credentials, or real user data.
4. Clearly label incomplete or mocked behavior instead of presenting it as production-ready.

## 💚 The SPORTSLINK principle

<div align="center">

**Your next connection could change your game.**

<sub>Made for the people who make sport happen.</sub>

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:67E8F9,40:10B981,100:07111F&height=110&section=footer" alt="SPORTSLINK animated footer" width="100%" />

</div>
