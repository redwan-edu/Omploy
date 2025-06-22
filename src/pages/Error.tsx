import React from "react";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";

const ErrorPage: React.FC = () => {
  const error = useRouteError();

  let errorMessage = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white text-center">
      <div>
        <h1 className="text-5xl font-bold mb-4">Something went wrong</h1>
        <p className="text-lg text-red-400">{errorMessage}</p>
        <a
          href="/"
          className="mt-6 inline-block bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default ErrorPage;
