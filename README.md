# CareCycle: quarantine ward operations

A working prototype built for the FactWise Junior TPM assessment. It replaces the paper temperature journal at a 74-bed virus quarantine and treatment centre with one live app for **nurses, doctors, admin staff and the head doctor**.

## What it solves
| Problem today | CareCycle |
|---|---|
| Temperatures taken twice, or not at all | One reading per patient per day, with a live "To measure" queue |
| Doctors arrive before the temperature is taken | Visits unlock only after the reading. Doctors see a "Ready for visit" queue |
| Patients stay extra days | The 3-fever-free-day rule is checked automatically, then doctor approval goes to the admin discharge queue |
| Admin finds out about discharges late | Approved discharges appear for admin instantly. A bed board and waiting list fill the freed bed |
| Different wards use °C and °F thermometers | Readings can be entered in either unit and are stored with that unit. A view switch shows everything in °C, °F or as recorded, and a one-click tool standardises all stored records |
| No way to measure the 85% benchmark | Dashboard with recovery/mortality vs benchmark, 7-day trend, rounds compliance and alerts |

## Demo
Pick a role on the sign-in screen. Use **Demo ▸ Auto-complete rounds / Advance to next day** to fast-forward, and **Reset** to restore the scenario. Data is stored in your browser (localStorage).

## Tech
React 19 + Vite, Tailwind CSS, Recharts, lucide-react. All business rules live in `src/lib/logic.js`, and every state change goes through guarded reducer actions in `src/lib/store.jsx`.

```bash
npm install
npm run dev
```
