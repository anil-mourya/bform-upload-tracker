import React, { useState, useCallback, useMemo } from 'react';
import useUploadTracker from '../hooks/useUploadTracker';
import FilterSection from './FilterSection';
import StatsCards from './StatsCards';
import SearchBar from './SearchBar';
import UploadedTable from './UploadedTable';
import NotUploadedTable from './NotUploadedTable';
import '../styles/UploadTrackerTab.css';

function UploadTrackerTab({ authToken }) {
  const [period, setPeriod] = useState('jan-jun');
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('uploaded');
  const [uploadedPage, setUploadedPage] = useState(1);
  const [notUploadedPage, setNotUploadedPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, loading, error, stats, refetch } = useUploadTracker(authToken, { period, year });

  // Filter data based on search term
  const uploadedFiltered = useMemo(() => {
    if (!data.uploaded) return [];
    return data.uploaded.filter(item =>
      item.bFormNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.uploaded, searchTerm]);

  const notUploadedFiltered = useMemo(() => {
    if (!data.notUploaded) return [];
    return data.notUploaded.filter(item =>
      item.bFormNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.notUploaded, searchTerm]);

  // Pagination calculations
  const uploadedTotalPages = Math.ceil(uploadedFiltered.length / pageSize);
  const notUploadedTotalPages = Math.ceil(notUploadedFiltered.length / pageSize);

  const uploadedPaginatedData = useMemo(() => {
    const start = (uploadedPage - 1) * pageSize;
    return uploadedFiltered.slice(start, start + pageSize);
  }, [uploadedFiltered, uploadedPage, pageSize]);

  const notUploadedPaginatedData = useMemo(() => {
    const start = (notUploadedPage - 1) * pageSize;
    return notUploadedFiltered.slice(start, start + pageSize);
  }, [notUploadedFiltered, notUploadedPage, pageSize]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExport = useCallback(() => {
    const dataToExport = activeTab === 'uploaded' ? uploadedFiltered : notUploadedFiltered;
    const csvContent = generateCSV(dataToExport, activeTab);
    downloadCSV(csvContent, `b-forms-${activeTab}-${Date.now()}.csv`);
  }, [activeTab, uploadedFiltered, notUploadedFiltered]);

  return (
    <div className="upload-tracker-container">
      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">!</span>
          <span>{error}</span>
          <button className="alert-close" onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <FilterSection
        period={period}
        setPeriod={setPeriod}
        year={year}
        setYear={setYear}
        onApply={handleRefresh}
      />

      <StatsCards stats={stats} loading={loading} />

      <div className="tracker-controls">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <div className="control-buttons">
          <button
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh data"
          >
            <span className={`btn-icon ${loading ? 'spinning' : ''}`}>↻</span>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={loading || (activeTab === 'uploaded' ? uploadedFiltered.length === 0 : notUploadedFiltered.length === 0)}
            aria-label="Export to CSV"
          >
            <span className="btn-icon">↓</span>
            Export
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'uploaded' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('uploaded');
              setUploadedPage(1);
            }}
            aria-selected={activeTab === 'uploaded'}
          >
            <span className="tab-icon success">✓</span>
            Uploaded
            <span className="tab-badge">{uploadedFiltered.length}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'notUploaded' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('notUploaded');
              setNotUploadedPage(1);
            }}
            aria-selected={activeTab === 'notUploaded'}
          >
            <span className="tab-icon warning">!</span>
            Pending
            <span className="tab-badge">{notUploadedFiltered.length}</span>
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'uploaded' && (
            <UploadedTable
              data={uploadedPaginatedData}
              loading={loading}
              currentPage={uploadedPage}
              totalPages={uploadedTotalPages}
              pageSize={pageSize}
              totalItems={uploadedFiltered.length}
              onPageChange={setUploadedPage}
              onPageSizeChange={setPageSize}
            />
          )}

          {activeTab === 'notUploaded' && (
            <NotUploadedTable
              data={notUploadedPaginatedData}
              loading={loading}
              currentPage={notUploadedPage}
              totalPages={notUploadedTotalPages}
              pageSize={pageSize}
              totalItems={notUploadedFiltered.length}
              onPageChange={setNotUploadedPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function generateCSV(data, type) {
  if (data.length === 0) return '';

  const headers = type === 'uploaded'
    ? ['B-Form Number', 'Company Name', 'Uploaded By', 'Upload Date', 'Status']
    : ['B-Form Number', 'Company Name', 'Assigned To', 'Due Date', 'Priority'];

  const rows = data.map(item => type === 'uploaded'
    ? [item.bFormNumber, item.companyName, item.uploadedBy, item.uploadDate, item.status]
    : [item.bFormNumber, item.companyName, item.assignedTo, item.dueDate, item.priority]
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

function downloadCSV(content, filename) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export default UploadTrackerTab;
