import { ToastContainer, Zoom } from "react-toastify";
import { useEffect, useState } from "react";
import "../../App.css";

const ResponsiveToast = () => {
  const [position, setPosition] = useState("top-right");

  useEffect(() => {
    const updatePosition = () => {
      if (window.innerWidth < 480) {
        setPosition("top-center"); // Mobile
      } else if (window.innerWidth < 768) {
        setPosition("top-right"); // Tablet
      } else {
        setPosition("top-right"); // Desktop
      }
    };

    updatePosition(); // initial call
    window.addEventListener("resize", updatePosition);

    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  return (
    <ToastContainer
      position={position}
      autoClose={4000}
      newestOnTop={false}
      closeOnClick={false}
      pauseOnFocusLoss
      draggable
      theme="light"
      transition={Zoom}
    />
  );
};

export default ResponsiveToast;
