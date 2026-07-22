# Mock Data for Testing

This document provides sample data structures that can be used for testing the B-Form Upload Tracker application without a backend API.

## Uploaded B-Forms Data

```json
[
  {
    "id": "bform-001",
    "bFormNumber": "BF-2024-001",
    "companyName": "ABC Manufacturing Ltd.",
    "companyId": "comp-001",
    "uploadedBy": "John Doe",
    "uploadDate": "2024-01-15T10:30:00Z",
    "status": "uploaded",
    "fileSize": 2048000,
    "fileName": "B-Form-2024-001.pdf",
    "notes": "Initial submission"
  },
  {
    "id": "bform-002",
    "bFormNumber": "BF-2024-002",
    "companyName": "XYZ Corporation",
    "companyId": "comp-002",
    "uploadedBy": "Jane Smith",
    "uploadDate": "2024-01-20T14:15:00Z",
    "status": "uploaded",
    "fileSize": 1500000,
    "fileName": "B-Form-2024-002.pdf",
    "notes": "Updated version"
  },
  {
    "id": "bform-003",
    "bFormNumber": "BF-2024-003",
    "companyName": "Tech Solutions Inc.",
    "companyId": "comp-003",
    "uploadedBy": "Robert Johnson",
    "uploadDate": "2024-02-05T09:45:00Z",
    "status": "uploaded",
    "fileSize": 1800000,
    "fileName": "B-Form-2024-003.pdf",
    "notes": "Revised submission"
  },
  {
    "id": "bform-004",
    "bFormNumber": "BF-2024-004",
    "companyName": "Global Enterprises",
    "companyId": "comp-004",
    "uploadedBy": "Sarah Williams",
    "uploadDate": "2024-02-12T11:20:00Z",
    "status": "uploaded",
    "fileSize": 2100000,
    "fileName": "B-Form-2024-004.pdf",
    "notes": "Complete documentation"
  },
  {
    "id": "bform-005",
    "bFormNumber": "BF-2024-005",
    "companyName": "Future Systems Ltd.",
    "companyId": "comp-005",
    "uploadedBy": "Michael Brown",
    "uploadDate": "2024-02-25T13:30:00Z",
    "status": "uploaded",
    "fileSize": 1600000,
    "fileName": "B-Form-2024-005.pdf",
    "notes": "Final version"
  }
]
```

## Pending (Not Uploaded) B-Forms Data

```json
[
  {
    "id": "bform-006",
    "bFormNumber": "BF-2024-006",
    "companyName": "Premium Industries",
    "companyId": "comp-006",
    "assignedTo": "Emily Davis",
    "dueDate": "2024-03-10T23:59:59Z",
    "priority": "High",
    "status": "pending",
    "notes": "Awaiting client documentation"
  },
  {
    "id": "bform-007",
    "bFormNumber": "BF-2024-007",
    "companyName": "Innovative Services",
    "companyId": "comp-007",
    "assignedTo": "David Wilson",
    "dueDate": "2024-03-15T23:59:59Z",
    "priority": "Medium",
    "status": "pending",
    "notes": "Pending review"
  },
  {
    "id": "bform-008",
    "bFormNumber": "BF-2024-008",
    "companyName": "Classic Holdings",
    "companyId": "comp-008",
    "assignedTo": "Jessica Miller",
    "dueDate": "2024-02-28T23:59:59Z",
    "priority": "High",
    "status": "overdue",
    "notes": "Overdue - Urgent follow-up required"
  },
  {
    "id": "bform-009",
    "bFormNumber": "BF-2024-009",
    "companyName": "Digital Transformation Co.",
    "companyId": "comp-009",
    "assignedTo": "Christopher Lee",
    "dueDate": "2024-03-20T23:59:59Z",
    "priority": "Low",
    "status": "pending",
    "notes": "Non-urgent submission"
  },
  {
    "id": "bform-010",
    "bFormNumber": "BF-2024-010",
    "companyName": "Strategic Partners Ltd.",
    "companyId": "comp-010",
    "assignedTo": "Lisa Anderson",
    "dueDate": "2024-03-01T23:59:59Z",
    "priority": "High",
    "status": "pending",
    "notes": "Client follow-up needed"
  },
  {
    "id": "bform-011",
    "bFormNumber": "BF-2024-011",
    "companyName": "Efficient Operations",
    "companyId": "comp-011",
    "assignedTo": "James Taylor",
    "dueDate": "2024-02-25T23:59:59Z",
    "priority": "High",
    "status": "overdue",
    "notes": "Critical - Follow up immediately"
  },
  {
    "id": "bform-012",
    "bFormNumber": "BF-2024-012",
    "companyName": "Business Growth Inc.",
    "companyId": "comp-012",
    "assignedTo": "Angela Martin",
    "dueDate": "2024-03-25T23:59:59Z",
    "priority": "Medium",
    "status": "pending",
    "notes": "In progress"
  }
]
```

