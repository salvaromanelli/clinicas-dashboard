import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const StatsCard = ({ title, value, change, trend, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-500',
      ring: 'ring-blue-500/20',
      upTrend: 'text-green-700',
      downTrend: 'text-red-700',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: 'text-green-500',
      ring: 'ring-green-500/20',
      upTrend: 'text-green-700',
      downTrend: 'text-red-700',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      icon: 'text-indigo-500',
      ring: 'ring-indigo-500/20',
      upTrend: 'text-green-700',
      downTrend: 'text-red-700',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: 'text-amber-500',
      ring: 'ring-amber-500/20',
      upTrend: 'text-green-700',
      downTrend: 'text-red-700',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${colors.bg} p-3`}>
            {Icon && <Icon className={`h-6 w-6 ${colors.icon}`} aria-hidden="true" />}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
            <dd className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {change && (
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend === 'up' ? colors.upTrend : colors.downTrend
                }`}>
                  {trend === 'up' ? (
                    <FiArrowUp className="h-4 w-4 flex-shrink-0 self-center" aria-hidden="true" />
                  ) : (
                    <FiArrowDown className="h-4 w-4 flex-shrink-0 self-center" aria-hidden="true" />
                  )}
                  <span className="sr-only">{trend === 'up' ? 'Aumentó' : 'Disminuyó'} por</span>
                  {change}
                </p>
              )}
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;