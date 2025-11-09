"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {useState} from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleGenerateInvoice() {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/invoice?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          const parts = [];
          if (errorData.error) parts.push(errorData.error);
          if (errorData.details) parts.push(`Details: ${errorData.details}`);
          if (errorData.status) parts.push(`Status: ${errorData.status}`);
          if (errorData.url) parts.push(`URL: ${errorData.url}`);
          errorMessage = parts.length > 0 ? parts.join('\n') : errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.error("Error generating invoice:", errorMessage);
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
    } catch (error) {
      console.error("Error generating invoice:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Image className="ml-5 mt-7"
          src="/garage-logo.svg"
          alt="Garage logo"
          width={100}
          height={20}
        />
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Generate Invoice</h1>
          <input type="text" placeholder="Paste link to listing" value={url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} />
          <Button
           onClick={handleGenerateInvoice}
           disabled={!url||loading}
          >
            {loading ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
    </div>
    
  );
}
