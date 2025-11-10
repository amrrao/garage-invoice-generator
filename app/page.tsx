"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Marquee } from "@/components/ui/marquee";

export default function Home() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (urlString: string): boolean => {
    if (!urlString) return false;
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    return urlString.includes("listing") && uuidPattern.test(urlString);
  };

  async function handleDownloadInvoice() {
    if (!url || !name) return;
    

    if (!validateUrl(url)) {
      setError("Please enter a valid link");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/invoice?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === "Invalid listing URL" || errorData.error === "Failed to fetch listing") {
            errorMessage = "Please enter a valid link";
          } else {
            const parts = [];
            if (errorData.error) parts.push(errorData.error);
            if (errorData.details) parts.push(`Details: ${errorData.details}`);
            errorMessage = parts.length > 0 ? parts.join('\n') : errorMessage;
          }
        } catch {
          errorMessage = "Please enter a valid link";
        }
        setError(errorMessage);
        return;
      }
      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = fileURL;
      link.download = "invoice.pdf";
      link.click();

      link.remove();
      URL.revokeObjectURL(fileURL);
      setError(null);
    } catch (error) {
      console.error("Error generating invoice:", error);
      setError("Please enter a valid link");
    } finally {
      setLoading(false);
    }
  }

  const validateEmail = (emailString: string): boolean => {
    if (!emailString) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(emailString);
  };

  function handleEmailInvoice() {
    if (!url || !name) return;
    
    if (!validateUrl(url)) {
      setError("Please enter a valid link");
      return;
    }
    
    setError(null);
    setShowEmailModal(true);
  }

  async function handleSendEmail() {
    if (!email || !validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/email-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, email, name }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === "Invalid listing URL" || errorData.error === "Failed to fetch listing") {
            errorMessage = "Please enter a valid link";
          } else if (errorData.error === "Invalid email address") {
            errorMessage = "Please enter a valid email address";
          } else if (errorData.error === "Failed to send email") {
            errorMessage = `Failed to send email: ${errorData.details || "Unknown error"}`;
          } else {
            const parts = [];
            if (errorData.error) parts.push(errorData.error);
            if (errorData.details) parts.push(`Details: ${errorData.details}`);
            errorMessage = parts.length > 0 ? parts.join('\n') : errorMessage;
          }
        } catch {
          errorMessage = "Failed to send email. Please try again.";
        }
        setError(errorMessage);
        return;
      }

      const result = await response.json();
      setSentEmail(email);
      setShowEmailModal(false);
      setEmail("");
      setError(null);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error sending invoice email:", error);
      setError("Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  const firetruckImages = [
    "/firetrucks/firetruck-1.jpg",
    "/firetrucks/firetruck-2.jpg",
    "/firetrucks/firetruck-4.jpg",
    "/firetrucks/firetruck-5.jpg",
  ];

  return (
    <div>
      
      <Image className="ml-28 mt-6"
          src="/garage-logo.svg"
          alt="Garage logo"
          width={80}
          height={16}
        />
        <hr className="border-t border-gray-300 mt-6" />

        <div className="relative mt-8 w-full overflow-hidden">
          <Marquee reverse={false} className="[--duration:40s]">
            {firetruckImages.map((img, index) => (
              <div
                key={index}
                className="mx-4 h-96 w-[28rem] shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-md"
              >
                <Image
                  src={img}
                  alt={`Firetruck ${index + 1}`}
                  width={448}
                  height={384}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white"></div>
        </div>
        <div className="flex flex-col items-center justify-center mt-4">
          <h1 className="text-2xl font-bold">Generate Invoice</h1>
          <input 
            className={`w-full max-w-md p-2 border rounded-md mt-6 ${error && (error.includes("link") || error.includes("URL") || error.includes("listing")) ? 'border-red-500 text-red-600 placeholder:text-red-400' : 'border-gray-300'}`}
            type="text" 
            placeholder={error && (error.includes("link") || error.includes("URL") || error.includes("listing")) ? error : "Paste link to listing"} 
            value={url} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUrl(e.target.value);
              if (error && (error.includes("link") || error.includes("URL") || error.includes("listing"))) {
                setError(null);
              }
            }} 
          />
          <input 
            className="w-full max-w-md p-2 border border-gray-300 rounded-md mt-2" 
            type="text" 
            placeholder="Name of invoice recipient (required)" 
            value={name} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
          />
          <div className="flex flex-row justify-center gap-4">
          <Button
          className="px-5 border max-w-sm border-gray-300 rounded-md mt-4 bg-orange-500 text-white hover:bg-orange-600"
           onClick={handleDownloadInvoice}
           disabled={!url||!name||loading}
          >
            {loading ? "Generating..." : "Download Invoice"}
          </Button>
          <Button
          className="px-8 border max-w-sm border-gray-300 rounded-md mt-4 bg-orange-500 text-white hover:bg-orange-600"
           onClick={handleEmailInvoice}
           disabled={!url||!name||loading}
          >
            {loading ? "Sending..." : "Email Invoice"}
          </Button>
          </div>
          
        </div>

      {showEmailModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-200/60">

        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 className="text-xl font-bold mb-4">Enter Email Address</h2>
          <input
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendEmail();
            }}
          />
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-4 justify-end">
            <Button
              className="px-4 py-2 border border-gray-300 rounded-md bg-gray-200 hover:bg-gray-300"
              onClick={() => {
                setShowEmailModal(false);
                setEmail("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="px-4 py-2 border border-gray-300 rounded-md bg-orange-500 text-white hover:bg-orange-600"
              onClick={handleSendEmail}
              disabled={!email || loading}
            >
              {loading ? "Sending..." : "Send Invoice"}
            </Button>
          </div>
        </div>
      </div>
    )}

      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-200/60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Invoice Sent Successfully!</h2>
              <Button
                className="px-6 py-2 border border-gray-300 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSentEmail("");
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
        
    </div>
    
  );
}
