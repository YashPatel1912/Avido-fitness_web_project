import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/token";

import { toast } from "react-toastify";

export const GoogleCallBack = () => {
  const { setIsLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const parms = new URLSearchParams(window.location.search);

    const code = parms.get("code");
    const state = parms.get("state");

    if (!code || !state) {
      toast.error("Invalid Google login");
      navigate("/login");
      return;
    }

    const callBack = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/google/callback`,
          {
            method: "POST", // keep POST if backend expects body
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, state }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          if (data?.error === "Set not password") {
            toast.error(data.error);
            navigate(data.redirect, { state: data.email });
            return;
          }

          toast.error(data?.error || "Login failed");
          navigate("/login");
          return;
        }

        setIsLoggedIn(true);
        toast.success(data.message || "Login successful");
        navigate("/");
      } catch (error) {
        console.error("Google callback error:", error);
        toast.error("Something went wrong");
        navigate("/login");
      }
    };

    callBack();
  }, [navigate, setIsLoggedIn]);

  return <div>Logging you in...</div>;
};
