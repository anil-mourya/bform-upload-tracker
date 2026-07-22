# B-Form Upload Tracker for ASZ One CRM

A comprehensive internal record-keeping system for tracking merged B-Form uploads in ASZ One CRM with date-wise filtering capabilities.

## Project Overview

**Objective:** Create an internal tracking tab in ASZ One CRM's B-Form Management section to monitor which of the 56 fire safety societies have uploaded their merged B-Forms, with support for period and year-based filtering.

**Scope:** Internal tracking only (separate from BMC site submission)  
**Timeline:** 5 weeks  
**Estimated Cost:** ~380 person-hours

## Features

✅ **Date-wise Filtering**
- Filter by period: Jan-Jun, Jul-Dec, Custom date range
- Filter by year: 2026, All years, future years
- Combined filtering with AND logic

✅ **Dual-Section Display**
- **Section A:** B-Forms uploaded for selected period (with sortable, searchable table)
- **Section B:** B-Forms not uploaded (with empty state when all uploaded)

✅ **Quick Statistics**
- Real-time upload counts
- Visual status indicators (green for uploaded, yellow for pending)

✅ **Audit Trail**
- Track upload history
- Maintain complete audit logs
- User and timestamp tracking

✅ **Responsive Design**
- Works on desktop, tablet, and mobile
- Professional styling matching ASZ One CRM

## Project Structure

```
bform-upload-tracker/
├── docs/                          # Documentation
│   ├── 1_UI_Mockup.md
│   ├── 2_UI_Specification.md
│   ├── 3_Database_Schema_and_API.md
│   ├── 4_Implementation_Roadmap.md
│   └── 5_Project_Summary.md
├── frontend/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadTrackerTab.jsx
│   │   │   ├── FilterSection.jsx
│   │   │   ├── StatsCards.jsx
│   │   │   ├── UploadedTable.jsx
│   │   │   ├── NotUploadedTable.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── hooks/
│   │   │   └── useUploadTracker.js
│   │   ├── services/
│   │   │   └── uploadTrackerService.js
│   │   └── App.jsx
│   ├── package.json
│   └── README.md
├── backend/                       # Node.js/Express Backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── bformRoutes.js
│   │   ├── controllers/
│   │   │   └── bformController.js
│   │   ├── models/
│   │   │   └── BFormUpload.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   └── app.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.example
│   ├── migrations/
│   │   └── 001_create_tables.sql
│   ├── package.json
│   └── README.md
├── database/                      # Database Schema & Scripts
│   ├── schema.sql
│   ├── triggers.sql
│   ├── indexes.sql
│   ├── initial_data.sql
│   └── README.md
├── mockups/                       # UI Mockups
│   └── bform-upload-tracker.html
├── tests/                         # Test Files
│   ├── backend/
│   ├── frontend/
│   └── integration/
├── .gitignore
├── .env.example
├── LICENSE
└── README.md (this file)
```

## Technology Stack

### Frontend
- **Framework:** React 18+
- **UI Library:** Custom components (ASZ One design system)
- **State Management:** React Hooks / Context API
- **HTTP Client:** Fetch API / Axios

### Backend
- **Language:** JavaScript (Node.js)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** Existing ASZ One JWT
- **File Storage:** AWS S3 / Local storage

### Database
- **System:** PostgreSQL
- **Optimization:** Indexes on frequently filtered columns
- **Audit:** Database triggers for automatic history tracking

## Documentation

- **[UI Mockup](./docs/1_UI_Mockup.md)** - Interactive mockup and visual design
- **[UI Specification](./docs/2_UI_Specification.md)** - Component structure, data mapping, design rules (13 sections)
- **[Database Schema & API Design](./docs/3_Database_Schema_and_API.md)** - Complete technical architecture (9 sections)
- **[Implementation Roadmap](./docs/4_Implementation_Roadmap.md)** - 5-week phase-by-phase plan with code examples
- **[Project Summary](./docs/5_Project_Summary.md)** - Executive overview and approval checklist

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bform-upload-tracker.git
   cd bform-upload-tracker
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run migrate  # Run database migrations
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Start Development**
   ```bash
   # Backend (from backend/ directory)
   npm run dev
   
   # Frontend (from frontend/ directory)
   npm run dev
   ```

## 56 Societies Data

The tracker is pre-configured for the following 56 fire safety societies:

**Batch 1 (33 original societies):**
168BF → 218BF (with 8 blank pages removed from B-Forms)

**Batch 2 (7 new societies):**
232BF → 240BF (with 2 blank pages removed)

**Batch 3 (16 new societies):**
250BF → 270BF (with 2 blank pages removed)

All 56 B-Forms have been processed, merged with Fire License Copies, and are ready for upload tracking.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bform/uploads/list` | List uploaded B-Forms with filters |
| GET | `/api/bform/uploads/not-uploaded` | List B-Forms not uploaded |
| GET | `/api/bform/uploads/stats` | Get statistics for period |
| POST | `/api/bform/uploads` | Record new B-Form upload |
| GET | `/api/bform/uploads/:id/download` | Download merged PDF |
| GET | `/api/bform/uploads/:id/history` | Get upload history |
| POST | `/api/bform/uploads/batch` | Batch upload records |
| PATCH | `/api/bform/uploads/:id/status` | Update upload status |

## Project Phases

- **Phase 1:** Database Setup (1 week) - Tables, indexes, initial data
- **Phase 2:** Backend API (2 weeks) - 8 endpoints, file handling, validation
- **Phase 3:** Frontend (2 weeks) - React components, integration
- **Phase 4:** Testing & QA (1 week) - Functional, performance, security testing
- **Phase 5:** Deployment (1 week) - Database migration, API & frontend deployment
- **Phase 6:** Monitoring (Ongoing) - Performance and support

## Key Files

- **Interactive Mockup:** `mockups/bform-upload-tracker.html` - Open in browser to see the UI
- **Database Schema:** `database/schema.sql` - Complete table definitions
- **Initial Data:** `database/initial_data.sql` - Pre-populate 56 societies

## Implementation Status

- ✅ UI Mockup created
- ✅ UI Specification documented
- ✅ Database schema designed
- ✅ API endpoints defined
- ✅ Implementation roadmap prepared
- ⏳ Phase 1: Database Setup (Pending)
- ⏳ Phase 2: Backend Development (Pending)
- ⏳ Phase 3: Frontend Development (Pending)
- ⏳ Phase 4-6: Testing & Deployment (Pending)

## Contributing

1. Create a feature branch (`git checkout -b feature/feature-name`)
2. Commit your changes (`git commit -am 'Add feature'`)
3. Push to the branch (`git push origin feature/feature-name`)
4. Create a Pull Request

## License

Proprietary - ASZ Fire Services

## Contact

**Project Owner:** Anil Mourya  
**Email:** anil_mourya@outlook.com

---

**Status:** Ready for Implementation  
**Last Updated:** 2026-07-22
