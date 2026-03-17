/*
  copy_to_clipboard.js
  -------------------
  Very small helper for the footer contact icons.

  Behavior:
  - Any link with class "js-copy" and a data-copy attribute will copy
    that text to the clipboard.
  - We show a short message ("Copied: ...") so the user knows it worked.

  Notes:
  - This is intentionally simple (no framework).
  - Clipboard support can vary, but modern browsers generally support it.
*/

(function () {
  "use strict";

  var copyLinks = document.querySelectorAll(".js-copy");
  var noteEl = document.getElementById("footerCopyNote");

  if (!copyLinks || copyLinks.length === 0) {
    return;
  }

  for (var i = 0; i < copyLinks.length; i++) {
    copyLinks[i].addEventListener("click", function (event) {
      event.preventDefault();

      var text = this.getAttribute("data-copy") || "";
      if (text === "") {
        return;
      }

      copyText(text, function (success) {
        if (noteEl) {
          if (success) {
            noteEl.textContent = "Copied: " + text;
          } else {
            noteEl.textContent = "Copy failed — please select and copy manually.";
          }

          // Clear message after a short delay so it doesn't clutter the footer.
          window.setTimeout(function () {
            noteEl.textContent = "";
          }, 2500);
        }
      });
    });
  }

  function copyText(text, callback) {
    // Preferred modern clipboard API
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () {
          callback(true);
        })
        .catch(function () {
          fallbackCopy(text, callback);
        });
      return;
    }

    // Fallback for older browsers
    fallbackCopy(text, callback);
  }

  function fallbackCopy(text, callback) {
    try {
      var temp = document.createElement("textarea");
      temp.value = text;
      temp.setAttribute("readonly", "");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";

      document.body.appendChild(temp);
      temp.select();

      var ok = document.execCommand("copy");
      document.body.removeChild(temp);

      callback(ok === true);
    } catch (e) {
      callback(false);
    }
  }
})();

