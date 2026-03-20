# Salesforce Price List - Simulation

A static HTML/CSS/JavaScript simulation of the Digital Pricelist Tool (DPL) experience. No build step or server required.

## Features

- **View Price List** – Browse products with search, sort, and filters. Select products and **Add to Scratchpad** to create a scratchpad and open the **Scratchpad editor** (line items, editable **Qty** and **Discount %**, totals, Save / Export / Update products).
- **View Accounts** – Customer accounts table with search.
- **Access Saved Scratchpads** – Open any saved scratchpad in the same editor. New scratchpads from the price list appear at the top of the list.
- **Pricing Estimator** – Landing page lists **Saved estimations** (like scratchpads). **Create new estimation** opens a **3×3** grid after an interstitial. Each option opens a **question panel** (rows, times per day, users) the same width as the grid; **Add to estimate** returns to the menu and shows answers in a **panel to the right**. **Save Your Estimate** persists the record (including option answers) to the list.
- **Header** – Salesforce-style header with greeting and **#Support** link.
- **Marketing banner** – FY27 upgrade-finder banner image on **View Price List** only (below header, above tabs).
- **Country/Currency** – Modal to change country and currency (simulated).

## How to Run

1. Open `index.html` in your browser (double-click or drag into browser window).

   **Or** use a simple local server:

   ```bash
   # Python 3
   python3 -m http.server 8080

   # Then open http://localhost:8080
   ```

   ```bash
   # Node.js (npx)
   npx serve .

   # Then open the URL shown (e.g. http://localhost:3000)
   ```

2. Navigate using the tabs: **View Price List**, **View Accounts**, **Access Saved Scratchpads**.

3. On the Price List page:
   - Search products
   - Use filters (Price List, Sort, Pricing, Currency)
   - Check products to add to the scratchpad
   - Click **Add to Scratchpad** (shows an alert in this simulation)

## Files

- `index.html` – Structure and layout
- `styles.css` – Styling (Salesforce-inspired)
- `app.js` – Routing, state, and interactions
- `assets/salesforce-cloud-logo.png` – Header cloud logo
- `assets/marketing-banner.png` – Price list promotional banner
- `README.md` – This file

## Notes

This is a **simulation** only. It uses mock data and does not connect to any backend or Okta. It approximates the look and flow of the real Digital Pricelist Tool.
