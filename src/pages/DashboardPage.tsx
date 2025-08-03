import React, { useEffect } from 'react';
import DashboardOverview from '@/components/DashboardOverview';
import LatestLeaveDetails from '@/components/LatestLeaveDetails';
import LeaveSummaryChart from '@/components/LeaveSummaryChart';
import Layout from '@/components/Layout';
import Marquee from '@/components/Marquee';
import ODCertificateReminder from '@/components/ODCertificateReminder';
import { useAppContext } from '@/context/AppContext';

const DashboardPage = () => {
  const { handleOverdueCertificates, currentUser, loading, profile, role } = useAppContext();
  const warningMessage = "Students below 80% attendance are not eligible to appear for university examinations";

  useEffect(() => {
    handleOverdueCertificates();
  }, [handleOverdueCertificates]);

  console.log('DashboardPage Debug:', {
    loading,
    profile,
    role,
    currentUser,
    hasProfile: !!profile,
    hasCurrentUser: !!currentUser
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Loading application...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Profile not loaded. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  if (role !== 'Student') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p>Access denied. This page is for students only.</p>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p>Loading student data...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Profile ID: {profile.id}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role: {role}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show read-only dashboard for inactive students
  if (!currentUser.is_active) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              Account Inactive
            </h1>
            <p className="text-red-700 dark:text-red-300 mb-6">
              Your account has been marked as inactive. You cannot submit new requests or make changes to your profile.
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm">
              Please contact your tutor or administrator for assistance.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Marquee text={warningMessage} className="mb-6 rounded-md" />
      <ODCertificateReminder />
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard Overview</h1>
      <p className="text-md md:text-lg text-gray-700 dark:text-gray-300 mb-8">
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