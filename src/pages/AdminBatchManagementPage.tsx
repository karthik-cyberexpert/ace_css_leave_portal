import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { BatchManagement } from '@/components/BatchManagement';

const AdminBatchManagementPage = () => {
  return (
    <AdminLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Batch Management</h1>
      <p className="text-md md:text-lg text-gray-700 dark:text-gray-300 mb-8">
        Manage the start and end dates for each semester of each batch.
      </p>
      <BatchManagement />
    </AdminLayout>
  );
};

export default AdminBatchManagementPage;

