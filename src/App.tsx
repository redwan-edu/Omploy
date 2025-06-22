import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import React from "react";

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
