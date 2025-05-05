import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/dateUtils';
import analyticsService from '../../services/analyticsService';

const ActivityCard = ({ dateRange }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const interactions = await analyticsService.getUserInteractions(
          dateRange.startDate,
          dateRange.endDate
        );
        
        // Sort by timestamp descending and take the most recent 10
        const sortedActivities = interactions
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
          .map(item => ({
            id: item.id,
            event: item.event_name,
            timestamp: new Date(item.timestamp),
            user: item.user_id,
            details: item.metadata || {}
          }));
        
        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [dateRange]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h2>
      {isLoading ? (
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent activities</p>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center ring-8 ring-white">
                        <svg className="h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-700">
                          {activity.event}
                          {activity.details?.page && (
                            <span className="font-medium text-gray-900"> on {activity.details.page}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.timestamp.toISOString()}>
                          {formatDate(activity.timestamp, 'PP p')}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActivityCard;