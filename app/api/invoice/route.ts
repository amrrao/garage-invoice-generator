import { NextResponse } from "next/server";
import generateInvoice from "@/lib/generateinvoice";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const idMatch = url.match(uuidPattern);
    const id = idMatch?.[1];
    if (!id){
        console.error("Invalid URL format:", url);
        return NextResponse.json({ error: "Invalid listing URL", details: `Could not extract ID from URL: ${url}` }, { status: 400 });
    }
    const apiUrl = `https://garage-backend.onrender.com/listings/${id}`;
    console.log("Fetching listing from:", apiUrl);
    try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        console.log("API response status:", res.status);
        if (!res.ok) {
            const errorText = await res.text().catch(() => "Unknown error");
            return NextResponse.json({ 
                error: "Failed to fetch listing", 
                details: errorText,
                status: res.status,
                url: apiUrl
            }, { status: res.status });
        }
        const listing = await res.json();
        const data = {
            title: listing.listingTitle || "Untitled Listing",
            price: listing.sellingPrice || listing.appraisedPrice || "N/A",
            description: listing.listingDescription || "No description provided.",
            brand: listing.itemBrand,
            year: listing.itemAge,
            category: listing.categoryV2?.name,
            state: listing.address?.state,
            image: listing.imageUrls?.[0],
        };

        const pdfBuffer = await generateInvoice(data);

        const sanitizedTitle = data.title
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[^\x00-\x7F]/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${sanitizedTitle}_Invoice.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error fetching listing:", error);
        return NextResponse.json({ 
            error: "Failed to fetch listing", 
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
