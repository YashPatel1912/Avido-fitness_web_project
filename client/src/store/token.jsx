/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";

export const UserContext = createContext();

const stripepromise = loadStripe(import.meta.env.VITE_STRIPE_API_KEY);

export const UserProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [user, setUser] = useState([]);
  const [memebership, setMemberShip] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/check-auth`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (response.ok && data.user) {
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        toast.error(error.message);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const checkoutPayment = async () => {
    const stripe = await stripepromise;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/check-out`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memebership),
        },
      );

      const session = await response.json();
      console.log(session, "session utl");

      if (!response.ok || !session?.url) {
        toast.error("Failed to create Stripe session:");
        return;
      }

      window.location.href = session.url;
    } catch (error) {
      toast.error("Something went wrong");
      console.log(error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        loading,
        setLoading,
        setIsLoggedIn,
        setMemberShip,
        memebership,
        user,
        setUser,
        checkoutPayment,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => {
  const AuthContextValue = useContext(UserContext);
  return AuthContextValue;
};
