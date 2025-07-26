import React from 'react';
import DashboardOverview from '@/components/DashboardOverview';
import LatestLeaveDetails from '@/components/LatestLeaveDetails';
import LeaveSummaryChart from '@/components/LeaveSummaryChart';
import Layout from '@/components/Layout';
import Marquee from '@/components/Marquee';

const DashboardPage = () => {
  const warningMessage = "Students Below 80% of attendance cannot able to get hall tickets";

  return (
    <Layout>
      <Marquee text={warningMessage} className="mb-6 rounded-md" />
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      <p className="text-md md:text-lg text-gray-700 mb-8">
        Welcome to your college portal dashboard. Here you can manage your requests and view important information.
      </p>
      <div className="grid gap-6">
        <DashboardOverview />
        <LatestLeaveDetails />
        <LeaveSummaryChart />
      </div>
    </Layout>
  );
};

export default DashboardPage;