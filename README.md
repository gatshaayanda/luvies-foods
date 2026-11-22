# Luvie's Foods

**Good food, made with love.**

Luvie's Foods is a mobile-first food storefront and connected customer/owner workspace for Gaborone, Botswana.

## Main experience

- **Store** — the public storefront, live menu, announcements and in-place order checkout.
- **Account** — a customer account that can be created and used even when no menu items are currently published; customers can save their details and follow their orders.
- **Briefcase** — the private owner workspace for menu CRUD, orders, payments and business operations.

Ordering opens from the Store as an integrated checkout sheet. The legacy `/order` URL redirects into that Store experience. `/store` redirects to the homepage. Customer order tracking links remain available where needed.

## Business configuration

- Business: Luvie's Foods
- Owner/operator: Lesedi
- Currency: BWP
- Brand colours: red #db0b0b, navy #202b3c, rose #c04467
- Confirmed starter menu: Rice and chicken — P40; Rice and beef — P40
- Uploads: UploadThing; no Firebase Storage dependency
- Data/auth: dedicated Firebase project configured by the product owner

The starter meals are created only through the authorised owner Briefcase when the menu collection is empty. No orders, customers, sales or stock are fabricated.

## Development

```bash
npm install
npm run lint
npm run build
```

The build runs the identity, offline and typography verifiers before Next.js production compilation. The PWA installation lifecycle and service-worker protections are inherited and locked; routine identity changes must not rewrite their behavior.

## Environment

Use the project's own Firebase client configuration and UploadThing environment values. Never copy credentials or project identifiers from Iteration 13, John the Stylist, The Plug or another client.
