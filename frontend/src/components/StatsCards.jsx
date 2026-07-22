import React from 'react';
import '../styles/StatsCards.css';

function StatsCards({ stats, loading }) {
  const statCards = [
    {
      id: 'total',
      label: 'Total B-Forms',
      value: stats.total,
      icon: '📋',
      color: 'blue',
      trend: null
    },
    {
      id: 'uploaded',
      label: 'Uploaded',
      value: stats.uploaded,
      icon: '✓',
      color: 'green',
      trend: stats.total > 0 ? Math.round((stats.uploaded / stats.total) * 100) : 0
    },
    {
      id: 'pending',
      label: 'Pending',
      value: stats.pending,
      icon: '⏳',
      color: 'yellow',
      trend: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      icon: '⚠',
      color: 'red',
      trend: stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0
    }
  ];

  if (loading) {
    return (
      <div className="stats-cards-container">
        {statCards.map(card => (
          <div key={card.id} className={`stat-card stat-card-${card.color} loading`}>
            <div className="stat-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-cards-container">
      {statCards.map(card => (
        <div key={card.id} className={`stat-card stat-card-${card.color}`}>
          <div className="stat-header">
            <span className="stat-icon">{card.icon}</span>
            <h3 className="stat-label">{card.label}</h3>
          </div>
          <div className="stat-body">
            <span className="stat-value">{card.value}</span>
            {card.trend !== null && (
              <span className="stat-trend">{card.trend}%</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
