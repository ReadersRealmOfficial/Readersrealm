import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Fire Google Ads conversion event
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion_event_signup_2", {});
    }

    // Redirect to app after a brief moment
    const timer = setTimeout(() => {
      navigate("/app");
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      background: "#2B1E2F",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif",
      color: "#E8DCCB",
      gap: "16px",
    }}>
      <div style={{ fontSize: "48px" }}>📚</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, margin: 0 }}>
        Welcome to Readers' Realm!
      </h1>
      <p style={{ color: "rgba(232,220,203,0.6)", fontSize: "15px", margin: 0 }}>
        Setting up your account...
      </p>
    </div>
  );
}
