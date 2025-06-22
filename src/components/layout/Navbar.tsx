import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../hooks/UseAuth";
import { supabase } from "../../hooks/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [userData, setUserData] = useState<SupabaseUser | null>(null);

  const onLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error getting user:", error);
        return;
      }

      if (supabaseUser) {
        setUserData(supabaseUser);
        setUser(supabaseUser); // optional, if you want to sync context user
      } else {
        setUserData(null);
        setUser(null);
      }
    };

    getUser();
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/talk", label: "Talk" },
    { path: "/history", label: "History" },
    { path: "/profile", label: "Agent" },
  ];

  const handleNavClick = (path: string) => {
    if (!user) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-20 border-b border-gray-800 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <img src="logo.png" alt="Logo" className="h-12 w-12" />
            <span className="text-white text-xl font-bold">
              <a href="/">OmPloy</a>
            </span>
          </div>

          {/* Center: Nav Items (only if logged in) */}
          {user && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-12">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={clsx(
                      "transition-colors",
                      location.pathname === item.path
                        ? "text-white font-medium"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Right: Profile */}
          <div className="flex items-center space-x-4">
            <h2 className="w-full text-left px-4 py-2 text-sm text-gray-100">
              {userData?.email}
            </h2>

            {user ? (
              <div className="relative group">
                {/* Profile Icon Button */}

                <button className="focus:outline-none">
                  <img
                    src="/profile.png" // Replace with your actual profile icon URL
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-gray-500"
                  />
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                  <div className="py-1">
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-green-500 hover:underline font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-green-500 hover:underline font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
