# B-Form Upload Tracker

A modern React-based web application for tracking B-Form uploads in the ASZ One CRM system. Provides real-time statistics, filtering, searching, and pagination for uploaded and pending B-Forms.

## Features

- **Real-time Statistics**: Display total, uploaded, pending, and overdue B-Forms
- **Advanced Filtering**: Filter by period (Jan-Jun, Jul-Dec, Custom range) and year
- **Search Functionality**: Search B-Forms by number, company name, or assigned user
- **Sortable Tables**: Click column headers to sort uploaded and pending B-Forms
- **Pagination**: Configurable page sizes (10, 25, 50, 100 items per page)
- **Responsive Design**: Fully responsive on mobile, tablet, and desktop devices
- **Export to CSV**: Export filtered data to CSV format
- **Loading States**: Visual feedback during data fetching
- **Error Handling**: Graceful error messages and retry functionality
- **Dark Mode Support**: Automatic dark mode support based on system preferences
- **Accessibility**: WCAG AA compliant with proper ARIA labels

## Project Structure

```
b-form-tracker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── FilterSection.jsx
│   │   ├── Pagination.jsx
│   │   ├── NotUploadedTable.jsx
│   │   ├── SearchBar.jsx
│   │   ├── StatsCards.jsx
│   │   ├── UploadedTable.jsx
│   │   └── UploadTrackerTab.jsx
│   ├── hooks/
│   │   └── useUploadTracker.js
│   ├── services/
│   │   └── uploadTrackerService.js
│   ├── styles/
│   │   ├── App.css
│   │   ├── FilterSection.css
│   │   ├── Pagination.css
│   │   ├── SearchBar.css
│   │   ├── StatsCards.css
│   │   ├── Tables.css
│   │   ├── UploadTrackerTab.css
│   │   └── index.css
│   ├── App.jsx
│   └── index.jsx
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vite.config.js
```

## Installation

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0 or yarn >= 3.0.0

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd b-form-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure the API endpoint in `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

### Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

### Linting

```bash
npm run lint
# or
yarn lint
```

### Code Formatting

```bash
npm run format
# or
yarn format
```

## API Integration

The application communicates with a backend API using axios. All API calls are handled through `src/services/uploadTrackerService.js`.

### API Endpoints

- `GET /api/b-forms/tracker` - Get upload tracker data with filters
- `GET /api/b-forms/stats` - Get statistics
- `POST /api/b-forms/upload` - Upload a B-Form
- `POST /api/b-forms/{id}/assign` - Assign B-Form to user
- `GET /api/b-forms/{id}` - Get B-Form details
- `PUT /api/b-forms/{id}/status` - Update B-Form status
- `GET /api/b-forms/search` - Search B-Forms
- `GET /api/b-forms/export` - Export B-Forms data

### Authentication

The application uses JWT token-based authentication. The token is stored in `localStorage` and automatically included in all API requests through axios interceptors.

## Components

### UploadTrackerTab
Main container component that manages state and coordinates all child components.

**Props:**
- `authToken` (string): JWT authentication token

### FilterSection
Handles period and year filtering with optional custom date range.

**Props:**
- `period` (string): Current period filter
- `setPeriod` (function): Set period filter
- `year` (number): Current year filter
- `setYear` (function): Set year filter
- `onApply` (function): Callback when filters are applied

### StatsCards
Displays statistics cards for total, uploaded, pending, and overdue B-Forms.

**Props:**
- `stats` (object): Statistics data
- `loading` (boolean): Loading state

### SearchBar
Search input with clear button.

**Props:**
- `value` (string): Search input value
- `onChange` (function): Callback on search input change

### UploadedTable
Displays uploaded B-Forms in a sortable, paginated table.

**Props:**
- `data` (array): Uploaded B-Forms
- `loading` (boolean): Loading state
- `currentPage` (number): Current page
- `totalPages` (number): Total pages
- `pageSize` (number): Items per page
- `totalItems` (number): Total items
- `onPageChange` (function): Page change callback
- `onPageSizeChange` (function): Page size change callback

### NotUploadedTable
Displays pending B-Forms in a sortable, paginated table.

**Props:**
- `data` (array): Pending B-Forms
- `loading` (boolean): Loading state
- `currentPage` (number): Current page
- `totalPages` (number): Total pages
- `pageSize` (number): Items per page
- `totalItems` (number): Total items
- `onPageChange` (function): Page change callback
- `onPageSizeChange` (function): Page size change callback

### Pagination
Pagination controls with page size selector.

**Props:**
- `currentPage` (number): Current page
- `totalPages` (number): Total pages
- `pageSize` (number): Items per page
- `totalItems` (number): Total items
- `onPageChange` (function): Page change callback
- `onPageSizeChange` (function): Page size change callback

## Custom Hooks

### useUploadTracker
Manages data fetching for upload tracker with automatic refetch on filter changes.

**Usage:**
```javascript
const { data, loading, error, stats, refetch } = useUploadTracker(authToken, { period, year });
```

**Returns:**
- `data` (object): Uploaded and not uploaded B-Forms
- `loading` (boolean): Loading state
- `error` (string|null): Error message if any
- `stats` (object): Statistics data
- `refetch` (function): Manual refetch function

## Styling

The application uses CSS modules and utility classes with CSS variables for theming.

### Color Scheme

- **Primary**: #007bff (Blue)
- **Success**: #28a745 (Green)
- **Warning**: #ffc107 (Yellow)
- **Danger**: #dc3545 (Red)
- **Info**: #17a2b8 (Teal)

### Dark Mode

The application automatically supports dark mode based on system preferences. CSS variables are updated in the `:root` selector for dark mode.

## Browser Support

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Code splitting with Vite
- Lazy loading of components
- Memoization with React.useMemo and useCallback
- Optimized re-renders
- Efficient CSS with utility classes
- Minimized bundle size

## Accessibility

- WCAG AA compliant
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- High contrast mode support
- Screen reader friendly

## Error Handling

The application implements comprehensive error handling:

- Network error messages
- API response error handling
- Form validation errors
- Empty state handling
- Retry mechanisms

## Security

- JWT token-based authentication
- Secure token storage in localStorage
- HTTP-only cookie consideration for production
- XSS protection through React's default escaping
- CSRF protection via axios interceptors

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=B-Form Upload Tracker
REACT_APP_ENVIRONMENT=development
REACT_APP_AUTH_ENABLED=true
REACT_APP_ENABLE_EXPORT=true
REACT_APP_ENABLE_SEARCH=true
REACT_APP_ENABLE_FILTERING=true
REACT_APP_ITEMS_PER_PAGE=10
REACT_APP_SHOW_STATISTICS=true
```

## Deployment

### Build for Production

```bash
npm run build
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

Build and run:

```bash
docker build -t b-form-tracker .
docker run -p 3000:3000 b-form-tracker
```

### Nginx Configuration

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend-api:5000;
  }
}
```

## Testing

For testing, consider adding:
- Jest for unit tests
- React Testing Library for component tests
- Cypress for e2e tests

Example installation:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting
4. Submit a pull request

## License

Proprietary - ASZ One CRM

## Support

For support, contact the development team or create an issue in the repository.

## Changelog

### v1.0.0
- Initial release
- Core features: filtering, searching, sorting, pagination
- Responsive design
- Dark mode support
- CSV export
- Comprehensive API integration
