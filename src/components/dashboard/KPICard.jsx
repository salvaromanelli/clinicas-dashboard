import React from 'react';

const KPICard = ({ title, value, category, date }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-600 truncate">
              {title}
            </p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              {value}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {category}
              </div>
              <div className="text-sm text-gray-500">
                {date}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICard;