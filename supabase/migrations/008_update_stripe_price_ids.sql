-- Update Stripe Price IDs for subscription plans
-- Replace these with your actual Stripe Price IDs from Stripe Dashboard

-- Premium Plan (R$ 49,00/mês)
UPDATE plans 
SET stripe_price_id = 'price_PREMIUM_ID_HERE'
WHERE code = 'premium';

-- Black Plan (R$ 99,00/mês)
UPDATE plans
SET stripe_price_id = 'price_BLACK_ID_HERE'
WHERE code = 'black';

-- Free plan doesn't need a Stripe Price ID
UPDATE plans
SET stripe_price_id = NULL
WHERE code = 'free';

-- To get your Stripe Price IDs:
-- 1. Go to https://dashboard.stripe.com/products
-- 2. Find your Premium and Black products
-- 3. Copy the Price ID (starts with price_)
-- 4. Replace the placeholders above with the actual IDs
