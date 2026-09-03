import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { totalAmount } = req.body;

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'Monto de carrito inválido.' });
    }

    // Convertimos el monto exacto a centavos de dólar para Stripe
    const unitAmountInCents = Math.round(totalAmount * 100);

    // Creamos la sesión oficial de pago con el monto exacto al céntimo
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Compra en Pide Fácil',
            },
            unit_amount: unitAmountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/index.html?success=true`,
      cancel_url: `${req.headers.origin}/index.html?canceled=true`,
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Error creando la sesión de Stripe:', err.message);
    return res.status(500).json({ error: err.message });
  }
}