"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Marquee } from "@/components/ui/marquee";

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

        <div className="relative mt-12 w-full overflow-hidden">
          <Marquee reverse={true} className="[--duration:40s]">
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
        <div className="flex flex-col items-center justify-center mt-14">
          <h1 className="text-2xl font-bold">Generate Invoice</h1>
          <input className="w-full max-w-md p-2 border border-gray-300 rounded-md mt-6" type="text" placeholder="Paste link to listing" value={url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} />
          <Button
          className="w-full max-w-md p-2 border border-gray-300 rounded-md mt-4 bg-orange-500 text-white hover:bg-orange-600"
           onClick={handleGenerateInvoice}
           disabled={!url||loading}
          >
            {loading ? "Generating..." : "Downlod PDF"}
          </Button>
        </div>


        
    </div>
    
  );
}
