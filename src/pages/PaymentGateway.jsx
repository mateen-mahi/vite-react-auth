import React, { useState } from "react";
import {
  HiShieldCheck,
  HiLockClosed,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowRight,
  HiCreditCard,
  HiRefresh,
  HiStar,
  HiUsers,
  HiClock,
  HiPlay,
  HiDocumentText,
  HiDownload,
} from "react-icons/hi";
import { SiGooglepay, SiApplepay, SiStripe } from "react-icons/si";
import "../styles/stripePayment.css";

// ─── Course data (replace with your real data / props) ───────────────────────
const COURSE = {
  title: "Complete Python Bootcamp: Zero to Hero",
  instructor: "Ali Hassan",
  rating: 4.9,
  students: 12847,
  lectures: 94,
  hours: 22,
  originalPrice: 79.99,
  salePrice: 14.99,
  image: null, // swap in an <img> if you have one
};

// ─── Valid promo codes ────────────────────────────────────────────────────────
const PROMO_CODES = {
  ACADEMY20: 20,
  SAVE10: 10,
  WELCOME50: 50,
};

// ─── Card number formatter ────────────────────────────────────────────────────
function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + " / " + digits.slice(2);
  return digits;
}

function formatCVC(value) {
  return value.replace(/\D/g, "").slice(0, 4);
}

