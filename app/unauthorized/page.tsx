'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Access Denied</CardTitle>
          <CardDescription className="text-center">
            You do not have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            This area requires administrative privileges. If you believe you should have access, please contact your system administrator.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/polls">Return to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}