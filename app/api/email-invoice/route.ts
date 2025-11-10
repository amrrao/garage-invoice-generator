import { NextResponse } from "next/server";
import { Resend } from "resend";
import generateInvoice from "@/lib/generateinvoice";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, email, name } = body;

        if (!url || !email || !name) {
            return NextResponse.json(
                { error: "URL, email, and name are required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Extract UUID from URL (same logic as invoice route)
        const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
        const idMatch = url.match(uuidPattern);
        const id = idMatch?.[1];
        
        if (!id) {
            return NextResponse.json(
                { error: "Invalid listing URL", details: `Could not extract ID from URL: ${url}` },
                { status: 400 }
            );
        }

        // Fetch listing data (same as invoice route)
        const apiUrl = `https://garage-backend.onrender.com/listings/${id}`;
        const res = await fetch(apiUrl, { cache: "no-store" });
        
        if (!res.ok) {
            const errorText = await res.text().catch(() => "Unknown error");
            return NextResponse.json(
                {
                    error: "Failed to fetch listing",
                    details: errorText,
                    status: res.status,
                    url: apiUrl
                },
                { status: res.status }
            );
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

        // Generate PDF
        const pdfBuffer = await generateInvoice(data);

        // Sanitize title for filename
        const sanitizedTitle = data.title
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[^\x00-\x7F]/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");

        const filename = `${sanitizedTitle}_Invoice.pdf`;

        // Send email using Resend
        // Try with verified domain first, fallback to onboarding email for testing
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Contact <contact@shadowu.org>";
        
        const emailResult = await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: `Invoice for ${data.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #ff6600;">Invoice from Garage</h2>
                    <p>Dear ${name},</p>
                    <p>Please find attached the invoice for <strong>${data.title}</strong>.</p>
                    <p>If you have any questions, please contact us at (201)-293-7164 or support@withgarage.com.</p>
                    <p>Best regards,<br>The Garage Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                },
            ],
        });

        if (emailResult.error) {
            console.error("Resend error:", emailResult.error);
            console.error("Error details:", JSON.stringify(emailResult.error, null, 2));
            console.error("Attempted from email:", fromEmail);
            return NextResponse.json(
                { 
                    error: "Failed to send email", 
                    details: emailResult.error.message || JSON.stringify(emailResult.error),
                    attemptedFrom: fromEmail
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Invoice sent successfully",
        });
    } catch (error) {
        console.error("Error sending invoice email:", error);
        return NextResponse.json(
            {
                error: "Failed to send email",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

