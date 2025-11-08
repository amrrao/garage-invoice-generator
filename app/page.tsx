"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {useState} from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  // async function handleGenerateInvoice() {
  //   if (!url) return;
  //   setLoading(true);
  //   try {
  //     const response = await fetch("/api/generate-invoice", {

    //}

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
          {/* <Button
           onClick={handleGenerateInvoice}
           disabled={!url||loading}
          >
            Generate Invoice
          </Button> */}
        </div>
    </div>
    
  );
}