## Statistics Data

```json
{
  "total": 12,
  "uploaded": 5,
  "pending": 5,
  "overdue": 2,
  "uploadPercentage": 41.67,
  "pendingPercentage": 41.67,
  "overduePercentage": 16.67
}
```

## Filtered Data - January to June 2024

### Uploaded B-Forms
```json
[
  {
    "id": "bform-001",
    "bFormNumber": "BF-2024-001",
    "companyName": "ABC Manufacturing Ltd.",
    "companyId": "comp-001",
    "uploadedBy": "John Doe",
    "uploadDate": "2024-01-15T10:30:00Z",
    "status": "uploaded",
    "fileSize": 2048000,
    "fileName": "B-Form-2024-001.pdf"
  },
  {
    "id": "bform-002",
    "bFormNumber": "BF-2024-002",
    "companyName": "XYZ Corporation",
    "companyId": "comp-002",
    "uploadedBy": "Jane Smith",
    "uploadDate": "2024-01-20T14:15:00Z",
    "status": "uploaded",
    "fileSize": 1500000,
    "fileName": "B-Form-2024-002.pdf"
  }
]
```

### Pending B-Forms
```json
[
  {
    "id": "bform-006",
    "bFormNumber": "BF-2024-006",
    "companyName": "Premium Industries",
    "companyId": "comp-006",
    "assignedTo": "Emily Davis",
    "dueDate": "2024-03-10T23:59:59Z",
    "priority": "High",
    "status": "pending"
  },
  {
    "id": "bform-007",
    "bFormNumber": "BF-2024-007",
    "companyName": "Innovative Services",
    "companyId": "comp-007",
    "assignedTo": "David Wilson",
    "dueDate": "2024-03-15T23:59:59Z",
    "priority": "Medium",
    "status": "pending"
  }
]
```

## Search Results Examples

### Search: "ABC"
```json
{
  "results": [
    {
      "id": "bform-001",
      "bFormNumber": "BF-2024-001",
      "companyName": "ABC Manufacturing Ltd.",
      "status": "uploaded",
      "uploadedBy": "John Doe",
      "uploadDate": "2024-01-15T10:30:00Z"
    }
  ],
  "totalResults": 1
}
```

### Search: "High" (priority)
```json
{
  "results": [
    {
      "id": "bform-006",
      "bFormNumber": "BF-2024-006",
      "companyName": "Premium Industries",
      "status": "pending",
      "assignedTo": "Emily Davis",
      "priority": "High"
    },
    {
      "id": "bform-008",
      "bFormNumber": "BF-2024-008",
      "companyName": "Classic Holdings",
      "status": "overdue",
      "assignedTo": "Jessica Miller",
      "priority": "High"
    },
    {
      "id": "bform-011",
      "bFormNumber": "BF-2024-011",
      "companyName": "Efficient Operations",
      "status": "overdue",
      "assignedTo": "James Taylor",
      "priority": "High"
    }
  ],
  "totalResults": 3
}
```

## Company Data Reference

