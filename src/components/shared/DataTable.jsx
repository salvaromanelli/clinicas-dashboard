import React, { useState } from 'react';

const DataTable = ({ 
  columns = [], 
  data = [], 
  emptyMessage = 'No data available',
  isLoading = false
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Handle column sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data based on current sort configuration
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      // Get values using accessor functions if they exist
      const aValue = typeof columns.find(col => col.accessor === sortConfig.key)?.accessor === 'function'
        ? columns.find(col => col.accessor === sortConfig.key).accessor(a)
        : a[sortConfig.key];
      
      const bValue = typeof columns.find(col => col.accessor === sortConfig.key)?.accessor === 'function'
        ? columns.find(col => col.accessor === sortConfig.key).accessor(b)
        : b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, columns]);

  if (isLoading) {
    return (
      <div className="min-w-full divide-y divide-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 mb-2 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 mb-2 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="min-w-full divide-y divide-gray-200">
        <div className="border border-gray-100 rounded-lg p-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Helper function to render cell content
  const renderCell = (row, column) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    
    return row[column.accessor];
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, i) => (
              <th
                key={i}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => column.accessor && handleSort(column.accessor)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {sortConfig.key === column.accessor && (
                    <span>
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {renderCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;