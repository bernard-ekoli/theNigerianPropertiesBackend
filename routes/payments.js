import express from 'express'
import TransactionHistory from '../schemas/userTransaction.js'
import Listing from '../schemas/listings.js'
const router = express.Router()


router.get("/", async (req, res) => {
  res.end("Payment Route is working perfectly")
})

router.post("/initialize", async (req, res) => {
  try {
    const { listing_id, } = req.body;

    const listing = await Listing.findById(listing_id).populate('userId');
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const pricesFetch = await fetch(`${process.env.backend_url}/api/prices`);
    const priceResponse = await pricesFetch.json();

    const userPrice = priceResponse.data.prices[listing.duration] || 200;
    const featured = listing.featured ? priceResponse.data.prices.featuredListing : 0;
    const totalPriceInNaira = Number(userPrice + featured);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: listing.userId.email,
        amount: Math.round(totalPriceInNaira * 100), // Convert to Kobo
        currency: "NGN"
      })
    });

    const psRes = await response.json();
    res.status(200).json({
      success: true,
      access_code: psRes.data.access_code,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { reference, listing_id } = req.body;

    const listing = await Listing.findById(listing_id);
    if (!listing) return res.status(404).json({ success: false, error: "Listing not found" });

    const pricesFetch = await fetch(`${process.env.backend_url}/api/prices`);
    const priceResponse = await pricesFetch.json();
    const userPrice = priceResponse.data.prices[listing.duration] || 200;
    const featured = listing.featured ? priceResponse.data.prices.featuredListing : 0;

    const expectedAmountKobo = Math.round((userPrice + featured) * 100);

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    const data = await response.json();

    if (data.data.status === "success") {
      if (data.data.amount !== expectedAmountKobo) {
        return res.status(400).json({ success: false, error: "Amount mismatch" });
      }

      await Listing.findOneAndUpdate(
        { _id: listing_id },
        { $set: { status: 'active' } }
      );

      const transactionHistory = new TransactionHistory({
        userId: listing.userId,
        status: 'active',
        listingId: listing_id,
        amountPaid: data.data.amount // Store the actual Kobo amount paid
      });
      await transactionHistory.save();

      return res.json({ success: true });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: "Verification failed" });
  }
});


router.post("/webhook", async (req, res) => {

})

router.get("/history", async (req, res) => {

})
export default router