```json
[
  {
    "id": "comp-001",
    "name": "ABC Manufacturing Ltd.",
    "industry": "Manufacturing",
    "registrationNumber": "REG-001"
  },
  {
    "id": "comp-002",
    "name": "XYZ Corporation",
    "industry": "Technology",
    "registrationNumber": "REG-002"
  },
  {
    "id": "comp-003",
    "name": "Tech Solutions Inc.",
    "industry": "Software",
    "registrationNumber": "REG-003"
  },
  {
    "id": "comp-004",
    "name": "Global Enterprises",
    "industry": "Consulting",
    "registrationNumber": "REG-004"
  },
  {
    "id": "comp-005",
    "name": "Future Systems Ltd.",
    "industry": "IT Services",
    "registrationNumber": "REG-005"
  }
]
```

## User Data Reference

```json
[
  {
    "id": "user-001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "Admin"
  },
  {
    "id": "user-002",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "Manager"
  },
  {
    "id": "user-003",
    "name": "Robert Johnson",
    "email": "robert.johnson@example.com",
    "role": "Coordinator"
  },
  {
    "id": "user-004",
    "name": "Sarah Williams",
    "email": "sarah.williams@example.com",
    "role": "Coordinator"
  },
  {
    "id": "user-005",
    "name": "Michael Brown",
    "email": "michael.brown@example.com",
    "role": "Coordinator"
  },
  {
    "id": "user-006",
    "name": "Emily Davis",
    "email": "emily.davis@example.com",
    "role": "Coordinator"
  }
]
```

## Export CSV Example

```csv
"B-Form Number","Company Name","Status","Upload Date","Uploaded By"
"BF-2024-001","ABC Manufacturing Ltd.","Uploaded","2024-01-15","John Doe"
"BF-2024-002","XYZ Corporation","Uploaded","2024-01-20","Jane Smith"
"BF-2024-003","Tech Solutions Inc.","Uploaded","2024-02-05","Robert Johnson"
"BF-2024-004","Global Enterprises","Uploaded","2024-02-12","Sarah Williams"
"BF-2024-005","Future Systems Ltd.","Uploaded","2024-02-25","Michael Brown"
```

## Using Mock Data in Development

### Option 1: Create Mock API Service

Create `src/services/mockData.js`:

```javascript
export const mockUploadedBForms = [
  // ... uploaded B-Forms data
];

export const mockPendingBForms = [
  // ... pending B-Forms data
];

export const mockStats = {
  total: 12,
  uploaded: 5,
  pending: 5,
  overdue: 2
};
```

### Option 2: Mock API Responses

Update `src/services/uploadTrackerService.js` to return mock data:

```javascript
async getUploadTrackerData(authToken, filters = {}) {
  try {
    // Return mock data instead of calling API
    return {
      success: true,
      data: {
        uploaded: mockUploadedBForms,
        notUploaded: mockPendingBForms
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Option 3: Use JSON Server

Install and setup JSON Server for quick mock API:

```bash
npm install --save-dev json-server
```

Create `db.json`:

```json
{
  "bForms": {
    "uploaded": [...],
    "pending": [...]
  },
  "stats": {...}
}
```

Start:

```bash
npx json-server db.json --port 5000
```

## Testing Scenarios

### Scenario 1: Empty State
- Uploaded: 0 B-Forms
- Pending: 0 B-Forms

### Scenario 2: All Uploaded
- Uploaded: 10 B-Forms
- Pending: 0 B-Forms
- Overdue: 0 B-Forms

### Scenario 3: Mixed Status
- Uploaded: 5 B-Forms
- Pending: 5 B-Forms
- Overdue: 2 B-Forms

### Scenario 4: Search Results
- Search term returns filtered results
- No results returns empty state

### Scenario 5: Sorting
- Click column headers to sort
- Ascending/descending order

### Scenario 6: Pagination
- 10 items per page shows 1 page
- 50 items shows multiple pages
- Navigation between pages works

### Scenario 7: Export
- Download CSV file
- File contains correct columns
- Data matches current filters
