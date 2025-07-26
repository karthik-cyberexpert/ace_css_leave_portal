import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WeeklyLeaveChart from '@/components/WeeklyLeaveChart';

const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <p className="text-md md:text-lg text-gray-700 mb-8">
        Oversee all portal activity and manage requests from a central hub.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Pending Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">across all departments</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Pending ODs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">across all departments</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Total Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">485</div>
            <p className="text-xs text-muted-foreground">currently enrolled</p>
          </CardContent>
        </Card>
        <WeeklyLeaveChart />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;