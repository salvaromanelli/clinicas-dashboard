// src/pages/ClinicComparison.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ClinicComparisonCard from '../components/dashboard/ClinicComparisonCard';
import BarChart from '../components/charts/BarChart';
import DataTable from '../components/shared/DataTable';
import DateRangePicker from '../components/shared/DateRangePicker';
import Loading from '../components/shared/Loading';
import analyticsService from '../services/analyticsService';

const ClinicComparison = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [selectedClinics, setSelectedClinics] = useState([]);
  const [metricName, setMetricName] = useState('appointments_completed');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [comparisonData, setComparisonData] = useState([]);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const clinicsData = await analyticsService.getClinics();
        setClinics(clinicsData);
        // By default, select all clinics
        setSelectedClinics(clinicsData.map(clinic => clinic.id));
      } catch (error) {
        console.error('Error fetching clinics:', error);
      }
    };

    fetchClinics();
  }, []);

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (selectedClinics.length === 0) return;
      
      setIsLoading(true);
      try {
        const data = await analyticsService.getClinicMetrics(
          metricName,
          selectedClinics,
          dateRange.startDate,
          dateRange.endDate
        );
        setComparisonData(data);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedClinics.length > 0) {
      fetchComparisonData();
    } else {
      setIsLoading(false);
    }
  }, [selectedClinics, metricName, dateRange]);

  const handleClinicToggle = (clinicId) => {
    setSelectedClinics(prev => 
      prev.includes(clinicId)
        ? prev.filter(id => id !== clinicId)
        : [...prev, clinicId]
    );
  };

  const handleMetricChange = (e) => {
    setMetricName(e.target.value);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Process data for visualization
  const processedData = clinics
    .filter(clinic => selectedClinics.includes(clinic.id))
    .map(clinic => {
      const clinicMetrics = comparisonData.filter(item => item.clinic_id === clinic.id);
      const averageValue = clinicMetrics.length > 0
        ? clinicMetrics.reduce((sum, item) => sum + parseFloat(item.value), 0) / clinicMetrics.length
        : 0;
      
      return {
        clinic: clinic.name,
        value: parseFloat(averageValue.toFixed(2)),
        id: clinic.id,
        rawData: clinicMetrics
      };
    });

  const columns = [
    { header: 'Clinic', accessor: 'clinic' },
    { header: `Average ${metricName}`, accessor: 'value' },
    { header: 'Records', accessor: row => row.rawData.length }
  ];

  if (isLoading && selectedClinics.length > 0) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4 md:mb-0">Clinic Comparison</h1>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <select
              value={metricName}
              onChange={handleMetricChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="appointments_completed">Appointments Completed</option>
              <option value="patient_satisfaction">Patient Satisfaction</option>
              <option value="revenue">Revenue</option>
              <option value="patient_retention">Patient Retention</option>
            </select>
            <DateRangePicker 
              startDate={dateRange.startDate} 
              endDate={dateRange.endDate}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Select Clinics to Compare</h2>
          <div className="flex flex-wrap gap-3">
            {clinics.map(clinic => (
              <div key={clinic.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`clinic-${clinic.id}`}
                  checked={selectedClinics.includes(clinic.id)}
                  onChange={() => handleClinicToggle(clinic.id)}
                  className="mr-2"
                />
                <label htmlFor={`clinic-${clinic.id}`}>{clinic.name}</label>
              </div>
            ))}
          </div>
        </div>
        
        {selectedClinics.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                {metricName.charAt(0).toUpperCase() + metricName.slice(1).replace(/_/g, ' ')} Comparison
              </h2>
              <div className="h-80">
                <BarChart 
                  data={processedData}
                  xKey="clinic"
                  yKey="value"
                  xLabel="Clinic"
                  yLabel={metricName.replace(/_/g, ' ')}
                />
              </div>
            </div>
            
            <ClinicComparisonCard 
              data={processedData}
              metric={metricName}
            />
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Detailed Comparison</h2>
              <DataTable 
                columns={columns}
                data={processedData}
              />
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please select at least one clinic to compare data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClinicComparison;