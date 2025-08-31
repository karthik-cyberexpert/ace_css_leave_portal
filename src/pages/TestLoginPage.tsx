import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import apiClient from '@/utils/apiClient';
import { useNavigate } from 'react-router-dom';

const TestLoginPage: React.FC = () => {
  const [isLogging] = useState(false);
  const navigate = useNavigate();

  const quickLogin = async (email: string, password: string, userType: string) => {
    try {
      console.log(`Attempting quick login for ${userType}...`);
      
      const response = await apiClient.post('/auth/login', {
        identifier: email,
        password: password
      });

      if (response.data.token) {
        // Store the token
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_profile', JSON.stringify(response.data.user));
        
        showSuccess(`Logged in as ${userType} successfully!`);
        
        // Navigate to appropriate dashboard
        if (email.includes('admin') || email === 'drlilly2011@gmail.com') {
          navigate('/admin/batch-management');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Quick login failed:', error);
      let errorMsg = 'Login failed';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      showError(`${userType} login failed: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Quick Test Login</CardTitle>
            <p className="text-center text-gray-600">
              Use these quick login buttons to test the batch management functionality
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Admin Login */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Login</CardTitle>
                  <p className="text-sm text-gray-600">Full access to all batch management features</p>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => quickLogin('drlilly2011@gmail.com', 'admin123', 'Admin')}
                    disabled={isLogging}
                  >
                    Login as Admin
                  </Button>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Email: drlilly2011@gmail.com</div>
                    <div>Password: admin123</div>
                  </div>
                </CardContent>
              </Card>

              {/* Tutor Login */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tutor Login</CardTitle>
                  <p className="text-sm text-gray-600">Limited access for tutors</p>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => quickLogin('tutor@ace.com', 'tutor123', 'Tutor')}
                    disabled={isLogging}
                  >
                    Login as Tutor
                  </Button>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Email: tutor@ace.com</div>
                    <div>Password: tutor123</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manual Login */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Manual Login</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  const password = formData.get('password') as string;
                  await quickLogin(email, password, 'User');
                }} className="space-y-4">
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isLogging}>
                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">Testing Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700">
                <div className="space-y-2">
                  <div><strong>1. Login:</strong> Use the admin quick login button above</div>
                  <div><strong>2. Navigate:</strong> You'll be taken to the batch management page</div>
                  <div><strong>3. Test Create:</strong> Try creating a new batch (e.g., year 2029)</div>
                  <div><strong>4. Test Update:</strong> Try activating/deactivating existing batches</div>
                  <div><strong>5. Test Delete:</strong> Try deleting a batch (will show proper error messages if batch has dependencies)</div>
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="mt-6 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">System Status</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-green-700">
                <div className="space-y-2">
                  <div>✅ Theme toggle infinite loop - FIXED</div>
                  <div>✅ Batch creation 409 conflicts - FIXED</div>
                  <div>✅ Authentication error handling - IMPROVED</div>
                  <div>✅ Batch deletion constraints - FIXED</div>
                  <div>✅ Error messages - ENHANCED</div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestLoginPage;
