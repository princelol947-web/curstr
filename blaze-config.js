// Blaze Coins settings — edit freely, no other file needs to change.
window.BLAZE_CONFIG = {
  currency: '₹',
  perUnit: 5,                 // earn rate is "coins per ₹5 spent"
  tiers: [                    // min = lifetime coins needed
    { name: 'Bronze',   min: 0,    rate: 1.0, prize: 10,  perks: ['Earn 1 coin per ₹5', 'Weekly prize: 10 coins'] },
    { name: 'Silver',   min: 500,  rate: 1.1, prize: 25,  perks: ['Earn 1.1 coins per ₹5', 'Weekly prize: 25 coins'] },
    { name: 'Gold',     min: 1000, rate: 1.2, prize: 50,  perks: ['Earn 1.2 coins per ₹5', 'Weekly prize: 50 coins', 'Early access to new releases'] },
    { name: 'Platinum', min: 4150, rate: 1.5, prize: 100, perks: ['Earn 1.5 coins per ₹5', 'Weekly prize: 100 coins', 'Early access to new releases', 'Priority support'] }
  ],
  redeem: [                   // "Use" tab
    { id: 'off50',  title: '₹50 off your next ebook',  cost: 500 },
    { id: 'off120', title: '₹120 off your next ebook', cost: 1000 },
    { id: 'off300', title: '₹300 off your next ebook', cost: 2400 }
  ],
  prizeIntervalDays: 7,       // weekly prize cooldown
  demoButtons: true,          // shows a "simulate purchase" test button; set false when live
  table: 'blaze_coins'        // Supabase table (see SQL)
};