// ─── Detect card brand ───────────────────────────────────────────────────────
function detectBrand(number) {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mc";
  if (/^3[47]/.test(n)) return "amex";
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StripePayment() {
  // ── Tab state ──
  const [activeTab, setActiveTab] = useState("card"); // "card" | "upi"

  // ── Promo code ──
  const [promoCode, setPromoCode]     = useState("");
  const [promoApplied, setPromoApplied] = useState(null); // discount %
  const [promoError, setPromoError]   = useState("");

  // ── Card form fields ──
  const [cardHolder, setCardHolder]   = useState("");
  const [cardNumber, setCardNumber]   = useState("");
  const [expiry, setExpiry]           = useState("");
  const [cvc, setCvc]                 = useState("");
  const [saveCard, setSaveCard]       = useState(false);

  // ── UPI ──
  const [upiId, setUpiId] = useState("");

  // ── Validation errors ──
  const [errors, setErrors] = useState({});

  // ── Loading / success ──
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Pricing ──
  const discount = promoApplied
    ? ((COURSE.salePrice * promoApplied) / 100).toFixed(2)
    : null;
  const gst  = (((COURSE.salePrice - (discount || 0)) * 0.18)).toFixed(2);
  const total = (COURSE.salePrice - (discount || 0) + parseFloat(gst)).toFixed(2);

  const cardBrand = detectBrand(cardNumber);

  // ── Apply promo ──
  const handlePromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setPromoApplied(PROMO_CODES[code]);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code.");
      setPromoApplied(null);
    }
  };

  // ── Validate ──
  const validate = () => {
    const e = {};
    if (activeTab === "card") {
      if (!cardHolder.trim()) e.cardHolder = "Cardholder name is required.";
      if (cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Enter a valid 16-digit card number.";
      if (expiry.replace(/\s/g, "").length < 4) e.expiry = "Enter a valid expiry date.";
      if (cvc.length < 3) e.cvc = "Enter a valid CVC.";
    } else {
      if (!upiId.includes("@")) e.upiId = "Enter a valid UPI ID (e.g. name@upi).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    // Simulate Stripe API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2200);
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="payment-page">
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div className="success-screen">
            <div className="success-icon-wrap">
              <HiCheckCircle size={40} />
            </div>
            <h2>Payment successful!</h2>
            <p>
              You're enrolled in <strong>{COURSE.title}</strong>.<br />
              A receipt has been sent to your email.
            </p>
            <div className="success-details">
              <div className="success-detail-row">
                <span className="success-detail-label">Amount paid</span>
                <span className="success-detail-value">${total}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Payment method</span>
                <span className="success-detail-value">
                  {activeTab === "card"
                    ? `•••• ${cardNumber.replace(/\s/g, "").slice(-4)}`
                    : upiId}
                </span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Transaction ID</span>
                <span className="success-detail-value">
                  TXN{Math.random().toString(36).slice(2, 10).toUpperCase()}
                </span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Date</span>
                <span className="success-detail-value">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <button
              className="btn-go-course"
              onClick={() => alert("Navigate to course player")}
            >
              Start learning <HiArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main payment UI ──
  return (
    <div className="payment-page">
      <div className="payment-container">

        {/* ══ LEFT: Order summary ══ */}
        <div className="order-summary">
          <div className="summary-header">
            <h2>Order summary</h2>
            <p>Review your purchase before payment</p>
          </div>

          {/* Course item */}
          <div className="course-item">
            <div className="course-thumb">
              <HiPlay size={28} />
            </div>
            <div className="course-details">
              <p className="course-title">{COURSE.title}</p>
              <p className="course-instructor">By {COURSE.instructor}</p>
              <div className="course-badges">
                <span className="badge amber">
                  <HiStar size={11} /> {COURSE.rating}
                </span>
                <span className="badge blue">
                  <HiUsers size={11} /> {COURSE.students.toLocaleString()}
                </span>
                <span className="badge purple">
                  <HiPlay size={11} /> {COURSE.lectures} lectures
                </span>
                <span className="badge green">
                  <HiClock size={11} /> {COURSE.hours} hrs
                </span>
              </div>
            </div>
            <div className="price-col" style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="price-original">${COURSE.originalPrice}</div>
              <div className="price-current">${COURSE.salePrice}</div>
            </div>
          </div>

          {/* What you get */}
          <div style={{ padding: "14px 28px", borderBottom: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              This course includes
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: HiPlay,         text: `${COURSE.lectures} on-demand video lectures` },
                { icon: HiDocumentText, text: "Downloadable resources & notes" },
                { icon: HiDownload,     text: "Certificate of completion" },
                { icon: HiClock,        text: "Full lifetime access" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#6b7280" }}>
                  <Icon size={14} style={{ color: "#7c3aed", flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Promo code */}
          <div className="promo-section">
            <span className="promo-label">Promo code</span>
            <div className="promo-input-wrap">
              <input
                className={`promo-input${promoApplied ? " applied" : ""}`}
                placeholder="e.g. ACADEMY20"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                disabled={!!promoApplied}
              />
              {promoApplied ? (
                <button
                  className="btn-promo"
                  style={{ borderColor: "#dc2626", color: "#dc2626" }}
                  onClick={() => { setPromoApplied(null); setPromoCode(""); }}
                >
                  Remove
                </button>
              ) : (
                <button className="btn-promo" onClick={handlePromo}>
                  Apply
                </button>
              )}
            </div>
            {promoApplied && (
              <div className="promo-success">
                <HiCheckCircle size={13} />
                {promoApplied}% discount applied!
              </div>
            )}
            {promoError && (
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <HiExclamationCircle size={13} /> {promoError}
              </div>
            )}
          </div>

          {/* Price breakdown */}
          <div className="price-breakdown">
            <div className="price-row">
              <span className="price-row-label">Course price</span>
              <span className="price-row-value">${COURSE.salePrice}</span>
            </div>
            {promoApplied && (
              <div className="price-row">
                <span className="price-row-label">Promo ({promoApplied}% off)</span>
                <span className="price-row-value discount">− ${discount}</span>
              </div>
            )}
            <div className="price-row">
              <span className="price-row-label">GST (18%)</span>
              <span className="price-row-value">${gst}</span>
            </div>
            <hr className="price-divider" />
            <div className="price-total-row">
              <span className="price-total-label">Total due today</span>
              <span className="price-total-value">${total}</span>
            </div>
          </div>

          {/* Guarantees */}
          <div className="guarantees">
            {[
              "30-day money-back guarantee",
              "256-bit SSL encrypted & secure",
              "Instant access after payment",
            ].map((text) => (
              <div className="guarantee-item" key={text}>
                <HiShieldCheck size={15} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT: Payment form ══ */}
        <div className="payment-form-card">
          <div className="form-header">
            <h2>Payment details</h2>
            <div className="secure-badge">
              <HiLockClosed size={12} />
              Secured by Stripe
            </div>
          </div>

          {/* Tabs */}
          <div className="payment-tabs">
            <button
              className={`tab-btn${activeTab === "card" ? " active" : ""}`}
              onClick={() => setActiveTab("card")}
            >
              <HiCreditCard size={15} /> Credit / Debit card
            </button>
            <button
              className={`tab-btn${activeTab === "upi" ? " active" : ""}`}
              onClick={() => setActiveTab("upi")}
            >
              <HiRefresh size={14} /> UPI
            </button>
          </div>

          <div className="form-body">

            {activeTab === "card" && (
              <>
                {/* Express pay */}
                <div className="express-buttons">
                  <button className="btn-express gpay">
                    <SiGooglepay size={28} />
                  </button>
                  <button className="btn-express apple">
                    <SiApplepay size={28} />
                  </button>
                </div>

                <div className="or-divider">or pay with card</div>

                {/* Cardholder name */}
                <div className="field-group">
                  <label className="field-label">Cardholder name</label>
                  <input
                    className={`field-input${errors.cardHolder ? " error" : ""}`}
                    placeholder="Name as on card"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                  />
                  {errors.cardHolder && (
                    <span className="field-error">
                      <HiExclamationCircle size={12} /> {errors.cardHolder}
                    </span>
                  )}
                </div>

                {/* Card number */}
                <div className="field-group">
                  <label className="field-label">Card number</label>
                  <div className="card-input-wrap">
                    <input
                      className={`field-input${errors.cardNumber ? " error" : ""}`}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      inputMode="numeric"
                    />
                    <div className="card-brand-icons">
                      <div className={`card-brand visa${cardBrand && cardBrand !== "visa" ? " opacity-30" : ""}`}
                        style={{ opacity: cardBrand && cardBrand !== "visa" ? 0.3 : 1 }}>
                        VISA
                      </div>
                      <div className={`card-brand mc`}
                        style={{ opacity: cardBrand && cardBrand !== "mc" ? 0.3 : 1 }}>
                        MC
                      </div>
                    </div>
                  </div>
                  {errors.cardNumber && (
                    <span className="field-error">
                      <HiExclamationCircle size={12} /> {errors.cardNumber}
                    </span>
                  )}
                </div>

                {/* Expiry + CVC */}
                <div className="field-row">
                  <div className="field-group">
                    <label className="field-label">Expiry date</label>
                    <input
                      className={`field-input${errors.expiry ? " error" : ""}`}
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      inputMode="numeric"
                    />
                    {errors.expiry && (
                      <span className="field-error">
                        <HiExclamationCircle size={12} /> {errors.expiry}
                      </span>
                    )}
                  </div>
                  <div className="field-group">
                    <label className="field-label">CVC / CVV</label>
                    <input
                      className={`field-input${errors.cvc ? " error" : ""}`}
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(formatCVC(e.target.value))}
                      inputMode="numeric"
                    />
                    {errors.cvc && (
                      <span className="field-error">
                        <HiExclamationCircle size={12} /> {errors.cvc}
                      </span>
                    )}
                    <span className="field-hint">3 digits on back of card</span>
                  </div>
                </div>

                {/* Save card */}
                <label className="save-card-row">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  <span className="save-card-label">
                    Save card for future purchases
                  </span>
                </label>
              </>
            )}

            {activeTab === "upi" && (
              <div className="field-group">
                <label className="field-label">UPI ID</label>
                <input
                  className={`field-input${errors.upiId ? " error" : ""}`}
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                {errors.upiId && (
                  <span className="field-error">
                    <HiExclamationCircle size={12} /> {errors.upiId}
                  </span>
                )}
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  You'll receive a payment request on your UPI app.
                </p>
              </div>
            )}

            {/* Pay button */}
            <button
              className="btn-pay"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Processing…
                </>
              ) : (
                <>
                  <HiLockClosed size={16} />
                  Pay ${total}
                </>
              )}
            </button>

          </div>

          {/* Stripe branding footer */}
          <div className="stripe-footer">
            Powered by&nbsp;
            <span className="stripe-logo">
              <SiStripe size={16} style={{ marginRight: 3 }} />
              Stripe
            </span>
            &nbsp;· Your payment info is encrypted and secure.
          </div>
        </div>

      </div>
    </div>
  );
}