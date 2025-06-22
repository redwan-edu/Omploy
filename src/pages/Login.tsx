import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../hooks/supabase";
import { useAuth } from "../hooks/UseAuth";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);
    if (error) {
      setErrorToast(error.message);
      setTimeout(() => setErrorToast(null), 3000);
    } else {
      setUser(data.user);
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans">
      {/* Left: Form Section */}
      <div className="w-full md:w-3/5 px-6 sm:px-10 md:px-20 py-10 md:py-16 flex flex-col justify-center">
        {/* Logo Section */}
        <div className="flex flex-row items-center mb-8 sm:mb-10 sm:px-28 gap-3">
          <img
            src="logo.png"
            alt="Logo"
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <div className="w-[4px] sm:h-14 bg-green-700" />
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-green-500">
              <a href="/">Omploy</a>
            </h2>
            <p className="text-xs sm:text-sm text-gray-100">
              Your Personal AI Assistant
            </p>
          </div>
        </div>

        <div className="px-2 sm:px-28">
          <h2 className="text-xl sm:text-2xl text-green-600 font-bold mb-4">
            Register to Omploy
          </h2>
          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                placeholder="yourname@name.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-4 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1 px-4 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
            <div className="flex flex-col sm:flex-row  justify-between items-start sm:items-center text-sm gap-2 sm:gap-0">
              <label className="flex items-center gap-2 text-gray-200">
                <input type="checkbox" />
                Remember me
              </label>
              <a
                href="#"
                className="text-yellow-400 underline font-semi-bold hover:underline"
              >
                Forgot Password
              </a>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4 pt-4 space-y-2 sm:space-y-0">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center justify-center bg-green-800 text-white px-6 py-2 rounded transition ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-green-900"
                }`}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  "Log In"
                )}
              </button>

              <Link
                to="/register"
                className="border border-green-800 text-green-600 px-6 py-2 rounded hover:bg-green-100 text-center"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right: Image Section */}
      <div
        className="flex w-2/5 bg-cover bg-center items-center justify-center"
        style={{ backgroundImage: "url('/login.png')" }}
      />
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 min-w-[250px] max-w-sm gap-x-2 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg"
          >
            <MessageCircle className="w-4 h-4 text-gray-100" />
            <p>{errorToast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
