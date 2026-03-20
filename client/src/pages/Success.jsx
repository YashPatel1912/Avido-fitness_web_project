import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import successImg from "../../public/imagess/done.png";
import { useNavigate } from "react-router-dom";

export const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const session_id = searchParams.get("session_id");

  useEffect(() => {
    const savePayment = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            paymentId: session_id,
            fullName: "User Name", // pass actual name if stored
          }),
        });

        const data = await res.json();
      } catch (error) {
        console.log(error);
      }
    };

    if (session_id) {
      savePayment();
    }
  }, [session_id]);

  return (
    <>
      <section className="container">
        <div className="success-failed-page">
          <img src={successImg} alt="" />
          <h2>Thank You </h2>
          <p>Payment Done successfully</p>
          <div>
            <button onClick={() => navigate("/")}>Go to Home</button>
          </div>
        </div>
      </section>
    </>
  );
};
