# B-Form Upload Tracker - UI Mockup Specification

## Overview
The UI mockup demonstrates a new **"Upload Tracker"** tab within the B-Form Management section of ASZ One CRM. This tracker provides internal record-keeping for merged B-Form uploads with date-wise filtering.

---

## 1. Component Structure

### 1.1 Page Layout
```
┌─────────────────────────────────────────────────────────┐
│  Header (Breadcrumb + Page Title)                       │
├─────────────────────────────────────────────────────────┤
│  Tab Navigation (Dashboard | All Records | ... | Upload │
│  Tracker[ACTIVE])                                        │
├─────────────────────────────────────────────────────────┤
│  Filter Section (Period Selector + Year Selector)       │
├─────────────────────────────────────────────────────────┤
│  CONTENT AREA:                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Stats Row (2 Cards: Uploaded Count + Not Uploaded) ││
│  ├─────────────────────────────────────────────────────┤│
│  │  Section A: B-Forms UPLOADED                         ││
│  │  ┌───────────────────────────────────────────────────┐││
│  │  │ Table: S.No | Society | B-Form# | Date | File    │││
│  │  └───────────────────────────────────────────────────┘││
│  ├─────────────────────────────────────────────────────┤│
│  │  Section B: B-Forms NOT UPLOADED                     ││
│  │  ┌───────────────────────────────────────────────────┐││
│  │  │ Table or Empty State (if all uploaded)            │││
│  │  └───────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  Footer Note (Info about internal tracking purpose)     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Tab Navigation

**Location:** After "Reports" tab in B-Form Management

**Tabs Present:**
- Dashboard
- All Records
- Customer History
- Reports
- **📤 Upload Tracker** (NEW - ACTIVE in mockup)

---

## 3. Filter Section

### 3.1 Filter Controls

**Period Filter:**
- Dropdown with options:
  - "All periods"
  - "Jan-Jun 2026" (default)
  - "Jul-Dec 2026"
  - "Custom" (allows date range picker)

**Year Filter:**
- Dropdown with options:
  - "2026" (default)
  - "All years"
  - Other years as applicable

### 3.2 Filter Behavior
- Filters are **independent** — can be combined
- Filters update both **Section A** and **Section B** dynamically
- Default: Jan-Jun 2026
- Filter persists when switching tabs

---

## 4. Stats Row

### 4.1 Stat Cards

**Card 1: B-Forms Uploaded (Success - Green)**
- Icon: ✅
- Number: 56 (for Jan-Jun 2026)
- Label: "B-Forms Uploaded"
- Background: #d4edda (light green)
- Border-left: 4px solid #28a745 (dark green)

**Card 2: B-Forms Not Uploaded (Warning - Yellow)**
- Icon: ✗
- Number: 0 (when all uploaded)
- Label: "B-Forms Not Uploaded"
- Background: #fff3cd (light yellow)
- Border-left: 4px solid #ffc107 (amber)

### 4.2 Card Content
- **Number:** Large (28px, font-weight: 700)
- **Label:** Small uppercase text (13px, font-weight: 600, letter-spacing: 0.5px)
- **Purpose:** Quick overview of upload status for selected period

---

## 5. Section A: B-Forms Uploaded

### 5.1 Section Header
- Icon: ✅
- Title: "B-Forms Uploaded (Jan-Jun 2026)"
- Title updates dynamically based on selected period

### 5.2 Table Structure

| Column | Width | Data Type | Description |
|--------|-------|-----------|-------------|
| S.No | 5% | Number | Sequential numbering (1-56) |
| Society Name | 25% | Text | Customer/Society name (clickable link) |
| B-Form # | 15% | Code | B-Form identifier (168BF, 169BF, etc.) |
| Upload Date | 18% | Date | Date PDF was uploaded (YYYY-MM-DD) |
| File Name | 20% | Text | Merged PDF filename |
| Status | 12% | Badge | "Uploaded" badge (green) |

### 5.3 Table Features
- **Sortable columns:** By S.No, Society Name, B-Form #, Upload Date
- **Searchable:** Search by Society Name or B-Form Number
- **Row hover:** Light gray background on hover
- **Pagination:** Show 10-20 rows per page; pagination controls at bottom
- **Sample data:** Shows first 8 of 56 records, with "... 48 more records" note

### 5.4 Styling
- Row height: ~48px (12px padding + 24px content)
- Alternate row background: Optional subtle gray striping
- Header background: #f8f9fa
- Border: 1px solid #dee2e6
- Font size: 14px for data rows, 12px for headers
- Monospace font for B-Form numbers (Courier New)
- Status badge: Inline-block with padding, rounded corners

---

## 6. Section B: B-Forms Not Uploaded

### 6.1 Section Header
- Icon: ❌
- Title: "B-Forms Not Uploaded (Jan-Jun 2026)"
- Title updates dynamically based on selected period

### 6.2 Table Structure (When Data Exists)

| Column | Width | Data Type | Description |
|--------|-------|-----------|-------------|
| S.No | 5% | Number | Sequential numbering |
| Society Name | 25% | Text | Customer/Society name |
| Last B-Form Date | 18% | Date | Previous upload date (if any) |
| Days Overdue | 15% | Number | Days since expected date |
| Expected Date | 18% | Date | When B-Form was expected |
| Status | 12% | Badge | "Pending" badge (yellow) |

### 6.3 Empty State (When All Uploaded)
When there are no B-Forms not uploaded:
- Display centered message: ✓ All customers have uploaded their B-Forms for this period!
- Subtext: "No pending B-Forms to display"
- Icon size: 48px, opacity: 0.5
- Text color: #999

### 6.4 Styling
- Same table styling as Section A
- Status badge color: Yellow/amber for "Pending"

---

## 7. Footer Note

**Position:** Bottom of the container

**Text:**
```
💡 Note: This tracker shows internal B-Form upload status for record-keeping 
purposes. Dates and statuses update automatically when merged B-Forms are 
uploaded to the system. This is separate from BMC site submission tracking.
```

**Styling:**
- Background: #e8f4f8 (light blue)
- Border-top: 1px solid #b3dfe8
- Text color: #0c5460
- Font size: 13px
- Icon: 💡

---

## 8. Data Mapping

### 8.1 Source Data
The tracker will pull from:
1. **B-Form Records** (from `get_bform_expiry` API)
2. **Merged PDF Upload Records** (new table to be created: `bform_uploads`)
3. **Customer/Society Master** (from `get_clients` API)

### 8.2 Sample Data (From Our 56 Societies)

**Section A Upload Records:**
```
1. [168BF] SPRING FIELD CHSL → Upload Date: 2026-07-22
2. [169BF] SOHAM RESIDENCY → Upload Date: 2026-07-22
3. [170BF] SIMANDHAR CHSL → Upload Date: 2026-07-22
4. [171BF] SOHAM REGENCY → Upload Date: 2026-07-22
5. [172BF] VAIKUNTHDHAM → Upload Date: 2026-07-22
6. [173BF] SILVER ARCH → Upload Date: 2026-07-22
7. [232BF] SHREE PURI TOWER → Upload Date: 2026-07-22
8. [250BF] NIRMAN CHSL → Upload Date: 2026-07-22
... (48 more)
```

**Section B (When Applicable):**
- If a customer in the system has no B-Form for selected period, they appear here
- Shows Last B-Form Date (if any previous upload exists)
- Shows "Days Overdue" calculation

---

## 9. Responsive Design

### 9.1 Desktop (>1024px)
- Full table display
- 3-column filter layout
- Stats cards in grid layout

### 9.2 Tablet (768px - 1024px)
- Table columns remain visible, but may compress
- Filter section stacks vertically
- Stats cards stack to 2x1

### 9.3 Mobile (<768px)
- Table becomes scrollable horizontally
- Filter section full-width stacked
- Stats cards stack to 1x2

---

## 10. Color Scheme

### 10.1 Status Colors
- **Success/Uploaded:** #28a745 (green) - Primary use
- **Uploaded Badge Background:** #d4edda (light green)
- **Warning/Pending:** #ffc107 (amber) - Secondary use
- **Pending Badge Background:** #fff3cd (light yellow)

### 10.2 Neutral Colors
- **Text Primary:** #1a1a1a
- **Text Secondary:** #555
- **Text Muted:** #999
- **Border:** #dee2e6
- **Background Light:** #f8f9fa
- **Background Surface:** #ffffff
- **Link Color:** #0066cc

---

## 11. Interaction Behaviors

### 11.1 Filter Changes
- When period or year changes:
  - Stats numbers update immediately
  - Section A table reloads with filtered data
  - Section B table reloads or shows empty state
  - Pagination resets to page 1
  - Smooth transition/loading indicator

### 11.2 Table Interactions
- **Click Society Name:** Navigate to customer detail page
- **Click B-Form #:** Download or preview merged PDF
- **Hover Row:** Highlight row with gray background
- **Sort Columns:** Click header to sort ascending/descending
- **Search:** Type in search box to filter by society name or B-Form #

### 11.3 Pagination
- Display records: 10, 20, 50 per page (user selectable)
- Total records count displayed
- "Previous" / "Next" buttons or numbered pages

---

## 12. Implementation Notes

### 12.1 Database Schema Needed
New table: `bform_uploads` or extend existing `fe_refill` table

```sql
CREATE TABLE bform_uploads (
    id PRIMARY KEY (UUID),
    customer_id FOREIGN KEY,
    society_name TEXT,
    bform_number VARCHAR(20),
    upload_date TIMESTAMP,
    file_name TEXT,
    file_path TEXT,
    status ENUM('Uploaded', 'Processing', 'Failed'),
    period VARCHAR(20), -- 'Jan-Jun', 'Jul-Dec', 'Custom'
    year INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 12.2 API Endpoints Needed
1. `GET /api/bform/uploads/list` - List uploaded B-Forms with filters
2. `GET /api/bform/uploads/not-uploaded` - List B-Forms not uploaded
3. `POST /api/bform/uploads` - Record new B-Form upload
4. `GET /api/bform/uploads/stats` - Get count stats for the period

### 12.3 Filter Logic
- **Period:** Jan-Jun (1-6), Jul-Dec (7-12), Custom (date range)
- **Year:** 2026, All years, etc.
- **Combined:** Both filters work together (AND logic)

### 12.4 Calculated Fields
- **Days Overdue:** `TODAY() - EXPECTED_DATE`
- **Section B Population:** All customers NOT in Section A for selected period

---

## 13. Mockup Summary

✅ **Clean, professional UI** matching ASZ One aesthetic
✅ **Two-section layout** (Uploaded + Not Uploaded)
✅ **Date-wise filtering** (Period + Year)
✅ **Quick stats** with visual indicators
✅ **Responsive design** for all screen sizes
✅ **Sortable, searchable tables**
✅ **Empty state handling** when all uploaded
✅ **Clear visual hierarchy** with proper typography
✅ **Color-coded status badges** (Green for success, Yellow for pending)
✅ **Footer note** explaining internal purpose

---

## Next Steps After Approval

1. ✅ **Review Mockup** - Confirm UI meets requirements
2. ⏳ **Database Design** - Create `bform_uploads` table
3. ⏳ **API Development** - Build filter/list endpoints
4. ⏳ **Frontend Implementation** - Convert mockup to React component
5. ⏳ **Integration** - Link with B-Form upload workflow
6. ⏳ **Testing** - Test with 56 societies data
7. ⏳ **Deployment** - Release to production

---

**Ready for your confirmation to proceed! 👍**
