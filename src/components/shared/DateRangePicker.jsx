// src/components/shared/DateRangePicker.jsx
import React from 'react';
import { format } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const formatDateForInput = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const handleStartDateChange = (e) => {
    const newDate = new Date(e.target.value);
    onChange({
      startDate: newDate,
      endDate
    });
  };

  const handleEndDateChange = (e) => {
    const newDate = new Date(e.target.value);
    onChange({
      startDate,
      endDate: newDate
    });
  };

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onChange({
      startDate: start,
      endDate: end
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex space-x-4 mb-2">
        <button
          onClick={() => handleQuickSelect(7)}
          className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          Last 7 days
        </button>
        <button
          onClick={() => handleQuickSelect(30)}
          className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          Last 30 days
        </button>
        <button
          onClick={() => handleQuickSelect(90)}
          className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          Last 90 days
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleStartDateChange}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <span>to</span>
        <input
          type="date"
          value={formatDateForInput(endDate)}
          onChange={handleEndDateChange}
          className="border border-gray-300 rounded px-2 py-1"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;