import Script from "next/script";

const USERBACK_ACCESS_TOKEN = "A-4ZpPPe5LczvdcxjtN7NR41Dct";

/**
 * Loads the Userback feedback widget on every page.
 *
 * Once the app has authentication, identify the logged-in user by setting
 * `Userback.user_data = { id, info: { name, email } }` before the widget
 * script loads (see https://support.userback.io for the full schema).
 */
export function UserbackWidget() {
  return (
    <Script id="userback-widget" strategy="afterInteractive">
      {`window.Userback = window.Userback || {};
Userback.access_token = ${JSON.stringify(USERBACK_ACCESS_TOKEN)};
(function (d) {
  var s = d.createElement("script");
  s.async = true;
  s.src = "https://static.userback.io/widget/v1.js";
  (d.head || d.body).appendChild(s);
})(document);`}
    </Script>
  );
}
