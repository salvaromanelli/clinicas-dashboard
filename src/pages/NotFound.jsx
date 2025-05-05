import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/shared/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-extrabold text-brand-600">404</h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-4 text-base text-gray-500">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div className="mt-6">
          <Link to="/">
            <Button variant="primary" size="lg">
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;