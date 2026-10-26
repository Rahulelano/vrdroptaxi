import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, Prose } from "@/components/InfoPage";
import { BRAND, seo } from "@/lib/seo";

export const Route = createFileRoute("/cancellation-policy")({
  head: () =>
    seo({
      title: `Cancellation & Refund Policy | ${BRAND}`,
      description: "Free cancellation before a driver is assigned. Know our cancellation charges, booking change rules and refund timelines for drop taxi bookings.",
      path: "/cancellation-policy",
    }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Cancellation Policy" intro="Plans change — here is exactly what happens when you cancel or modify a booking.">
      <Prose>
        <h2>Cancelling a booking</h2>
        <ul>
          <li>
            <b>Free cancellation</b> any time before a driver and vehicle are assigned to your trip.
          </li>
          <li>
            If the driver has already been <b>dispatched or has reached</b> your pickup location, a one-time cancellation fee of <b>₹300</b> applies.
          </li>
          <li>If the customer is not reachable at pickup for more than 30 minutes, the booking may be treated as cancelled with the same fee.</li>
        </ul>
        <h2>Changing a booking</h2>
        <ul>
          <li>Changes to pickup date, time, vehicle or route should be requested at least 8 hours before pickup.</li>
          <li>Route changes or extra stops during the trip need office approval and are charged at the per-km rate.</li>
        </ul>
        <h2>Refunds</h2>
        <p>
          If you paid an advance and are eligible for a refund, it is returned to the original payment method within 5–7 working days after the cancellation
          is confirmed.
        </p>
        <h2>If we cancel</h2>
        <p>
          In the rare case that we cannot provide a vehicle, we will inform you as early as possible and refund any advance in full, or arrange an
          alternative vehicle at the same fare.
        </p>
        <p>To cancel or change a booking, call or WhatsApp us with your booking ID.</p>
      </Prose>
    </InfoPage>
  );
}
