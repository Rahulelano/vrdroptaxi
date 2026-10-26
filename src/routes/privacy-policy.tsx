import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, Prose } from "@/components/InfoPage";
import { BRAND, PHONE_DISPLAY, seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
  head: () =>
    seo({
      title: `Privacy Policy | ${BRAND}`,
      description: `How ${BRAND} collects, uses and protects your name, phone number, email and trip details when you book a taxi with us.`,
      path: "/privacy-policy",
    }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Privacy Policy" intro="We only collect what we need to arrange your trip, and we never sell your data.">
      <Prose>
        <h2>Information we collect</h2>
        <ul>
          <li>Your name, phone number and email address when you book.</li>
          <li>Trip details: pickup and drop locations, date, time, vehicle and notes you add.</li>
          <li>Basic technical data (browser type, pages visited) to keep the website working and secure.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To confirm your booking, assign a driver and contact you about your trip.</li>
          <li>To send booking emails such as verification codes, confirmations and status updates.</li>
          <li>To improve our service and handle support requests or complaints.</li>
        </ul>
        <h2>Sharing</h2>
        <p>
          Your name, phone number and pickup details are shared only with the driver assigned to your trip. We do not sell or rent your personal
          information to anyone. We may disclose information if required by law.
        </p>
        <h2>Data security & retention</h2>
        <p>
          Booking data is stored on secured servers and accessible only to authorised staff. We keep booking records for accounting and support, and you can
          ask us to delete your details at any time.
        </p>
        <h2>Contact</h2>
        <p>
          For any privacy question or deletion request, call or WhatsApp us on <b>{PHONE_DISPLAY}</b>.
        </p>
      </Prose>
    </InfoPage>
  );
}
