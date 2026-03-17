/*
  navigation.js
  Small optional JavaScript for simple navigation behavior.

  Phase 1 goals:
  - Keep it minimal
  - Avoid frameworks
  - Make code easy to understand for beginners
*/

(function () {
  "use strict";

  // Highlight the current page in the navigation.
  // This helps users know where they are.
  var currentPath = window.location.pathname;
  var fileName = currentPath.split("/").pop();

  // When opening files locally, pathname can end with "/".
  // In that case, treat it as index.html.
  if (fileName === "") {
    fileName = "index.html";
  }

  var navLinks = document.querySelectorAll(".site-nav a");

  for (var i = 0; i < navLinks.length; i++) {
    var link = navLinks[i];
    var href = link.getAttribute("href");

    if (href === fileName) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  }

  /*
    Mobile header behavior
    ----------------------
    On mobile-sized screens:
    - Hide the header when the user scrolls DOWN.
    - Show the header again when the user scrolls UP.

    This keeps the header available, but gives more space while reading.
  */
  var header = document.querySelector(".site-header");

  // Only enable this behavior on smaller screens.
  // (Desktop keeps the sticky header visible.)
  if (header && window.matchMedia && window.matchMedia("(max-width: 820px)").matches) {
    var lastScrollY = window.pageYOffset || 0;

    window.addEventListener("scroll", function () {
      var currentScrollY = window.pageYOffset || 0;

      // Near the top, always show the header.
      if (currentScrollY < 10) {
        header.classList.remove("is-hidden");
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY) {
        // Scrolling down
        header.classList.add("is-hidden");
      } else {
        // Scrolling up
        header.classList.remove("is-hidden");
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }
})();
