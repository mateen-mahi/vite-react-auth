import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import stripePromise from "../services/stripeClient";
import api from "../services/api";
import {
  HiShieldCheck, HiLockClosed, HiCheckCircle, HiExclamationCircle,
  HiArrowRight, HiUsers, HiClock, HiPlay, HiDocumentText, HiDownload,
} from "react-icons/hi";
import { SiStripe } from "react-icons/si";
import "../styles/stripePayment.css";

const STRIPE_APPEARANCE = {
  theme: "stripe",
  variables: { colorPrimary: "#7c3aed" },
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function StripePaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // courseIds comes from router state set by Courses.jsx's handleCheckout.
  // If someone lands here directly (refresh, bookmark, back button), state
  // is lost — bounce them back to /courses rather than firing a broken request.
  const courseIds = location.state?.courseIds;

  const [courses, setCourses] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState("");
  const [promoError, setPromoError] = useState("");

  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [pageError, setPageError] = useState(null);

  useEffect(() => {
    if (!courseIds || courseIds.length === 0) {
      navigate("/courses", { replace: true });
    }
  }, [courseIds, navigate]);

  // Course details for the summary panel — one call per course id.
  useEffect(() => {
    if (!courseIds || courseIds.length === 0) return;
    const fetchCourseDetails = async () => {
      try {
        const results = await Promise.all(courseIds.map((id) => api.get(`/courses/${id}`)));
        setCourses(results.map((res) => res.data.data));
      } catch (err) {
        console.error("Failed to load course details:", err);
      }
    };
    fetchCourseDetails();
  }, [courseIds]);

  const fetchQuote = useCallback(async (code) => {
    if (!courseIds || courseIds.length === 0) return;
    setLoadingQuote(true);
    setPageError(null);
    try {
      const res = await api.post("/payments/quote", { courseIds, promoCode: code || undefined });
      setPricing(res.data.pricing);
    } catch (err) {
      setPageError(err.response?.data?.message || "Couldn't load pricing for this order.");
    } finally {
      setLoadingQuote(false);
    }
  }, [courseIds]);

  useEffect(() => {
    fetchQuote(null);
  }, [fetchQuote]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError("");
    await fetchQuote(code);
    setPromoApplied(code);
  };

  const handleRemovePromo = () => {
    setPromoApplied("");
    setPromoInput("");
    setPromoError("");
    fetchQuote(null);
  };

  const startPayment = async () => {
    setLoadingIntent(true);
    setPageError(null);
    try {
      const res = await api.post("/payments/create-payment-intent", {
        courseIds,
        promoCode: promoApplied || undefined,
      });
      setClientSecret(res.data.clientSecret);
      setOrderId(res.data.orderId);
      setPricing(res.data.pricing);
    } catch (err) {
      setPageError(err.response?.data?.message || "Couldn't start the payment. Please try again.");
    } finally {
      setLoadingIntent(false);
    }
  };

  if (!courseIds || courseIds.length === 0) {
    return null; // redirecting via the effect above
  }

  if (loadingQuote || courses.length === 0 || !pricing) {
    return (
      <div className="payment-page">
        <p>Loading order summary…</p>
        {pageError && (
          <span className="field-error"><HiExclamationCircle size={12} /> {pageError}</span>
        )}
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <OrderSummary
          courses={courses}
          pricing={pricing}
          promoInput={promoInput}
          setPromoInput={setPromoInput}
          promoApplied={promoApplied}
          promoError={promoError && !pricing.discountPercent ? "Invalid promo code." : ""}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={handleRemovePromo}
        />

        {!clientSecret ? (
          <div className="payment-form-card">
            <div className="form-header">
              <h2>Payment details</h2>
              <div className="secure-badge"><HiLockClosed size={12} /> Secured by Stripe</div>
            </div>
            <div className="form-body">
              <button className="btn-pay" onClick={startPayment} disabled={loadingIntent}>
                {loadingIntent ? (
                  <><div className="spinner" /> Preparing checkout…</>
                ) : (
                  <><HiLockClosed size={16} /> Continue to pay ${pricing.total}</>
                )}
              </button>
              {pageError && (
                <span className="field-error"><HiExclamationCircle size={12} /> {pageError}</span>
              )}
            </div>
            <StripeFooter />
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
            <CheckoutForm courses={courses} pricing={pricing} orderId={orderId} navigate={navigate} />
          </Elements>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKOUT FORM
// ═══════════════════════════════════════════════════════════════════════════

function CheckoutForm({ courses, pricing, navigate }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedIntent, setConfirmedIntent] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setConfirmedIntent(paymentIntent);
    }
    setSubmitting(false);
  };

  if (confirmedIntent) {
    return <SuccessScreen courses={courses} paymentIntent={confirmedIntent} navigate={navigate} />;
  }

  return (
    <div className="payment-form-card">
      <div className="form-header">
        <h2>Payment details</h2>
        <div className="secure-badge"><HiLockClosed size={12} /> Secured by Stripe</div>
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <PaymentElement />

        <button className="btn-pay" type="submit" disabled={!stripe || submitting}>
          {submitting ? (
            <><div className="spinner" /> Processing…</>
          ) : (
            <><HiLockClosed size={16} /> Pay ${pricing.total}</>
          )}
        </button>

        {errorMsg && (
          <span className="field-error"><HiExclamationCircle size={12} /> {errorMsg}</span>
        )}
      </form>

      <StripeFooter />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function SuccessScreen({ courses, paymentIntent, navigate }) {
  const amountPaid = (paymentIntent.amount / 100).toFixed(2);
  const firstCourseId = courses[0]?._id;

  return (
    <div className="payment-page">
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div className="success-screen">
          <div className="success-icon-wrap"><HiCheckCircle size={40} /></div>
          <h2>Payment successful!</h2>
          <p>
            You're enrolled in{" "}
            <strong>
              {courses.length === 1
                ? courses[0].title
                : `${courses.length} courses`}
            </strong>.<br />
            A receipt has been sent to your email.
          </p>
          <div className="success-details">
            <div className="success-detail-row">
              <span className="success-detail-label">Amount paid</span>
              <span className="success-detail-value">${amountPaid}</span>
            </div>
            <div className="success-detail-row">
              <span className="success-detail-label">Transaction ID</span>
              <span className="success-detail-value">{paymentIntent.id}</span>
            </div>
            <div className="success-detail-row">
              <span className="success-detail-label">Date</span>
              <span className="success-detail-value">
                {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <button
            className="btn-go-course"
            onClick={() => navigate(courses.length === 1 ? `/lecture/${firstCourseId}` : "/courses")}
          >
            Start learning <HiArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDER SUMMARY — now lists every course in the cart
// ═══════════════════════════════════════════════════════════════════════════

function OrderSummary({ courses, pricing, promoInput, setPromoInput, promoApplied, promoError, onApplyPromo, onRemovePromo }) {
  return (
    <div className="order-summary">
      <div className="summary-header">
        <h2>Order summary</h2>
        <p>Review your purchase before payment</p>
      </div>

      {courses.map((course) => (
        <div className="course-item" key={course._id}>
          <div className="course-thumb"><HiPlay size={28} /></div>
          <div className="course-details">
            <p className="course-title">{course.title}</p>
            <p className="course-instructor">By {course.instructor?.username || "Instructor"}</p>
            <div className="course-badges">
              <span className="badge blue"><HiUsers size={11} /> {(course.studentsEnrolledCount || 0).toLocaleString()}</span>
              <span className="badge purple"><HiPlay size={11} /> {course.lessonsCount ?? 0} lectures</span>
              <span className="badge green"><HiClock size={11} /> {course.duration}</span>
            </div>
          </div>
          <div className="price-col" style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="price-current">${course.price}</div>
          </div>
        </div>
      ))}

      <div style={{ padding: "14px 28px", borderBottom: "1px solid #f3f4f6" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>This order includes</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { icon: HiPlay, text: "On-demand video lectures" },
            { icon: HiDocumentText, text: "Downloadable resources & notes" },
            { icon: HiDownload, text: "Certificate of completion" },
            { icon: HiClock, text: "Full lifetime access" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#6b7280" }}>
              <Icon size={14} style={{ color: "#7c3aed", flexShrink: 0 }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="promo-section">
        <span className="promo-label">Promo code</span>
        <div className="promo-input-wrap">
          <input
            className={`promo-input${promoApplied ? " applied" : ""}`}
            placeholder="e.g. ACADEMY20"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            disabled={!!promoApplied}
          />
          {promoApplied ? (
            <button className="btn-promo" style={{ borderColor: "#dc2626", color: "#dc2626" }} onClick={onRemovePromo}>
              Remove
            </button>
          ) : (
            <button className="btn-promo" onClick={onApplyPromo}>Apply</button>
          )}
        </div>
        {promoApplied && pricing.discountPercent > 0 && (
          <div className="promo-success"><HiCheckCircle size={13} /> {pricing.discountPercent}% discount applied!</div>
        )}
        {promoError && (
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
            <HiExclamationCircle size={13} /> {promoError}
          </div>
        )}
      </div>

      <div className="price-breakdown">
        <div className="price-row">
          <span className="price-row-label">Subtotal</span>
          <span className="price-row-value">${pricing.coursePrice}</span>
        </div>
        {pricing.discountAmount > 0 && (
          <div className="price-row">
            <span className="price-row-label">Promo ({pricing.discountPercent}% off)</span>
            <span className="price-row-value discount">− ${pricing.discountAmount}</span>
          </div>
        )}
        <div className="price-row">
          <span className="price-row-label">Tax</span>
          <span className="price-row-value">${pricing.taxAmount}</span>
        </div>
        <hr className="price-divider" />
        <div className="price-total-row">
          <span className="price-total-label">Total due today</span>
          <span className="price-total-value">${pricing.total}</span>
        </div>
      </div>

      <div className="guarantees">
        {["30-day money-back guarantee", "256-bit SSL encrypted & secure", "Instant access after payment"].map((text) => (
          <div className="guarantee-item" key={text}>
            <HiShieldCheck size={15} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StripeFooter() {
  return (
    <div className="stripe-footer">
      Powered by&nbsp;
      <span className="stripe-logo"><SiStripe size={16} style={{ marginRight: 3 }} /> Stripe</span>
      &nbsp;· Your payment info is encrypted and secure.
    </div>
  );
}