import React from 'react';

const DashboardCard = ({ title, children, className = '', actions }) => {
  return (
    <div className={`overflow-hidden rounded-lg bg-white shadow ${className}`}>
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

export default DashboardCard;