// Edit this list to add, remove, or update your ebooks.
// paymentLink = the Stripe Payment Link URL for that specific ebook
// (Stripe Dashboard → Payment Links → Create link → paste the URL here).
// No code, no server needed for checkout itself.
const EBOOKS = [
  {
    id: "long-way-home",
    title: "The Long Way Home",
    price: "$9.00",
    color: "linear-gradient(135deg,#f59e0b,#b45309)",
    paymentLink: "https://buy.stripe.com/REPLACE_ME_1",
  },
  {
    id: "field-notes",
    title: "Field Notes",
    price: "$6.50",
    color: "linear-gradient(135deg,#78716c,#292524)",
    paymentLink: "https://buy.stripe.com/REPLACE_ME_2",
  },
  {
    id: "quiet-hours",
    title: "Quiet Hours",
    price: "$8.00",
    color: "linear-gradient(135deg,#57534e,#1c1917)",
    paymentLink: "https://buy.stripe.com/REPLACE_ME_3",
  },
  {
    id: "after-the-rain",
    title: "After the Rain",
    price: "$7.25",
    color: "linear-gradient(135deg,#d97706,#78350f)",
    paymentLink: "https://buy.stripe.com/REPLACE_ME_4",
  },
];
