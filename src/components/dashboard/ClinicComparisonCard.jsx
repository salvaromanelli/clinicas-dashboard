import React from 'react';

const ClinicComparisonCard = ({ data, metric }) => {
  // Find highest and lowest performing clinics
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const highestPerforming = sortedData[0] || null;
  const lowestPerforming = sortedData[sortedData.length - 1] || null;
  
  // Calculate average
  const average = data.length > 0
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length
    : 0;
  
  const formatMetricName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Exit early if no data
  if (!data.length || !highestPerforming || !lowestPerforming) {
    return null;
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {formatMetricName(metric)} Insights
        </h3>
        
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="px-4 py-5 bg-green-50 rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-green-500 truncate">
              Highest Performing
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-green-800">
              {highestPerforming.clinic}
            </dd>
            <dd className="mt-3 text-sm text-green-700">
              {highestPerforming.value} ({((highestPerforming.value / average - 1) * 100).toFixed(1)}% above avg)
            </dd>
          </div>

          <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Average
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {average.toFixed(2)}
            </dd>
            <dd className="mt-3 text-sm text-gray-500">
              Across {data.length} clinics
            </dd>
          </div>

          <div className="px-4 py-5 bg-red-50 rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-red-500 truncate">
              Lowest Performing
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-red-800">
              {lowestPerforming.clinic}
            </dd>
            <dd className="mt-3 text-sm text-red-700">
              {lowestPerforming.value} ({((lowestPerforming.value / average - 1) * 100).toFixed(1)}% below avg)
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicComparisonCard;